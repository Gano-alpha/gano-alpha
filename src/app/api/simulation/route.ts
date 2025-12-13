import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.138.246.157:8000'

interface SimulationRequest {
  scenario: string
  portfolioTickers?: string[]
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

export async function POST(request: NextRequest) {
  try {
    const body: SimulationRequest = await request.json()

    if (!body.scenario) {
      return NextResponse.json(
        { error: 'Scenario is required' },
        { status: 400 }
      )
    }

    // Try to call backend simulation API
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch {
      // Backend not available, use mock simulation
    }

    // Generate mock simulation based on scenario keywords
    const result = generateMockSimulation(body.scenario, body.portfolioTickers)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    )
  }
}

function generateMockSimulation(
  scenario: string,
  portfolioTickers?: string[]
): SimulationResult {
  const scenarioLower = scenario.toLowerCase()

  // Detect scenario type and generate appropriate response
  if (scenarioLower.includes('taiwan') || scenarioLower.includes('tsmc') || scenarioLower.includes('china')) {
    return generateTaiwanCrisisSimulation()
  }

  if (scenarioLower.includes('chip') || scenarioLower.includes('semiconductor') || scenarioLower.includes('shortage')) {
    return generateChipShortageSimulation()
  }

  if (scenarioLower.includes('energy') || scenarioLower.includes('gas') || scenarioLower.includes('oil')) {
    return generateEnergyCrisisSimulation()
  }

  if (scenarioLower.includes('earthquake') || scenarioLower.includes('japan') || scenarioLower.includes('disaster')) {
    return generateDisasterSimulation()
  }

  // Default generic simulation
  return generateGenericSimulation(scenario)
}

function generateTaiwanCrisisSimulation(): SimulationResult {
  return {
    summary: {
      totalImpact: -12.4,
      affectedStocks: 8,
      criticalNodes: 3,
      recoveryTime: '6-9 months',
    },
    affectedStocks: [
      { ticker: 'NVDA', name: 'NVIDIA Corporation', impact: -28.5, exposure: 'Direct', reason: 'Primary GPU supplier dependent on TSMC 4nm process', pathLength: 1 },
      { ticker: 'AMD', name: 'Advanced Micro Devices', impact: -24.2, exposure: 'Direct', reason: 'CPU/GPU manufacturing relies on TSMC advanced nodes', pathLength: 1 },
      { ticker: 'AAPL', name: 'Apple Inc.', impact: -18.7, exposure: 'Direct', reason: 'A-series and M-series chips manufactured at TSMC', pathLength: 1 },
      { ticker: 'QCOM', name: 'Qualcomm', impact: -15.3, exposure: 'Direct', reason: 'Snapdragon SoCs produced at TSMC', pathLength: 1 },
      { ticker: 'MSFT', name: 'Microsoft Corporation', impact: -8.2, exposure: 'Indirect', reason: 'Azure hardware procurement affected', pathLength: 2 },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', impact: -6.4, exposure: 'Indirect', reason: 'TPU production and Pixel supply chain', pathLength: 2 },
      { ticker: 'AMZN', name: 'Amazon.com', impact: -4.1, exposure: 'Indirect', reason: 'AWS Graviton chips and device manufacturing', pathLength: 2 },
      { ticker: 'TSLA', name: 'Tesla Inc.', impact: -3.8, exposure: 'Indirect', reason: 'FSD chip production and vehicle electronics', pathLength: 2 },
    ],
    propagationPaths: [
      { from: 'TSM', to: 'NVDA', strength: 0.95 },
      { from: 'TSM', to: 'AMD', strength: 0.92 },
      { from: 'TSM', to: 'AAPL', strength: 0.88 },
      { from: 'NVDA', to: 'MSFT', strength: 0.75 },
      { from: 'NVDA', to: 'GOOGL', strength: 0.68 },
    ],
    mitigations: [
      'Consider hedging NVDA/AMD positions with put options',
      'Diversify into Intel (domestic fab capacity)',
      'Add Samsung Electronics as alternative exposure',
      'Monitor GlobalFoundries for capacity shifts',
    ],
  }
}

