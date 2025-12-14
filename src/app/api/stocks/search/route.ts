import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.150.133.161:8000'

interface StockResult {
  ticker: string
  name: string
  sector: string
  signal?: 'BUY' | 'HOLD' | 'SELL'
}

// Stock database for search (fallback)
const stocks: StockResult[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', signal: 'BUY' },
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Electronics', signal: 'HOLD' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Software', signal: 'BUY' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Internet', signal: 'HOLD' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce', signal: 'HOLD' },
  { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Social Media', signal: 'BUY' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors', signal: 'BUY' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', signal: 'HOLD' },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors', signal: 'SELL' },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', sector: 'Semiconductors', signal: 'BUY' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors', signal: 'HOLD' },
  { ticker: 'MU', name: 'Micron Technology', sector: 'Memory', signal: 'SELL' },
  { ticker: 'ASML', name: 'ASML Holding', sector: 'Semiconductor Equipment', signal: 'BUY' },
  { ticker: 'LRCX', name: 'Lam Research', sector: 'Semiconductor Equipment', signal: 'HOLD' },
  { ticker: 'AMAT', name: 'Applied Materials', sector: 'Semiconductor Equipment', signal: 'HOLD' },
  { ticker: 'KLAC', name: 'KLA Corporation', sector: 'Semiconductor Equipment', signal: 'HOLD' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', signal: 'HOLD' },
  { ticker: 'F', name: 'Ford Motor Company', sector: 'Automotive', signal: 'SELL' },
  { ticker: 'GM', name: 'General Motors', sector: 'Automotive', signal: 'HOLD' },
  { ticker: 'TM', name: 'Toyota Motor', sector: 'Automotive', signal: 'HOLD' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')
  const sector = searchParams.get('sector')

  // Forward Authorization header from client
  const authHeader = request.headers.get('Authorization')

  try {
    let url = `${BACKEND_URL}/api/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`
    if (sector) url += `&sector=${encodeURIComponent(sector)}`

    // Build headers with auth forwarding
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ data, isDemo: false })
    }
  } catch (error) {
    console.error('Error fetching stocks:', error)
  }

  // Fallback to local data with demo indicator
  let results = stocks

  if (query) {
    const q = query.toLowerCase()
    results = results.filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q)
    )
  }

  if (sector) {
    results = results.filter((stock) =>
      stock.sector.toLowerCase().includes(sector.toLowerCase())
    )
  }

  return NextResponse.json({
    data: results.slice(0, limit),
    isDemo: true,
  })
}
