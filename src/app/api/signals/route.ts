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
async function fetchRealtimePrice(ticker: string): Promise<MarketDataResponse[string]> {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/price/${ticker}`, {
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
async function fetchMarketData(tickers: string[]): Promise<MarketDataResponse> {
  if (tickers.length === 0) {
    return {}
  }

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
  const tier = searchParams.get('tier')
  const date = searchParams.get('date') // optional YYYY-MM-DD

  try {
    const query = new URLSearchParams()
    query.set('limit', String(limit))
    if (tier) query.set('tier', tier)
    if (date) query.set('date', date)

    // Use v1 signals endpoint which returns tier + risk fields
    const response = await fetch(`${BACKEND_URL}/v1/signals?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
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
      const marketData = await fetchMarketData(tickers)

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

      // If backend returns an empty array, fall back to mock data so UI can render cards
      if (enrichedData.length === 0) {
        const mock: Signal[] = [
          {
            ticker: 'ACME',
            name: 'Acme Corp',
            tier: 'SNIPER',
            signal: 'SELL',
            confidence: 0.965,
            solvency: 0.35,
            centrality: 0.82,
            mertonPd: 14.2,
            altmanZ: 1.5,
            drawdown: -18.4,
            upstreamCount: 5,
            downstreamCount: 3,
            sharpe: -0.4,
            lastUpdated: new Date().toISOString(),
            price: 42.1,
            priceChange: -1.2,
            marketCap: 12000000000,
          },
          {
            ticker: 'BETA',
            name: 'Beta Industries',
            tier: 'SCOUT',
            signal: 'BUY',
            confidence: 0.912,
            solvency: 0.72,
            centrality: 0.41,
            mertonPd: 5.8,
            altmanZ: 3.2,
            drawdown: -12.0,
            upstreamCount: 2,
            downstreamCount: 6,
            sharpe: 0.8,
            lastUpdated: new Date().toISOString(),
            price: 88.4,
            priceChange: 0.6,
            marketCap: 8500000000,
          },
          {
            ticker: 'GNNX',
            name: 'GNN Explorers',
            tier: 'SNIPER',
            signal: 'SELL',
            confidence: 0.955,
            solvency: 0.28,
            centrality: 0.91,
            mertonPd: 18.7,
            altmanZ: 1.1,
            drawdown: -22.5,
            upstreamCount: 8,
            downstreamCount: 4,
            sharpe: -0.6,
            lastUpdated: new Date().toISOString(),
            price: 15.7,
            priceChange: -2.3,
            marketCap: 2400000000,
          },
          {
            ticker: 'RISK',
            name: 'Risk Metrics Inc',
            tier: 'SCOUT',
            signal: 'BUY',
            confidence: 0.905,
            solvency: 0.65,
            centrality: 0.55,
            mertonPd: 7.4,
            altmanZ: 2.9,
            drawdown: -10.5,
            upstreamCount: 3,
            downstreamCount: 3,
            sharpe: 0.5,
            lastUpdated: new Date().toISOString(),
            price: 63.2,
            priceChange: 1.4,
            marketCap: 5200000000,
          },
        ]
        return NextResponse.json(mock)
      }

      return NextResponse.json(enrichedData)
    }

    // No mock fallback - return empty array if backend is unavailable
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching signals:', error)
    // Return mock data on error so UI can render
    const mock: Signal[] = [
      {
        ticker: 'ACME',
        name: 'Acme Corp',
        tier: 'SNIPER',
        signal: 'SELL',
        confidence: 0.965,
        solvency: 0.35,
        centrality: 0.82,
        mertonPd: 14.2,
        altmanZ: 1.5,
        drawdown: -18.4,
        upstreamCount: 5,
        downstreamCount: 3,
        sharpe: -0.4,
        lastUpdated: new Date().toISOString(),
        price: 42.1,
        priceChange: -1.2,
        marketCap: 12000000000,
      },
      {
        ticker: 'BETA',
        name: 'Beta Industries',
        tier: 'SCOUT',
        signal: 'BUY',
        confidence: 0.912,
        solvency: 0.72,
        centrality: 0.41,
        mertonPd: 5.8,
        altmanZ: 3.2,
        drawdown: -12.0,
        upstreamCount: 2,
        downstreamCount: 6,
        sharpe: 0.8,
        lastUpdated: new Date().toISOString(),
        price: 88.4,
        priceChange: 0.6,
        marketCap: 8500000000,
      },
      {
        ticker: 'GNNX',
        name: 'GNN Explorers',
        tier: 'SNIPER',
        signal: 'SELL',
        confidence: 0.955,
        solvency: 0.28,
        centrality: 0.91,
        mertonPd: 18.7,
        altmanZ: 1.1,
        drawdown: -22.5,
        upstreamCount: 8,
        downstreamCount: 4,
        sharpe: -0.6,
        lastUpdated: new Date().toISOString(),
        price: 15.7,
        priceChange: -2.3,
        marketCap: 2400000000,
      },
      {
        ticker: 'RISK',
        name: 'Risk Metrics Inc',
        tier: 'SCOUT',
        signal: 'BUY',
        confidence: 0.905,
        solvency: 0.65,
        centrality: 0.55,
        mertonPd: 7.4,
        altmanZ: 2.9,
        drawdown: -10.5,
        upstreamCount: 3,
        downstreamCount: 3,
        sharpe: 0.5,
        lastUpdated: new Date().toISOString(),
        price: 63.2,
        priceChange: 1.4,
        marketCap: 5200000000,
      },
    ]
    return NextResponse.json(mock)
  }
}
