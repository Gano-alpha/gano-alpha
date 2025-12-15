import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.150.133.161:8000'

interface SimulationRequest {
  scenario: string
  portfolioTickers?: string[]
  shockTicker?: string
  shockMagnitude?: number
}

interface AffectedStock {
  ticker: string
  name: string
  impact: number
  exposure: 'Direct' | 'Indirect'
  reason: string
  pathLength: number
}

interface SimulationResult {
  summary: {
    totalImpact: number
    affectedStocks: number
    criticalNodes: number
    recoveryTime: string
  }
  affectedStocks: AffectedStock[]
  propagationPaths: {
    from: string
    to: string
    strength: number
  }[]
  mitigations: string[]
}

interface ShockPropagationResponse {
  shock_ticker: string
  shock_magnitude_pct: number
  max_hops: number
  impacted_tickers: {
    ticker: string
    hop: number
    direction: string
    propagation_path: string[]
    cumulative_edge_weight: number
    transmission_factor: number
    estimated_impact_pct: number
  }[]
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  try {
    const body: SimulationRequest = await request.json()

    if (!body.scenario) {
      return NextResponse.json(
        { error: 'Scenario is required' },
        { status: 400 }
      )
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Extract ticker from scenario or use provided shockTicker
    const tickerPattern = /\b([A-Z]{1,5})\b/g
    const mentionedTickers = body.scenario.match(tickerPattern) || []
    const shockTicker = body.shockTicker || mentionedTickers[0]

    if (!shockTicker) {
      return NextResponse.json({
        summary: {
          totalImpact: 0,
          affectedStocks: 0,
          criticalNodes: 0,
          recoveryTime: 'N/A',
        },
        affectedStocks: [],
        propagationPaths: [],
        mitigations: [
          'No ticker symbols found in scenario',
          'Please include specific ticker symbols (e.g., NVDA, AAPL, TSM)',
        ],
      })
    }

    // Calculate shock magnitude based on scenario keywords
    const severityMultiplier = calculateSeverity(body.scenario.toLowerCase())
    const shockMagnitude = body.shockMagnitude || -(15 * severityMultiplier)

    // Call backend shock-propagation endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/graph/shock-propagation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shock_ticker: shockTicker,
          shock_magnitude_pct: shockMagnitude,
          max_hops: 2,
          transmission_decay: 0.8,
        }),
      })

      if (response.ok) {
        const data: ShockPropagationResponse = await response.json()
        return NextResponse.json(transformShockResponse(data, body.scenario))
      }

      // If 404 (ticker not in graph), fall back to supply chain analysis
      if (response.status === 404) {
        const result = await analyzeScenarioFallback(body.scenario, body.portfolioTickers, authHeader)
        return NextResponse.json(result)
      }
    } catch {
      // Backend not available, fall back
    }

    // Fallback to supply chain analysis
    const result = await analyzeScenarioFallback(body.scenario, body.portfolioTickers, authHeader)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    )
  }
}

function transformShockResponse(data: ShockPropagationResponse, scenario: string): SimulationResult {
  const affectedStocks: AffectedStock[] = data.impacted_tickers.map((impact) => ({
    ticker: impact.ticker,
    name: impact.ticker, // Name would need separate lookup
    impact: Math.round(impact.estimated_impact_pct * 10) / 10,
    exposure: impact.hop === 1 ? 'Direct' : 'Indirect',
    reason: `${impact.direction} path: ${impact.propagation_path.join(' → ')}`,
    pathLength: impact.hop,
  }))

  const propagationPaths = data.impacted_tickers
    .filter((impact) => impact.propagation_path.length >= 2)
    .map((impact) => ({
      from: impact.propagation_path[impact.propagation_path.length - 2] || data.shock_ticker,
      to: impact.ticker,
      strength: impact.cumulative_edge_weight,
    }))

  const totalImpact = affectedStocks.length > 0
    ? Math.round(affectedStocks.reduce((sum, s) => sum + s.impact, 0) / affectedStocks.length * 10) / 10
    : 0

  return {
    summary: {
      totalImpact,
      affectedStocks: affectedStocks.length,
      criticalNodes: affectedStocks.filter((s) => s.exposure === 'Direct').length,
      recoveryTime: estimateRecoveryTime(Math.abs(data.shock_magnitude_pct) / 10, affectedStocks.length),
    },
    affectedStocks,
    propagationPaths,
    mitigations: generateMitigations(affectedStocks),
  }
}

