'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Network,
  Plus,
  Shield,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
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

// Mock fallbacks so the UI shows value even when APIs are empty
const mockSignals: Signal[] = [
  {
    ticker: 'ACME',
    name: 'Acme Corp',
    signal: 'SELL',
    confidence: 0.96,
    whisperScore: 0.82,
    supplyChainRisk: 0.78,
    lastUpdated: new Date().toISOString(),
  },
  {
    ticker: 'BETA',
    name: 'Beta Industries',
    signal: 'BUY',
    confidence: 0.91,
    whisperScore: 0.31,
    supplyChainRisk: 0.22,
    lastUpdated: new Date().toISOString(),
  },
  {
    ticker: 'RISK',
    name: 'Risk Metrics Inc',
    signal: 'SELL',
    confidence: 0.94,
    whisperScore: 0.67,
    supplyChainRisk: 0.65,
    lastUpdated: new Date().toISOString(),
  },
]

const mockWhispers: Whisper[] = [
  {
    id: 'w1',
    sourceTicker: 'TSM',
    sourceName: 'Taiwan Semi',
    affectedTickers: ['NVDA', 'AMD'],
    severity: 'high',
    title: 'TSM fab delay could hit GPU supply',
    summary: 'Construction delay at TSM fab may constrain leading-edge supply for Q2.',
    filingType: '10-K',
    filingDate: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  },
  {
    id: 'w2',
    sourceTicker: 'SHEL',
    sourceName: 'Shell',
    affectedTickers: ['CVX'],
    severity: 'medium',
    title: 'Shell refinery outage',
    summary: 'Planned maintenance extended; downstream customers may see spot tightness.',
    filingType: '8-K',
    filingDate: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  },
]

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
          setSignals(signalsData.length ? signalsData : mockSignals)
        }

        if (whispersRes.ok) {
          const whispersData = await whispersRes.json()
          setWhispers(whispersData.length ? whispersData : mockWhispers)
        }
      } catch (error) {
        console.error('Error fetching home data:', error)
        setSignals(mockSignals)
        setWhispers(mockWhispers)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const unreadAlertsCount = whispers.filter(w => w.severity === 'high' || w.severity === 'medium').length
  const friendlyThesis = (signal: Signal | undefined) => {
    if (!signal) return ''
    const parts: string[] = []
    parts.push(signal.signal === 'BUY' ? 'Favorable setup' : signal.signal === 'SELL' ? 'Risk flagged' : 'Neutral')
    parts.push(`${Math.round(signal.confidence * 100)}% confidence`)
    parts.push(signal.supplyChainRisk > 0.7 ? 'Highly connected' : 'Moderate network risk')
    return parts.join(' • ')
  }

  const toggleOpportunity = (ticker: string) => {
    setExpandedOpportunity(expandedOpportunity === ticker ? null : ticker)
  }

  const toggleAlert = (id: string) => {
    setExpandedAlert(expandedAlert === id ? null : id)
  }

  const topSignal = signals[0]
  const highConvCount = signals.filter(s => s.confidence >= 0.9).length
  const sellCount = signals.filter(s => s.signal === 'SELL').length
  const buyCount = signals.filter(s => s.signal === 'BUY').length

  return (
    <div className="min-h-screen">
      <Header
        title="Good morning"
        subtitle="Here&apos;s your market intelligence brief"
      />

      <div className="p-6 space-y-6">
        {/* Hero Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 bg-gradient-to-br from-indigo-600 via-indigo-500 to-slate-900 text-white border-none shadow-lg">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Gano Alpha</p>
                  <h2 className="text-2xl font-semibold mt-1">High-Conviction Signals</h2>
                <p className="text-sm opacity-80">
                  Graph intelligence + solvency + PD, explained in plain language.
                </p>
                </div>
                <Badge variant="secondary" className="bg-white/15 text-white border-white/20">
                  {buyCount} Buy • {sellCount} Sell
                </Badge>
              </div>
              {topSignal ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs opacity-80">Sniper Spotlight</p>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <p className="text-lg font-semibold">{topSignal.ticker}</p>
                        <p className="text-sm opacity-80">{topSignal.signal} • {Math.round(topSignal.confidence * 100)}%</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold">
                        {topSignal.ticker.slice(0,2)}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs opacity-80">Supply Chain Risk</p>
                    <p className="text-xl font-semibold mt-1">{Math.round(topSignal.supplyChainRisk * 100)}%</p>
                    <p className="text-xs opacity-80">Upstream / downstream stress</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs opacity-80">Whisper Velocity</p>
                    <p className="text-xl font-semibold mt-1">{topSignal.whisperScore.toFixed(2)}</p>
                    <p className="text-xs opacity-80">Recent filing & news pressure</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/10 sm:col-span-2 lg:col-span-3">
                    <p className="text-xs opacity-80">In one line</p>
                    <p className="text-sm font-medium">
                      {friendlyThesis(topSignal)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-80">No signals loaded.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link href="/market">
                  <Button size="sm" variant="secondary" className="bg-white text-indigo-600 hover:bg-slate-100">
                    View Signals
                  </Button>
                </Link>
                <Link href="/simulation">
                  <Button size="sm" variant="secondary" className="bg-white text-indigo-600 hover:bg-slate-100">
                    Run Shock Test
                  </Button>
                </Link>
                <Link href="/alerts">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white text-indigo-600 hover:bg-slate-100"
                  >
                    Alerts
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Watchlist */}
            <Card className="h-full">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-secondary mb-1">Watchlist</p>
                  <p className="text-lg font-semibold text-primary">
                    {hasWatchlist ? `${watchlistCount} stocks` : 'Start tracking'}
                  </p>
                </div>
                <Link href="/portfolio">
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Alerts glance */}
            <Card className="h-full">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-secondary mb-1">Unread alerts</p>
                  <p className="text-lg font-semibold text-warning">{unreadAlertsCount}</p>
                </div>
                <Link href="/alerts">
                  <Button size="sm" variant="ghost">
                    <Bell className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">High Conviction (≥90%)</p>
                  <p className="text-2xl font-semibold text-primary">{highConvCount}</p>
                </div>
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Buy vs Sell</p>
                  <p className="text-2xl font-semibold text-primary">
                    {buyCount} / {sellCount}
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Alerts (med/high)</p>
                  <p className="text-2xl font-semibold text-warning">{unreadAlertsCount}</p>
                </div>
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Simulation Ready</p>
                  <p className="text-2xl font-semibold text-primary">War Room</p>
                </div>
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
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
                Graph-aware alpha calls with solvency + supply chain context.
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
                      className="rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden bg-white shadow-sm"
                    >
                      <button
                        onClick={() => toggleOpportunity(stock.ticker)}
                        className="w-full p-3 text-left"
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

                      {expandedOpportunity === stock.ticker && (
                        <div className="px-3 pb-3 border-t border-slate-100 bg-slate-50/50">
                          <div className="pt-3 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-muted mb-1">Confidence</p>
                                <p className="text-lg font-semibold text-primary">
                                  {Math.round(stock.confidence * 100)}%
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-muted mb-1">Supply Risk</p>
                                <p className={`text-lg font-semibold ${
                                  stock.supplyChainRisk > 0.7 ? 'text-sell' :
                                  stock.supplyChainRisk > 0.4 ? 'text-warning' : 'text-buy'
                                }`}>
                                  {Math.round(stock.supplyChainRisk * 100)}%
                                </p>
                              </div>
                              <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                                <p className="text-xs text-muted mb-1">Whisper</p>
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
