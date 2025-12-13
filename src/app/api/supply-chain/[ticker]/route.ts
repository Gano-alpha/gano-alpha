import { NextRequest, NextResponse } from 'next/server'

// Backend API URL - will be configured via environment variable
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.138.246.157:8000'

interface SupplyChainEdge {
  source_ticker: string
  source_name: string
  target_ticker: string
  target_name: string
  relation_type: string
  confidence: number
  filing_type: string
  filing_date: string
}

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

  try {
    // Fetch supply chain data from backend
    const response = await fetch(`${BACKEND_URL}/api/supply-chain/${ticker}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      // If backend is not available, return mock data for development
      if (response.status === 404 || response.status >= 500) {
        return NextResponse.json(getMockData(ticker))
      }
      throw new Error(`Backend returned ${response.status}`)
    }

    const data: SupplyChainEdge[] = await response.json()

    // Transform backend data to frontend format
    const suppliers = data
      .filter((edge) => edge.target_ticker === ticker)
      .map((edge, index) => ({
        id: `sup-${index}`,
        ticker: edge.source_ticker,
        name: edge.source_name,
        relation: edge.relation_type,
        confidence: edge.confidence,
      }))

    const customers = data
      .filter((edge) => edge.source_ticker === ticker)
      .map((edge, index) => ({
        id: `cust-${index}`,
        ticker: edge.target_ticker,
        name: edge.target_name,
        relation: edge.relation_type,
        confidence: edge.confidence,
      }))

    const result: SupplyChainResponse = {
      ticker,
      name: getCompanyName(ticker),
      suppliers,
      customers,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching supply chain data:', error)
    // Return mock data on error for development
    return NextResponse.json(getMockData(ticker))
  }
}

// Helper to get company name (would come from a database in production)
function getCompanyName(ticker: string): string {
  const names: Record<string, string> = {
    NVDA: 'NVIDIA Corporation',
    AAPL: 'Apple Inc.',
    TSM: 'Taiwan Semiconductor',
    AMD: 'Advanced Micro Devices',
    MSFT: 'Microsoft Corporation',
    GOOGL: 'Alphabet Inc.',
    AMZN: 'Amazon.com Inc.',
    META: 'Meta Platforms Inc.',
    INTC: 'Intel Corporation',
    QCOM: 'Qualcomm Inc.',
  }
  return names[ticker] || ticker
}

// Mock data for development
function getMockData(ticker: string): SupplyChainResponse {
  const mockSupplyChains: Record<string, SupplyChainResponse> = {
    NVDA: {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      suppliers: [
        { id: 'sup-1', ticker: 'TSM', name: 'Taiwan Semiconductor', relation: 'Chip Fabrication', confidence: 0.95 },
        { id: 'sup-2', ticker: 'ASML', name: 'ASML Holding', relation: 'Lithography Equipment', confidence: 0.88 },
        { id: 'sup-3', ticker: 'LRCX', name: 'Lam Research', relation: 'Wafer Processing', confidence: 0.82 },
        { id: 'sup-4', ticker: 'MU', name: 'Micron Technology', relation: 'Memory Chips', confidence: 0.79 },
        { id: 'sup-5', ticker: 'AVGO', name: 'Broadcom Inc.', relation: 'Networking Components', confidence: 0.75 },
      ],
      customers: [
        { id: 'cust-1', ticker: 'MSFT', name: 'Microsoft Corporation', relation: 'Cloud GPUs', confidence: 0.92 },
        { id: 'cust-2', ticker: 'GOOGL', name: 'Alphabet Inc.', relation: 'AI Training', confidence: 0.89 },
        { id: 'cust-3', ticker: 'META', name: 'Meta Platforms Inc.', relation: 'AI Infrastructure', confidence: 0.86 },
        { id: 'cust-4', ticker: 'AMZN', name: 'Amazon.com Inc.', relation: 'AWS GPUs', confidence: 0.84 },
        { id: 'cust-5', ticker: 'TSLA', name: 'Tesla Inc.', relation: 'FSD Training', confidence: 0.78 },
      ],
    },
    AAPL: {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      suppliers: [
        { id: 'sup-1', ticker: 'TSM', name: 'Taiwan Semiconductor', relation: 'A-Series Chips', confidence: 0.96 },
        { id: 'sup-2', ticker: 'QCOM', name: 'Qualcomm Inc.', relation: 'Modems', confidence: 0.85 },
        { id: 'sup-3', ticker: 'HON', name: 'Honeywell Int.', relation: 'Sensors', confidence: 0.72 },
        { id: 'sup-4', ticker: 'MU', name: 'Micron Technology', relation: 'NAND Flash', confidence: 0.78 },
      ],
      customers: [
        { id: 'cust-1', ticker: 'RETAIL', name: 'Retail Consumers', relation: 'Consumer Electronics', confidence: 0.95 },
        { id: 'cust-2', ticker: 'ENTERPRISE', name: 'Enterprise', relation: 'Business Devices', confidence: 0.82 },
      ],
    },
    TSM: {
      ticker: 'TSM',
      name: 'Taiwan Semiconductor',
      suppliers: [
        { id: 'sup-1', ticker: 'ASML', name: 'ASML Holding', relation: 'EUV Lithography', confidence: 0.98 },
        { id: 'sup-2', ticker: 'LRCX', name: 'Lam Research', relation: 'Etch Systems', confidence: 0.91 },
        { id: 'sup-3', ticker: 'AMAT', name: 'Applied Materials', relation: 'Deposition Equipment', confidence: 0.89 },
        { id: 'sup-4', ticker: 'KLAC', name: 'KLA Corporation', relation: 'Inspection Systems', confidence: 0.85 },
      ],
      customers: [
        { id: 'cust-1', ticker: 'NVDA', name: 'NVIDIA Corporation', relation: '4nm/5nm Chips', confidence: 0.95 },
        { id: 'cust-2', ticker: 'AAPL', name: 'Apple Inc.', relation: 'A/M-Series SoCs', confidence: 0.94 },
        { id: 'cust-3', ticker: 'AMD', name: 'Advanced Micro Devices', relation: 'CPUs/GPUs', confidence: 0.92 },
        { id: 'cust-4', ticker: 'QCOM', name: 'Qualcomm Inc.', relation: 'Snapdragon SoCs', confidence: 0.88 },
        { id: 'cust-5', ticker: 'INTC', name: 'Intel Corporation', relation: 'Some Chips', confidence: 0.65 },
      ],
    },
  }

  return mockSupplyChains[ticker] || {
    ticker,
    name: getCompanyName(ticker),
    suppliers: [],
    customers: [],
  }
}
