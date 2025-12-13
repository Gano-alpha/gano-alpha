import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.138.246.157:8000'

interface Signal {
  ticker: string
  name: string
  signal: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  whisperScore: number
  supplyChainRisk: number
  lastUpdated: string
  change?: 'upgraded' | 'downgraded' | 'new'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const filter = searchParams.get('filter') || 'all' // all, buy, hold, sell

  try {
    const response = await fetch(`${BACKEND_URL}/api/signals?limit=${limit}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (response.ok) {
      const data = await response.json()
      // Filter by signal type if needed
      if (filter !== 'all') {
        return NextResponse.json(
          data.filter((s: Signal) => s.signal.toLowerCase() === filter.toLowerCase())
        )
      }
      return NextResponse.json(data)
    }

    return NextResponse.json(getMockSignals(limit, filter))
  } catch (error) {
    console.error('Error fetching signals:', error)
    return NextResponse.json(getMockSignals(limit, filter))
  }
}

function getMockSignals(limit: number, filter: string): Signal[] {
  const allSignals: Signal[] = [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      signal: 'BUY',
      confidence: 0.87,
      whisperScore: 8.5,
      supplyChainRisk: 0.32,
      lastUpdated: '2024-12-12T10:30:00Z',
      change: 'upgraded',
    },
    {
      ticker: 'TSM',
      name: 'Taiwan Semiconductor',
      signal: 'BUY',
      confidence: 0.82,
      whisperScore: 7.8,
      supplyChainRisk: 0.45,
      lastUpdated: '2024-12-12T09:15:00Z',
    },
    {
      ticker: 'AMD',
      name: 'Advanced Micro Devices',
      signal: 'HOLD',
      confidence: 0.65,
      whisperScore: 5.2,
      supplyChainRisk: 0.58,
      lastUpdated: '2024-12-12T08:45:00Z',
      change: 'downgraded',
    },
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      signal: 'HOLD',
      confidence: 0.71,
      whisperScore: 6.1,
      supplyChainRisk: 0.41,
      lastUpdated: '2024-12-11T16:30:00Z',
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      signal: 'BUY',
      confidence: 0.79,
      whisperScore: 7.2,
      supplyChainRisk: 0.28,
      lastUpdated: '2024-12-11T15:00:00Z',
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      signal: 'HOLD',
      confidence: 0.68,
      whisperScore: 5.8,
      supplyChainRisk: 0.35,
      lastUpdated: '2024-12-11T14:30:00Z',
    },
    {
      ticker: 'INTC',
      name: 'Intel Corporation',
      signal: 'SELL',
      confidence: 0.74,
      whisperScore: 3.2,
      supplyChainRisk: 0.72,
      lastUpdated: '2024-12-11T11:00:00Z',
    },
    {
      ticker: 'QCOM',
      name: 'Qualcomm Inc.',
      signal: 'BUY',
      confidence: 0.76,
      whisperScore: 6.9,
      supplyChainRisk: 0.39,
      lastUpdated: '2024-12-10T16:00:00Z',
      change: 'new',
    },
    {
      ticker: 'AVGO',
      name: 'Broadcom Inc.',
      signal: 'HOLD',
      confidence: 0.62,
      whisperScore: 5.5,
      supplyChainRisk: 0.44,
      lastUpdated: '2024-12-10T14:30:00Z',
    },
    {
      ticker: 'MU',
      name: 'Micron Technology',
      signal: 'SELL',
      confidence: 0.69,
      whisperScore: 4.1,
      supplyChainRisk: 0.61,
      lastUpdated: '2024-12-10T10:00:00Z',
    },
  ]

  let filtered = allSignals
  if (filter !== 'all') {
    filtered = allSignals.filter((s) => s.signal.toLowerCase() === filter.toLowerCase())
  }

  return filtered.slice(0, limit)
}
