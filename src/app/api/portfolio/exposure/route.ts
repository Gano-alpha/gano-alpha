import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.150.133.161:8000'

interface ExposureNode {
  ticker: string
  name: string
  directExposure: number
  indirectExposure: number
  totalExposure: number
  pathCount: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface PortfolioExposure {
  totalIndirectExposure: number
  concentrationRisk: number
  topExposures: ExposureNode[]
  geographicBreakdown: {
    region: string
    exposure: number
  }[]
  sectorBreakdown: {
    sector: string
    exposure: number
  }[]
  warnings: string[]
}

interface PortfolioRiskResponse {
  total_risk_score: number
  direct_risk: number
  indirect_risk: number
  ticker_contributions: {
    ticker: string
    weight: number
    risk_score: number
    contribution: number
  }[]
  shock_scenario?: {
    shock_ticker: string
    impacted_tickers: {
      ticker: string
      estimated_impact_pct: number
    }[]
  }
  risk_source: string
  explanation: string
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  try {
    const body = await request.json()
    const { tickers, weights } = body

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio tickers array is required' },
        { status: 400 }
      )
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Build holdings with equal weights if not provided
    const totalTickers = tickers.length
    const holdings = tickers.map((ticker: string, idx: number) => ({
      ticker,
      weight: weights?.[idx] || 1.0 / totalTickers,
    }))

    // Try backend portfolio-risk endpoint
    try {
      const response = await fetch(`${BACKEND_URL}/graph/portfolio-risk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ holdings }),
      })

      if (response.ok) {
        const data: PortfolioRiskResponse = await response.json()
        return NextResponse.json(transformPortfolioRiskResponse(data, tickers))
      }
    } catch {
      // Backend not available
    }

    // Fallback to generated exposure analysis
    const result = generateExposureAnalysis(tickers)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Portfolio exposure error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze portfolio exposure' },
      { status: 500 }
    )
  }
}

function transformPortfolioRiskResponse(data: PortfolioRiskResponse, tickers: string[]): PortfolioExposure {
  const topExposures: ExposureNode[] = data.ticker_contributions.map((tc) => ({
    ticker: tc.ticker,
    name: tc.ticker,
    directExposure: tc.weight * 100,
    indirectExposure: tc.contribution * 100,
    totalExposure: (tc.weight + tc.contribution) * 100,
    pathCount: Math.ceil(tc.risk_score * 10),
    riskLevel: getRiskLevel(tc.risk_score),
  }))

  const warnings: string[] = []
  if (data.total_risk_score > 0.7) {
    warnings.push('High overall portfolio risk detected')
  }
  if (data.indirect_risk > data.direct_risk) {
    warnings.push('Significant indirect/hidden supply chain exposure')
  }
  warnings.push(data.explanation)

  return {
    totalIndirectExposure: data.indirect_risk * 100,
    concentrationRisk: Math.round(data.total_risk_score * 100),
    topExposures,
    geographicBreakdown: [],
    sectorBreakdown: [],
    warnings,
  }
}

function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore >= 0.8) return 'critical'
  if (riskScore >= 0.6) return 'high'
  if (riskScore >= 0.3) return 'medium'
  return 'low'
}

function generateExposureAnalysis(tickers: string[]): PortfolioExposure {
  // Calculate mock exposures based on portfolio composition
  const hasSemiconductors = tickers.some((t) =>
    ['NVDA', 'AMD', 'INTC', 'TSM', 'QCOM', 'AVGO', 'MU'].includes(t)
  )
  const hasTech = tickers.some((t) =>
    ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN'].includes(t)
  )

  const topExposures: ExposureNode[] = []
  const warnings: string[] = []

  // TSM is usually the biggest hidden exposure
  if (hasSemiconductors || hasTech) {
    topExposures.push({
      ticker: 'TSM',
      name: 'Taiwan Semiconductor',
      directExposure: tickers.includes('TSM') ? 8.5 : 0,
      indirectExposure: 42.3,
      totalExposure: tickers.includes('TSM') ? 50.8 : 42.3,
      pathCount: 12,
      riskLevel: 'critical',
    })

    if (topExposures[0].totalExposure > 40) {
      warnings.push(
        'Critical: Over 40% portfolio exposure to Taiwan Semiconductor manufacturing'
      )
    }
  }

  // ASML for equipment
  if (hasSemiconductors) {
    topExposures.push({
      ticker: 'ASML',
      name: 'ASML Holding',
      directExposure: tickers.includes('ASML') ? 5.2 : 0,
      indirectExposure: 28.7,
      totalExposure: tickers.includes('ASML') ? 33.9 : 28.7,
      pathCount: 8,
      riskLevel: 'high',
    })
  }

  // Memory exposure
  topExposures.push({
    ticker: 'MU',
    name: 'Micron Technology',
    directExposure: tickers.includes('MU') ? 4.1 : 0,
    indirectExposure: 18.5,
    totalExposure: tickers.includes('MU') ? 22.6 : 18.5,
    pathCount: 6,
    riskLevel: 'medium',
  })

  // Rare earth / materials
  topExposures.push({
    ticker: 'CHINA_RARE',
    name: 'China Rare Earth Supply',
    directExposure: 0,
    indirectExposure: 15.2,
    totalExposure: 15.2,
    pathCount: 4,
    riskLevel: 'medium',
  })

  // Energy
  topExposures.push({
    ticker: 'ENERGY',
    name: 'Energy Supply Chain',
    directExposure: 0,
    indirectExposure: 8.4,
    totalExposure: 8.4,
    pathCount: 3,
    riskLevel: 'low',
  })

  // Additional warnings
  if (hasSemiconductors && hasTech) {
    warnings.push(
      'High concentration in semiconductor supply chain - consider diversification'
    )
  }

  if (tickers.length < 5) {
    warnings.push('Portfolio has limited diversification - recommend 10+ holdings')
  }

  const totalIndirectExposure = topExposures.reduce(
    (sum, e) => sum + e.indirectExposure,
    0
  )

  return {
    totalIndirectExposure: Math.min(totalIndirectExposure, 100),
    concentrationRisk: calculateConcentrationRisk(topExposures),
    topExposures: topExposures.slice(0, 10),
    geographicBreakdown: [
      { region: 'Taiwan', exposure: 45.2 },
      { region: 'China', exposure: 18.5 },
      { region: 'South Korea', exposure: 12.3 },
      { region: 'Japan', exposure: 8.7 },
      { region: 'Netherlands', exposure: 6.2 },
      { region: 'United States', exposure: 5.8 },
      { region: 'Other', exposure: 3.3 },
    ],
    sectorBreakdown: [
      { sector: 'Semiconductor Manufacturing', exposure: 48.5 },
      { sector: 'Memory/Storage', exposure: 18.2 },
      { sector: 'Equipment', exposure: 15.7 },
      { sector: 'Materials', exposure: 9.8 },
      { sector: 'Energy', exposure: 4.6 },
      { sector: 'Logistics', exposure: 3.2 },
    ],
    warnings,
  }
}

function calculateConcentrationRisk(exposures: ExposureNode[]): number {
  if (exposures.length === 0) return 0

  // Herfindahl-like concentration measure
  const totalExposure = exposures.reduce((sum, e) => sum + e.totalExposure, 0)
  if (totalExposure === 0) return 0

  const hhi = exposures.reduce((sum, e) => {
    const share = e.totalExposure / totalExposure
    return sum + share * share
  }, 0)

  // Normalize to 0-100 scale
  return Math.min(Math.round(hhi * 100 * 10), 100)
}
