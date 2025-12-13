'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Shield,
  Network,
  Newspaper,
  Search,
  Zap,
} from 'lucide-react'

interface Signal {
  ticker: string
  name: string
  signal: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  whisperScore: number
  supplyChainRisk: number
  lastUpdated: string
}

interface Whisper {
  id: string
  sourceTicker: string
  sourceName: string
  affectedTickers: string[]
  severity: 'high' | 'medium' | 'low'
  title: string
  summary: string
  filingType: string
  filingDate: string
  timestamp: string
}

export default function DashboardPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [whispers, setWhispers] = useState<Whisper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [signalsRes, whispersRes] = await Promise.all([
          fetch('/api/signals?limit=5'),
          fetch('/api/whispers?limit=5'),
        ])

        if (signalsRes.ok) {
          const signalsData = await signalsRes.json()
          setSignals(signalsData)
        }

        if (whispersRes.ok) {
          const whispersData = await whispersRes.json()
          setWhispers(whispersData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Supply chain intelligence for smarter investing"
      />

      <div className="p-6 space-y-6">
        {/* Hero - Value Proposition */}
        <Card className="bg-gradient-to-r from-indigo-50 to-teal-50 border-none">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-2">
              See What Others Miss
            </h2>
            <p className="text-secondary mb-4 max-w-2xl">
              Gano Alpha maps hidden supply chain relationships between companies. When news hits a supplier,
              we show you which downstream companies could be affected before the market catches on.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/stock">
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Explore a Company
                </Button>
              </Link>
              <Link href="/alerts">
                <Button variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  View Live Alerts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* What We Monitor */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                <Network className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-primary">Supply Chain</p>
              <p className="text-xs text-secondary">Supplier &amp; customer links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-sm font-medium text-primary">Solvency</p>
              <p className="text-xs text-secondary">Financial health checks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <Newspaper className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-primary">News &amp; Filings</p>
              <p className="text-xs text-secondary">Real-time monitoring</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-sm font-medium text-primary">Shock Analysis</p>
              <p className="text-xs text-secondary">Ripple effect mapping</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Opportunities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-buy" />
                Today&apos;s Opportunities
              </CardTitle>
              <Link href="/scanner">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View all <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary mb-4">
                Companies with strong supply chain positions and healthy fundamentals currently trading at a discount.
              </p>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-secondary">Loading...</div>
                ) : signals.length === 0 ? (
                  <div className="text-center py-8 text-secondary">No opportunities today</div>
                ) : (
                  signals.slice(0, 5).map((stock, index) => (
                    <Link
                      key={`${stock.ticker}-${index}`}
                      href={`/stock/${stock.ticker}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-600">
                              {stock.ticker.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-primary">{stock.ticker}</p>
                            <p className="text-sm text-secondary truncate max-w-[180px]">{stock.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              stock.signal === 'BUY' ? 'success' :
                              stock.signal === 'SELL' ? 'danger' : 'warning'
                            }
                          >
                            {stock.signal}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted" />
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supply Chain Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Supply Chain Alerts
              </CardTitle>
              <Link href="/alerts">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View all <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary mb-4">
                Recent events that could ripple through supply chains and affect other companies.
              </p>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-secondary">Loading...</div>
                ) : whispers.length === 0 ? (
                  <div className="text-center py-8 text-secondary">No recent alerts</div>
                ) : (
                  whispers.slice(0, 4).map((whisper) => (
                    <div
                      key={whisper.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={whisper.severity === 'high' ? 'danger' : whisper.severity === 'medium' ? 'warning' : 'secondary'} className="text-xs">
                            {whisper.filingType}
                          </Badge>
                          <span className="font-medium text-primary">{whisper.sourceTicker}</span>
                          {whisper.affectedTickers.length > 0 && (
                            <>
                              <ArrowRight className="w-3 h-3 text-muted" />
                              <Link href={`/stock/${whisper.affectedTickers[0]}`} className="text-indigo-600 font-medium hover:underline">
                                {whisper.affectedTickers[0]}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-primary mb-1">{whisper.title}</p>
                      <p className="text-sm text-secondary line-clamp-2">{whisper.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works - Updated */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">The Gano Alpha Edge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-slate-50">
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center">1</span>
                  Map Hidden Connections
                </h3>
                <p className="text-sm text-secondary">
                  We read SEC filings, earnings calls, and news to build a graph of who supplies whom.
                  Apple depends on TSMC. TSMC depends on ASML. We track it all.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-sm flex items-center justify-center">2</span>
                  Monitor for Shocks
                </h3>
                <p className="text-sm text-secondary">
                  When news breaks about a supplier delay, earnings miss, or factory issue,
                  we calculate which downstream companies could be impacted.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <h3 className="font-medium text-primary mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-sm flex items-center justify-center">3</span>
                  Find Opportunities
                </h3>
                <p className="text-sm text-secondary">
                  We look for companies with strong positions (central in supply chains),
                  healthy balance sheets (solvency), and good valuations (trading at a discount).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