async function analyzeScenarioFallback(
  scenario: string,
  portfolioTickers?: string[],
  authHeader?: string | null
): Promise<SimulationResult> {
  // Extract ticker mentions from scenario (e.g., NVDA, AAPL, TSM)
  const tickerPattern = /\b([A-Z]{1,5})\b/g
  const mentionedTickers = scenario.match(tickerPattern) || []

  // Deduplicate tickers
  const uniqueTickers = Array.from(new Set(mentionedTickers))

  if (uniqueTickers.length === 0) {
    return {
      summary: {
        totalImpact: 0,
        affectedStocks: 0,
        criticalNodes: 0,
        recoveryTime: 'N/A',
      },
      affectedStocks: [],
      propagationPaths: [],
      mitigations: [
        'No ticker symbols found in scenario',
        'Please include specific ticker symbols (e.g., NVDA, AAPL, TSM)',
        'Example: "NVDA supply chain disruption due to Taiwan crisis"',
      ],
    }
  }

  // Fetch supply chain data for all mentioned tickers from backend
  const affectedStocks: AffectedStock[] = []
  const propagationPaths: { from: string; to: string; strength: number }[] = []
  const processedTickers = new Set<string>()

  // Calculate severity multiplier based on scenario keywords
  const severityMultiplier = calculateSeverity(scenario.toLowerCase())

  for (const ticker of uniqueTickers) {
    if (processedTickers.has(ticker)) continue

    try {
      // Build headers with auth forwarding
      const fetchHeaders: HeadersInit = { 'Content-Type': 'application/json' }
      if (authHeader) {
        fetchHeaders['Authorization'] = authHeader
      }

      // Fetch real supply chain data from backend
      const response = await fetch(`${BACKEND_URL}/api/supply-chain/${ticker}`, {
        headers: fetchHeaders,
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        processedTickers.add(ticker)

        // Add the main ticker as directly affected
        const baseImpact = -(15 + Math.random() * 15) * severityMultiplier
        affectedStocks.push({
          ticker,
          name: data.name || ticker,
          impact: Math.round(baseImpact * 10) / 10,
          exposure: 'Direct',
          reason: `${data.name || ticker} directly mentioned in scenario`,
          pathLength: 1,
        })

        // Add suppliers from real supply chain data (shock propagates upstream)
        for (const supplier of (data.suppliers || [])) {
          if (!processedTickers.has(supplier.ticker)) {
            processedTickers.add(supplier.ticker)
            const supplierImpact = -(3 + Math.random() * 7) * severityMultiplier * (supplier.confidence || 0.7)
            affectedStocks.push({
              ticker: supplier.ticker,
              name: supplier.name,
              impact: Math.round(supplierImpact * 10) / 10,
              exposure: 'Indirect',
              reason: `Supplier to ${ticker}: ${supplier.relation || 'component supplier'}`,
              pathLength: 2,
            })
            propagationPaths.push({
              from: ticker,
              to: supplier.ticker,
              strength: supplier.confidence || 0.7,
            })
          }
        }

        // Add customers from real supply chain data (shock propagates downstream)
        for (const customer of (data.customers || [])) {
          if (!processedTickers.has(customer.ticker)) {
            processedTickers.add(customer.ticker)
            const customerImpact = -(5 + Math.random() * 10) * severityMultiplier * (customer.confidence || 0.7)
            affectedStocks.push({
              ticker: customer.ticker,
              name: customer.name,
              impact: Math.round(customerImpact * 10) / 10,
              exposure: 'Indirect',
              reason: `Customer of ${ticker}: ${customer.relation || 'major customer'}`,
              pathLength: 2,
            })
            propagationPaths.push({
              from: ticker,
              to: customer.ticker,
              strength: customer.confidence || 0.7,
            })
          }
        }
      }
    } catch (error) {
      console.error(`Failed to fetch supply chain for ${ticker}:`, error)
    }
  }

  if (affectedStocks.length === 0) {
    return {
      summary: {
        totalImpact: 0,
        affectedStocks: 0,
        criticalNodes: 0,
        recoveryTime: 'N/A',
      },
      affectedStocks: [],
      propagationPaths: [],
      mitigations: [
        'No supply chain data found for the mentioned tickers',
        'Try using different ticker symbols that have supply chain data',
      ],
    }
  }

  // Sort by impact (most negative first)
  affectedStocks.sort((a, b) => a.impact - b.impact)

  // Calculate summary metrics
  const totalImpact = Math.round(
    affectedStocks.reduce((sum, s) => sum + s.impact, 0) / affectedStocks.length * 10
  ) / 10
  const criticalNodes = affectedStocks.filter((s) => s.exposure === 'Direct').length

  return {
    summary: {
      totalImpact,
      affectedStocks: affectedStocks.length,
      criticalNodes,
      recoveryTime: estimateRecoveryTime(severityMultiplier, affectedStocks.length),
    },
    affectedStocks,
    propagationPaths,
    mitigations: generateMitigations(affectedStocks),
  }
}

function calculateSeverity(scenario: string): number {
  if (scenario.includes('war') || scenario.includes('invasion') || scenario.includes('blockade')) {
    return 1.5
  }
  if (scenario.includes('crisis') || scenario.includes('collapse') || scenario.includes('shutdown')) {
    return 1.2
  }
  if (scenario.includes('shortage') || scenario.includes('disruption') || scenario.includes('delay')) {
    return 1.0
  }
  return 0.8
}

function estimateRecoveryTime(severity: number, affectedCount: number): string {
  if (severity >= 1.5 && affectedCount > 5) return '12-18 months'
  if (severity >= 1.2 && affectedCount > 3) return '6-12 months'
  if (severity >= 1.0 && affectedCount > 2) return '3-6 months'
  return '1-3 months'
}

function generateMitigations(affectedStocks: AffectedStock[]): string[] {
  const mitigations: string[] = []
  const directlyAffected = affectedStocks.filter((s) => s.exposure === 'Direct')
  const indirectlyAffected = affectedStocks.filter((s) => s.exposure === 'Indirect')

  if (directlyAffected.length > 0) {
    const tickers = directlyAffected.slice(0, 3).map((s) => s.ticker).join(', ')
    mitigations.push(`Consider hedging ${tickers} positions with protective puts`)
  }

  if (affectedStocks.length > 5) {
    mitigations.push('High supply chain concentration risk - consider sector diversification')
  }

  if (indirectlyAffected.length > 0) {
    const tickers = indirectlyAffected.slice(0, 3).map((s) => s.ticker).join(', ')
    mitigations.push(`Monitor secondary effects on ${tickers}`)
  }

  mitigations.push('Review stop-loss levels for affected positions')

  return mitigations
}
