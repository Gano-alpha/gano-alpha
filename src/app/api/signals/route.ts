import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.150.133.161:8000'

interface Signal {
  ticker: string
  name: string | null
  tier: 'SNIPER' | 'SCOUT'
  signal: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  solvency: number | null
  centrality: number | null
  mertonPd: number | null
  altmanZ: number | null
  drawdown: number | null
  upstreamCount: number | null
  downstreamCount: number | null
  sharpe: number | null
  lastUpdated: string
  price?: number | null
  priceChange?: number | null
  marketCap?: number | null
}

interface MarketDataResponse {
  [ticker: string]: {
    price: number
    change: number
    changePercent: number
    marketCap: number
  } | null
}

// Fetch realtime price from backend price API
async function fetchRealtimePrice(ticker: string, authHeader?: string | null): Promise<MarketDataResponse[string]> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${BACKEND_URL}/v1/price/${ticker}`, {
      headers,
      cache: 'no-store',
    })

    if (response.ok) {
      const data = await response.json()
      return {
        price: data.price,
        change: data.change ?? 0,
        changePercent: data.changePercent ?? 0,
        marketCap: data.marketCap ?? 0,
      }
    }
  } catch {
    // Backend price endpoint not available
  }
  return null
}

// Fetch market data for multiple tickers
async function fetchMarketData(tickers: string[], authHeader?: string | null): Promise<MarketDataResponse> {
  if (tickers.length === 0) {
    return {}
  }

  const results = await Promise.all(
    tickers.map(ticker => fetchRealtimePrice(ticker, authHeader))
  )

  const marketData: MarketDataResponse = {}
  tickers.forEach((ticker, index) => {
    marketData[ticker] = results[index]
  })

  return marketData
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const filter = searchParams.get('filter') || 'all' // all, buy, hold, sell
  const tier = searchParams.get('tier')
  const date = searchParams.get('date') // optional YYYY-MM-DD

  // Forward Authorization header from client
  const authHeader = request.headers.get('Authorization')

  try {
    const query = new URLSearchParams()
    query.set('limit', String(limit))
    if (tier) query.set('tier', tier)
    if (date) query.set('date', date)

    // Build headers with auth forwarding
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Use v1 signals endpoint which returns tier + risk fields
    const response = await fetch(`${BACKEND_URL}/v1/signals?${query.toString()}`, {
      headers,
      cache: 'no-store', // Don't cache to get fresh data
    })

    if (response.ok) {
      const responseData = await response.json()
      // Backend returns { status, count, signals, asOfDate } - extract signals array
      let data: Signal[] = responseData.signals || responseData

      // Filter by signal type if needed
      if (filter !== 'all') {
        data = data.filter((s: Signal) => s.signal.toLowerCase() === filter.toLowerCase())
      }

      // Deduplicate by ticker
      const seen = new Set<string>()
      data = data.filter((s: Signal) => {
        if (seen.has(s.ticker)) return false
        seen.add(s.ticker)
        return true
      })

      // Get list of tickers for market data fetch
      const tickers = data.map(s => s.ticker)

      // Fetch market data in parallel (optional)
      const marketData = await fetchMarketData(tickers, authHeader)

      // Enrich signals with market data
      const enrichedData = data.map((signal) => {
        const tickerMarketData = marketData[signal.ticker]

        return {
          ...signal,
          // Market data from real-time pipeline
          price: tickerMarketData?.price ?? null,
          priceChange: tickerMarketData?.changePercent ?? null,
          marketCap: tickerMarketData?.marketCap ?? null,
        }
      })

      return NextResponse.json(enrichedData)
    }

    // No mock fallback - return empty array if backend is unavailable
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching signals:', error)
    // Return empty array on error - UI will show empty state
    return NextResponse.json([])
  }
}
