import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.150.133.161:8000'

interface SupplyChainResponse {
  ticker: string
  name: string
  suppliers: {
    id: string
    ticker: string
    name: string
    relation: string
    confidence: number
  }[]
  customers: {
    id: string
    ticker: string
    name: string
    relation: string
    confidence: number
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '5'

  // Forward Authorization header from client
  const authHeader = request.headers.get('Authorization')

  try {
    // Build headers with auth forwarding
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Fetch mini-graph from backend
    const response = await fetch(`${BACKEND_URL}/v1/mini-graph/${ticker}?limit=${limit}`, {
      headers,
      // Cache for 5 minutes
      next: { revalidate: 300 },
    })

    if (response.ok) {
      const data = await response.json()
      // Map mini-graph shape to expected shape
      return NextResponse.json({
        ticker: data.ticker,
        name: data.name,
        suppliers: (data.suppliers || []).map((s: any, idx: number) => ({
          id: s.id || `supplier-${idx}`,
          ticker: s.ticker,
          name: s.name,
          relation: s.relation || 'Supplier',
          confidence: s.confidence || 0,
        })),
        customers: (data.customers || []).map((c: any, idx: number) => ({
          id: c.id || `customer-${idx}`,
          ticker: c.ticker,
          name: c.name,
          relation: c.relation || 'Customer',
          confidence: c.confidence || 0,
        })),
      })
    }

    // Return empty response if backend unavailable
    return NextResponse.json({
      ticker,
      name: ticker,
      suppliers: [],
      customers: [],
    })
  } catch (error) {
    console.error('Error fetching supply chain data:', error)
    // Return empty response on error
    return NextResponse.json({
      ticker,
      name: ticker,
      suppliers: [],
      customers: [],
    })
  }
}
