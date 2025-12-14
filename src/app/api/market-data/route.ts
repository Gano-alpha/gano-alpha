import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.150.133.161:8000'

interface MarketData {
  ticker: string
  price: number
  change: number // absolute change
  changePercent: number // percentage change
  volume: number
  marketCap: number
  timestamp: string
}

// Fetch real-time price from backend's last_prices table
async function fetchRealtimePrice(ticker: string): Promise<MarketData | null> {
  try {
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
      let marketCap = 0

      if (ohlcvResponse.ok) {
        const ohlcvData = await ohlcvResponse.json()
        if (ohlcvData.length >= 2) {
          previousClose = ohlcvData[1].close // Second most recent is previous day
        } else if (ohlcvData.length === 1) {
          previousClose = ohlcvData[0].open // Use open if only one day
        }
      }

      // Fetch ticker context for market cap
      const contextResponse = await fetch(`${BACKEND_URL}/tickers/${ticker}/context`, {
        cache: 'no-store',
      })

      if (contextResponse.ok) {
        const contextData = await contextResponse.json()
        // Market cap would come from ticker context if available
        marketCap = contextData.market_cap || 0
      }

      const change = data.price - previousClose
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

      return {
        ticker: data.ticker,
        price: data.price,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: data.volume_last_trade || 0,
        marketCap,
        timestamp: data.timestamp,
      }
    }
  } catch (error) {
    console.error(`Error fetching realtime price for ${ticker}:`, error)
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tickers = searchParams.get('tickers')?.split(',').filter(Boolean) || []

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 })
  }

  try {
    // Fetch all tickers in parallel from backend's realtime table
    const results = await Promise.all(
      tickers.map(ticker => fetchRealtimePrice(ticker.trim().toUpperCase()))
    )

    // Build response object
    const marketData: Record<string, MarketData | null> = {}
    tickers.forEach((ticker, index) => {
      marketData[ticker.trim().toUpperCase()] = results[index]
    })

    return NextResponse.json(marketData)
  } catch (error) {
    console.error('Error fetching market data:', error)
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
  }
}