function generateChipShortageSimulation(): SimulationResult {
  return {
    summary: {
      totalImpact: -8.7,
      affectedStocks: 12,
      criticalNodes: 4,
      recoveryTime: '12-18 months',
    },
    affectedStocks: [
      { ticker: 'NVDA', name: 'NVIDIA Corporation', impact: -15.2, exposure: 'Direct', reason: 'GPU supply constraints worsen', pathLength: 1 },
      { ticker: 'AMD', name: 'Advanced Micro Devices', impact: -12.8, exposure: 'Direct', reason: 'CPU/GPU allocation reduced', pathLength: 1 },
      { ticker: 'QCOM', name: 'Qualcomm', impact: -11.4, exposure: 'Direct', reason: 'Mobile SoC shortages', pathLength: 1 },
      { ticker: 'AAPL', name: 'Apple Inc.', impact: -9.2, exposure: 'Direct', reason: 'iPhone production constraints', pathLength: 1 },
      { ticker: 'TSLA', name: 'Tesla Inc.', impact: -7.8, exposure: 'Indirect', reason: 'Vehicle electronics shortage', pathLength: 2 },
      { ticker: 'F', name: 'Ford Motor', impact: -6.5, exposure: 'Indirect', reason: 'Auto chip shortage continues', pathLength: 2 },
    ],
    propagationPaths: [
      { from: 'Fabs', to: 'NVDA', strength: 0.88 },
      { from: 'Fabs', to: 'AMD', strength: 0.85 },
      { from: 'QCOM', to: 'AAPL', strength: 0.72 },
    ],
    mitigations: [
      'Overweight equipment suppliers (ASML, LRCX, AMAT)',
      'Consider memory names with pricing power (MU, SK Hynix)',
      'Reduce auto sector exposure',
      'Look for secondary suppliers gaining share',
    ],
  }
}

function generateEnergyCrisisSimulation(): SimulationResult {
  return {
    summary: {
      totalImpact: -5.2,
      affectedStocks: 15,
      criticalNodes: 2,
      recoveryTime: '3-6 months',
    },
    affectedStocks: [
      { ticker: 'INTC', name: 'Intel Corporation', impact: -8.5, exposure: 'Direct', reason: 'European fab operations affected', pathLength: 1 },
      { ticker: 'ASML', name: 'ASML Holding', impact: -6.2, exposure: 'Direct', reason: 'Netherlands operations energy costs', pathLength: 1 },
      { ticker: 'BMW', name: 'BMW AG', impact: -5.8, exposure: 'Direct', reason: 'German manufacturing affected', pathLength: 1 },
      { ticker: 'BASF', name: 'BASF SE', impact: -4.9, exposure: 'Direct', reason: 'Chemical production halted', pathLength: 1 },
    ],
    propagationPaths: [
      { from: 'Energy', to: 'Manufacturing', strength: 0.82 },
      { from: 'Manufacturing', to: 'INTC', strength: 0.75 },
    ],
    mitigations: [
      'Increase energy sector exposure (XLE, XOM)',
      'Reduce European manufacturing exposure',
      'Consider US-based semiconductor alternatives',
      'Monitor LNG shipping companies',
    ],
  }
}

function generateDisasterSimulation(): SimulationResult {
  return {
    summary: {
      totalImpact: -4.8,
      affectedStocks: 10,
      criticalNodes: 3,
      recoveryTime: '2-4 months',
    },
    affectedStocks: [
      { ticker: 'TM', name: 'Toyota Motor', impact: -12.4, exposure: 'Direct', reason: 'Japanese production halted', pathLength: 1 },
      { ticker: 'SONY', name: 'Sony Group', impact: -9.8, exposure: 'Direct', reason: 'Sensor and electronics production', pathLength: 1 },
      { ticker: 'AAPL', name: 'Apple Inc.', impact: -5.2, exposure: 'Indirect', reason: 'Display and component supply', pathLength: 2 },
      { ticker: 'NVDA', name: 'NVIDIA Corporation', impact: -3.1, exposure: 'Indirect', reason: 'Packaging and testing delays', pathLength: 2 },
    ],
    propagationPaths: [
      { from: 'Japan', to: 'TM', strength: 0.95 },
      { from: 'Japan', to: 'SONY', strength: 0.92 },
      { from: 'SONY', to: 'AAPL', strength: 0.68 },
    ],
    mitigations: [
      'Hedge Japanese yen exposure',
      'Monitor alternative suppliers in Korea/Taiwan',
      'Consider insurance-related plays',
      'Look for reconstruction beneficiaries',
    ],
  }
}

function generateGenericSimulation(scenario: string): SimulationResult {
  return {
    summary: {
      totalImpact: -3.5,
      affectedStocks: 5,
      criticalNodes: 1,
      recoveryTime: '1-3 months',
    },
    affectedStocks: [
      { ticker: 'SPY', name: 'S&P 500 ETF', impact: -3.5, exposure: 'Direct', reason: 'Broad market impact from scenario', pathLength: 1 },
      { ticker: 'QQQ', name: 'Nasdaq 100 ETF', impact: -4.2, exposure: 'Direct', reason: 'Tech sector volatility', pathLength: 1 },
    ],
    propagationPaths: [
      { from: 'Event', to: 'Market', strength: 0.65 },
    ],
    mitigations: [
      'Consider increasing cash allocation',
      'Review portfolio for concentration risk',
      'Monitor VIX for hedging opportunities',
      'Rebalance toward defensive sectors',
    ],
  }
}
