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
  price?: number | null
  priceChange?: number | null
  marketCap?: number | null
  solvency?: number | null
  centrality?: number | null
  upstreamCount?: number | null
  downstreamCount?: number | null
}

interface SupplyChainResponse {
  ticker: string
  name: string
  suppliers: { ticker: string; name: string; relation: string; confidence: number }[]
  customers: { ticker: string; name: string; relation: string; confidence: number }[]
}

// Fetch supply chain data for a ticker
async function fetchSupplyChainData(ticker: string): Promise<SupplyChainResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/supply-chain/${ticker}`, {
      cache: 'no-store',
    })
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // Silently fail for individual tickers
  }
  return null
}

interface MarketDataResponse {
  [ticker: string]: {
    price: number
    change: number
    changePercent: number
    marketCap: number
  } | null
}

// Fetch realtime price from backend's last_prices table (via /market/price endpoint)
// Note: This endpoint needs to be deployed on the backend server
async function fetchRealtimePrice(ticker: string): Promise<MarketDataResponse[string]> {
  try {
    // Try to fetch from backend's realtime price endpoint
    const response = await fetch(`${BACKEND_URL}/market/price/${ticker}`, {
      cache: 'no-store',
    })

    if (response.ok) {
      const data = await response.json()

      // Also fetch OHLCV for previous close to calculate change
      const ohlcvResponse = await fetch(`${BACKEND_URL}/market/ohlcv/${ticker}?limit=2`, {
        cache: 'no-store',
      })

      let previousClose = data.price

      if (ohlcvResponse.ok) {
        const ohlcvData = await ohlcvResponse.json()
        if (ohlcvData.length >= 2) {
          previousClose = ohlcvData[1].close
        } else if (ohlcvData.length === 1) {
          previousClose = ohlcvData[0].open
        }
      }

      const change = data.price - previousClose
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

      return {
        price: data.price,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        marketCap: 0,
      }
    }
  } catch {
    // Backend market price endpoint not available
  }
  return null
}

// Fetch market data for multiple tickers
async function fetchMarketData(tickers: string[]): Promise<MarketDataResponse> {
  if (tickers.length === 0) {
    return {}
  }

  // Fetch all tickers in parallel from backend
  const results = await Promise.all(
    tickers.map(ticker => fetchRealtimePrice(ticker))
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

  try {
    const response = await fetch(`${BACKEND_URL}/api/signals?limit=${limit}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // Don't cache to get fresh data
    })

    if (response.ok) {
      let data: Signal[] = await response.json()

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

      // Fetch market data and supply chain data in parallel
      const [marketData, ...supplyChainResults] = await Promise.all([
        fetchMarketData(tickers),
        ...data.map(signal => fetchSupplyChainData(signal.ticker))
      ])

      // Enrich signals with market data and supply chain data
      const enrichedData = data.map((signal, index) => {
        const supplyChainData = supplyChainResults[index]
        const tickerMarketData = marketData[signal.ticker]

        const upstreamCount = supplyChainData?.suppliers?.length ?? null
        const downstreamCount = supplyChainData?.customers?.length ?? null

        // Calculate centrality based on total connections (normalized to 0-1)
        // This is a simplified metric - more connections = higher centrality
        const totalConnections = (upstreamCount ?? 0) + (downstreamCount ?? 0)
        // If we have supply chain data, calculate centrality; otherwise null
        const centrality = supplyChainData !== null
          ? Math.min(totalConnections / 20, 1) // Normalize: 20+ connections = 100% centrality
          : null

        // Solvency is estimated from supplyChainRisk (lower risk = higher solvency)
        // supplyChainRisk is 0-1, convert to months (0 risk = 60+ months, 1 risk = 6 months)
        const solvency = signal.supplyChainRisk !== undefined
          ? Math.round(60 - (signal.supplyChainRisk * 54)) // Range: 6-60 months
          : null

        return {
          ...signal,
          // Market data from real-time pipeline
          price: tickerMarketData?.price ?? null,
          priceChange: tickerMarketData?.changePercent ?? null,
          marketCap: tickerMarketData?.marketCap ?? null,
          // Supply chain metrics
          upstreamCount,
          downstreamCount,
          centrality,
          solvency,
        }
      })

      return NextResponse.json(enrichedData)
    }

    // No mock fallback - return empty array if backend is unavailable
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching signals:', error)
    // No mock fallback - return empty array on error
    return NextResponse.json([])
  }
}
