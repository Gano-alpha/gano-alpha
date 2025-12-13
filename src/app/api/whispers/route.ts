import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://3.138.246.157:8000'

interface Whisper {
  id: string
  sourceTicker: string
  sourceName: string
  affectedTickers: string[]
  severity: 'high' | 'medium' | 'low'
  title: string
  summary: string
  extractedText: string
  filingType: string
  filingDate: string
  filingUrl: string
  timestamp: string
  read: boolean
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const ticker = searchParams.get('ticker') // Filter by affected ticker
  const severity = searchParams.get('severity') // Filter by severity

  try {
    let url = `${BACKEND_URL}/api/whispers?limit=${limit}`
    if (ticker) url += `&ticker=${ticker}`
    if (severity) url += `&severity=${severity}`

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json(getMockWhispers(limit, ticker, severity))
  } catch (error) {
    console.error('Error fetching whispers:', error)
    return NextResponse.json(getMockWhispers(limit, ticker, severity))
  }
}

function getMockWhispers(limit: number, ticker?: string | null, severity?: string | null): Whisper[] {
  const allWhispers: Whisper[] = [
    {
      id: 'w1',
      sourceTicker: 'SWKS',
      sourceName: 'Skyworks Solutions',
      affectedTickers: ['AAPL', 'QCOM'],
      severity: 'high',
      title: 'Production Delay Alert',
      summary: 'Skyworks filed 8-K mentioning "unexpected production delays in RF component manufacturing" that may impact Q1 deliveries.',
      extractedText: '...we anticipate unexpected delays in our RF component manufacturing line, which may impact delivery schedules for key customers in Q1 2025...',
      filingType: '8-K',
      filingDate: '2024-12-12',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=SWKS&type=8-K',
      timestamp: '2024-12-12T14:30:00Z',
      read: false,
    },
    {
      id: 'w2',
      sourceTicker: 'TSM',
      sourceName: 'Taiwan Semiconductor',
      affectedTickers: ['NVDA', 'AMD', 'AAPL'],
      severity: 'medium',
      title: 'Capacity Expansion Ahead of Schedule',
      summary: 'TSMC announced Q4 capacity expansion ahead of schedule in 10-Q filing, potentially benefiting major chip customers.',
      extractedText: '...our advanced node capacity expansion is progressing ahead of schedule, with new production lines expected to come online in Q4...',
      filingType: '10-Q',
      filingDate: '2024-12-10',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=TSM&type=10-Q',
      timestamp: '2024-12-10T09:00:00Z',
      read: false,
    },
    {
      id: 'w3',
      sourceTicker: 'MSFT',
      sourceName: 'Microsoft Corporation',
      affectedTickers: ['NVDA'],
      severity: 'low',
      title: 'Azure AI Demand Surge',
      summary: 'Microsoft 8-K mentions "unprecedented demand" for Azure AI services, indicating strong GPU requirements.',
      extractedText: '...Azure AI services continue to experience unprecedented demand, leading to capacity constraints in certain regions...',
      filingType: '8-K',
      filingDate: '2024-12-11',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=MSFT&type=8-K',
      timestamp: '2024-12-11T16:00:00Z',
      read: true,
    },
    {
      id: 'w4',
      sourceTicker: 'MU',
      sourceName: 'Micron Technology',
      affectedTickers: ['NVDA', 'AMD'],
      severity: 'high',
      title: 'HBM Supply Constraints',
      summary: 'Micron warns of HBM3 memory supply constraints in 10-K that could impact AI accelerator production.',
      extractedText: '...demand for High Bandwidth Memory (HBM3) continues to outpace our production capacity, and we anticipate allocation constraints through H1 2025...',
      filingType: '10-K',
      filingDate: '2024-12-09',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=MU&type=10-K',
      timestamp: '2024-12-09T11:30:00Z',
      read: false,
    },
    {
      id: 'w5',
      sourceTicker: 'LRCX',
      sourceName: 'Lam Research',
      affectedTickers: ['TSM', 'INTC'],
      severity: 'medium',
      title: 'Equipment Lead Time Extension',
      summary: 'Lam Research discloses extended lead times for advanced etch equipment due to component shortages.',
      extractedText: '...lead times for our flagship etch systems have extended to 9-12 months due to ongoing supply chain challenges in specialized components...',
      filingType: '10-Q',
      filingDate: '2024-12-08',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=LRCX&type=10-Q',
      timestamp: '2024-12-08T10:00:00Z',
      read: true,
    },
    {
      id: 'w6',
      sourceTicker: 'ASML',
      sourceName: 'ASML Holding',
      affectedTickers: ['TSM', 'INTC', 'SAMSUNG'],
      severity: 'high',
      title: 'EUV Machine Delivery Delays',
      summary: 'ASML reports potential delays in EUV lithography machine deliveries due to precision component issues.',
      extractedText: '...we are experiencing challenges with certain precision optical components that may impact our EUV delivery schedule for Q1 2025...',
      filingType: '6-K',
      filingDate: '2024-12-07',
      filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=ASML&type=6-K',
      timestamp: '2024-12-07T08:00:00Z',
      read: false,
    },
  ]

  let filtered = allWhispers

  if (ticker) {
    filtered = filtered.filter(
      (w) => w.sourceTicker === ticker || w.affectedTickers.includes(ticker)
    )
  }

  if (severity) {
    filtered = filtered.filter((w) => w.severity === severity)
  }

  return filtered.slice(0, limit)
}
