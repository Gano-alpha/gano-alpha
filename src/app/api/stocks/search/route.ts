import { NextRequest, NextResponse } from 'next/server'

interface StockResult {
  ticker: string
  name: string
  sector: string
  signal?: 'BUY' | 'HOLD' | 'SELL'
}

// Stock database for search
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
  const query = searchParams.get('q')?.toLowerCase() || ''
  const limit = parseInt(searchParams.get('limit') || '10')
  const sector = searchParams.get('sector')

  let results = stocks

  // Filter by query
  if (query) {
    results = results.filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
    )
  }

  // Filter by sector
  if (sector) {
    results = results.filter((stock) =>
      stock.sector.toLowerCase().includes(sector.toLowerCase())
    )
  }

  return NextResponse.json(results.slice(0, limit))
}
