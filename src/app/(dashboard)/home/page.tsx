'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Shield,
  Bell,
  Zap,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Network,
  ExternalLink,
  Star,
  X,
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

// Check if user has a watchlist (would come from API/localStorage in production)
const useWatchlist = () => {
  const [hasWatchlist, setHasWatchlist] = useState(false)
  const [watchlistCount, setWatchlistCount] = useState(0)

  useEffect(() => {
    // Check localStorage for watchlist
    const stored = localStorage.getItem('gano_watchlist')
    if (stored) {
      const items = JSON.parse(stored)
      setHasWatchlist(items.length > 0)
      setWatchlistCount(items.length)
    }
  }, [])

  return { hasWatchlist, watchlistCount }
}

export default function HomePage() {
  const router = useRouter()
  const [signals, setSignals] = useState<Signal[]>([])
  const [whispers, setWhispers] = useState<Whisper[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null)
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const { hasWatchlist, watchlistCount } = useWatchlist()

  useEffect(() => {
    async function fetchData() {
      try {
        const [signalsRes, whispersRes] = await Promise.all([
          fetch('/api/signals?limit=6'),
          fetch('/api/whispers?limit=4'),
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
        console.error('Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const unreadAlertsCount = whispers.filter(w => w.severity === 'high' || w.severity === 'medium').length

  const toggleOpportunity = (ticker: string) => {
    setExpandedOpportunity(expandedOpportunity === ticker ? null : ticker)
  }

  const toggleAlert = (id: string) => {
    setExpandedAlert(expandedAlert === id ? null : id)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Good morning"
        subtitle="Here&apos;s your market intelligence brief"
      />

      <div className="p-6 space-y-6">
        {/* Top Row: Watchlist Status + Alerts + Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Watchlist Status - Empty State or Summary */}
          {!hasWatchlist ? (
            <Card className="bg-gradient-to-br from-indigo-50 to-teal-50 border-none md:col-span-1">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-secondary mb-2">
                  <Eye className="w-4 h-4" />
                  Your Watchlist
                </div>
                <p className="text-lg font-semibold text-primary mb-2">
                  Start tracking stocks
                </p>
                <p className="text-sm text-secondary mb-4">
                  Track stocks to get personalized alerts when news, filings, or market events could impact your positions.
                </p>
                <Link href="/portfolio">
                  <Button size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Watchlist
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-indigo-50 to-teal-50 border-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-secondary mb-1">
                  <Eye className="w-4 h-4" />
                  Your Watchlist
                </div>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {watchlistCount} stocks
                </p>
                <Link href="/portfolio" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
                  Manage watchlist
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Unread Alerts */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-secondary mb-1">
                <Bell className="w-4 h-4" />
                Unread Alerts
              </div>
              <p className="text-2xl font-bold text-warning tabular-nums">
                {unreadAlertsCount}
              </p>
              <Link href="/alerts" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
                View all alerts
              </Link>
            </CardContent>
          </Card>

          {/* Quick Action - Simulation */}
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 text-sm text-secondary mb-1">
                <Zap className="w-4 h-4 text-warning" />
                Simulation Ready
              </div>
              <p className="text-sm text-secondary mb-3">
                Test how market shocks could affect stocks
              </p>
              <Link href="/simulation">
                <Button size="sm" variant="outline" className="w-full">
                  Run Scenario
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Opportunities (LEFT) and Alerts (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Opportunities - LEFT */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-buy" />
                Today&apos;s Opportunities
              </CardTitle>
              <Link href="/market">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View all <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary mb-4">
                Companies with strong fundamentals, healthy solvency, and favorable technicals.
              </p>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-secondary">Loading...</div>
                ) : signals.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-secondary">No opportunities today</p>
                    <p className="text-sm text-muted mt-1">
                      Check back later for new signals
                    </p>
                  </div>
                ) : (
                  signals.slice(0, 5).map((stock) => (
                    <div
                      key={stock.ticker}
                      className="rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden"
                    >
                      {/* Opportunity Header - Clickable */}
                      <button
                        onClick={() => toggleOpportunity(stock.ticker)}
                        className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-slate-600">
                                {stock.ticker.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-primary">{stock.ticker}</p>
                              <p className="text-sm text-secondary truncate max-w-[150px]">{stock.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge
                                variant={
                                  stock.signal === 'BUY' ? 'success' :
                                  stock.signal === 'SELL' ? 'danger' : 'warning'
                                }
                              >
                                {stock.signal}
                              </Badge>
                              <p className="text-xs text-muted mt-1 tabular-nums">
                                {Math.round(stock.confidence * 100)}% conf
                              </p>
                            </div>
                            {expandedOpportunity === stock.ticker ? (
                              <ChevronUp className="w-4 h-4 text-muted" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Opportunity Details */}
                      {expandedOpportunity === stock.ticker && (
                        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
                          <div className="pt-3 space-y-3">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-muted mb-1">Confidence</p>
                                <p className="text-lg font-semibold text-primary">
                                  {Math.round(stock.confidence * 100)}%
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-muted mb-1">Risk</p>
                                <p className={`text-lg font-semibold ${
                                  stock.supplyChainRisk > 0.7 ? 'text-sell' :
                                  stock.supplyChainRisk > 0.4 ? 'text-warning' : 'text-buy'
                                }`}>
                                  {Math.round(stock.supplyChainRisk * 100)}%
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-muted mb-1">Signal</p>
                                <p className="text-lg font-semibold text-indigo-600">
                                  {stock.whisperScore.toFixed(1)}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-muted">
                              Last updated: {new Date(stock.lastUpdated).toLocaleDateString()}
                            </p>

                            <div className="flex items-center gap-2">
                              <Link href={`/stock/${stock.ticker}`} className="flex-1">
                                <Button variant="default" size="sm" className="w-full">
                                  <Network className="w-3 h-3 mr-1" />
                                  View Deep Dive
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm">
                                <Star className="w-3 h-3 mr-1" />
                                Watch
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Market Alerts - RIGHT */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-warning" />
                Market Alerts
              </CardTitle>
              <Link href="/alerts">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View all <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-secondary">Loading...</div>
                ) : whispers.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-secondary">No recent alerts</p>
                    <p className="text-sm text-muted mt-1">
                      We&apos;ll notify you when news or events could affect your watchlist
                    </p>
                  </div>
                ) : (
                  whispers.map((whisper) => (
                    <div
                      key={whisper.id}
                      className="rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden"
                    >
                      {/* Alert Header - Clickable */}
                      <button
                        onClick={() => toggleAlert(whisper.id)}
                        className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${
                              whisper.severity === 'high' ? 'bg-sell/10' :
                              whisper.severity === 'medium' ? 'bg-warning/10' : 'bg-slate-100'
                            }`}>
                              <AlertTriangle className={`w-4 h-4 ${
                                whisper.severity === 'high' ? 'text-sell' :
                                whisper.severity === 'medium' ? 'text-warning' : 'text-secondary'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={whisper.severity === 'high' ? 'danger' : whisper.severity === 'medium' ? 'warning' : 'secondary'} className="text-xs">
                                  {whisper.filingType}
                                </Badge>
                                <span className="font-medium text-primary">{whisper.sourceTicker}</span>
                                {whisper.affectedTickers.length > 0 && (
                                  <>
                                    <ArrowRight className="w-3 h-3 text-muted" />
                                    <span className="text-indigo-600 font-medium">
                                      {whisper.affectedTickers[0]}
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm font-medium text-primary mt-1 line-clamp-1">{whisper.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={whisper.severity === 'high' ? 'danger' : whisper.severity === 'medium' ? 'warning' : 'secondary'}>
                              {whisper.severity}
                            </Badge>
                            {expandedAlert === whisper.id ? (
                              <ChevronUp className="w-4 h-4 text-muted" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Alert Details */}
                      {expandedAlert === whisper.id && (
                        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
                          <div className="pt-3 space-y-3">
                            <p className="text-sm text-secondary">{whisper.summary}</p>

                            <div className="flex items-center gap-4 text-xs text-muted">
                              <span>Filed: {whisper.filingDate}</span>
                              <span>Source: {whisper.sourceName}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link href={`/stock/${whisper.sourceTicker}`}>
                                <Button variant="outline" size="sm">
                                  <Network className="w-3 h-3 mr-1" />
                                  View {whisper.sourceTicker}
                                </Button>
                              </Link>
                              {whisper.affectedTickers.length > 0 && (
                                <Link href={`/stock/${whisper.affectedTickers[0]}`}>
                                  <Button variant="outline" size="sm">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View {whisper.affectedTickers[0]}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
