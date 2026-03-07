'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Database,
  Network,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Loader2,
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.ganoalpha.com'

// ─── Types ──────────────────────────────────────────────────────────────

interface MarketFragility {
  date: string
  median_score: number
  mean_score: number
  p90_score: number
  p99_score: number
  regime: string
  tickers_scored: number
  regime_distribution: Record<string, number>
  config_hash: string
}

interface TopTicker {
  ticker: string
  fragility_score: number
  regime: string
  dtd_score: number | null
  vol_ratio_score: number | null
  drawdown_score: number | null
  sc_degree_score: number | null
}

interface HealthData {
  last_computed_date: string
  hours_since_last_update: number | null
  is_stale: boolean
  tickers_scored: number
  model_version: string
  component_coverage: Record<string, number>
}

interface TickerResult {
  ticker: string
  date: string
  fragility_score: number
  regime: string
  components: {
    name: string
    score: number
    weight: number
    contribution: number
    raw_value: number | null
    description: string
  }[]
  components_available: number
}

// ─── Helpers ────────────────────────────────────────────────────────────

const regimeColor = (regime: string) => {
  switch (regime) {
    case 'calm': return 'text-emerald-600'
    case 'normal': return 'text-blue-600'
    case 'elevated': return 'text-amber-600'
    case 'stressed': return 'text-orange-600'
    case 'crisis': return 'text-red-600'
    default: return 'text-slate-600'
  }
}

const regimeBg = (regime: string) => {
  switch (regime) {
    case 'calm': return 'bg-emerald-50 border-emerald-200'
    case 'normal': return 'bg-blue-50 border-blue-200'
    case 'elevated': return 'bg-amber-50 border-amber-200'
    case 'stressed': return 'bg-orange-50 border-orange-200'
    case 'crisis': return 'bg-red-50 border-red-200'
    default: return 'bg-slate-50 border-slate-200'
  }
}

const regimeBadge = (regime: string): 'success' | 'warning' | 'danger' | 'default' | 'accent' => {
  switch (regime) {
    case 'calm': return 'success'
    case 'normal': return 'default'
    case 'elevated': return 'warning'
    case 'stressed': return 'danger'
    case 'crisis': return 'danger'
    default: return 'default'
  }
}

const scoreBar = (score: number | null) => {
  if (score === null) return null
  const pct = Math.round(score * 100)
  const color = score > 0.7 ? 'bg-red-500' : score > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted w-8 text-right">{pct}%</span>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────

export default function HomePage() {
  const [market, setMarket] = useState<MarketFragility | null>(null)
  const [topFragile, setTopFragile] = useState<TopTicker[]>([])
  const [topResilient, setTopResilient] = useState<TopTicker[]>([])
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ticker search
  const [searchTicker, setSearchTicker] = useState('')
  const [tickerResult, setTickerResult] = useState<TickerResult | null>(null)
  const [tickerLoading, setTickerLoading] = useState(false)
  const [tickerError, setTickerError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [marketRes, fragileRes, resilientRes, healthRes] = await Promise.all([
          fetch(`${API_BASE}/api/fragility/market/current`),
          fetch(`${API_BASE}/api/fragility/top?n=5&direction=most`),
          fetch(`${API_BASE}/api/fragility/top?n=5&direction=least`),
          fetch(`${API_BASE}/api/fragility/health`),
        ])

        if (marketRes.ok) setMarket(await marketRes.json())
        if (fragileRes.ok) setTopFragile(await fragileRes.json())
        if (resilientRes.ok) setTopResilient(await resilientRes.json())
        if (healthRes.ok) setHealth(await healthRes.json())
      } catch (err) {
        setError('Failed to connect to GANO API')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const lookupTicker = useCallback(async () => {
    const ticker = searchTicker.trim().toUpperCase()
    if (!ticker) return
    setTickerLoading(true)
    setTickerError(null)
    setTickerResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/fragility/ticker/${ticker}`)
      if (res.ok) {
        setTickerResult(await res.json())
      } else if (res.status === 404) {
        setTickerError(`No fragility data for ${ticker}`)
      } else if (res.status === 401 || res.status === 403) {
        setTickerError('Authentication required for per-ticker lookup')
      } else {
        setTickerError('Failed to fetch ticker data')
      }
    } catch {
      setTickerError('Network error')
    } finally {
      setTickerLoading(false)
    }
  }, [searchTicker])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  if (error && !market) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-secondary">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ── Hero: Market Fragility Overview ──────────────────────────── */}
        {market && (
          <div className={`rounded-xl border p-6 ${regimeBg(market.regime)}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted font-medium">GANO Fragility Index</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-bold tabular-nums text-primary">
                    {(market.median_score * 100).toFixed(1)}
                  </span>
                  <span className={`text-lg font-semibold capitalize ${regimeColor(market.regime)}`}>
                    {market.regime}
                  </span>
                </div>
                <p className="text-sm text-secondary mt-1">
                  Market-wide median fragility as of {market.date} | {market.tickers_scored.toLocaleString()} tickers scored
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted">Mean</p>
                  <p className="text-xl font-semibold tabular-nums">{(market.mean_score * 100).toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">P90</p>
                  <p className="text-xl font-semibold tabular-nums">{(market.p90_score * 100).toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">P99</p>
                  <p className="text-xl font-semibold tabular-nums">{(market.p99_score * 100).toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Regime Distribution */}
            {market.regime_distribution && (
              <div className="mt-4 flex items-center gap-1 h-3 rounded-full overflow-hidden">
                {(['calm', 'normal', 'elevated', 'stressed', 'crisis'] as const).map(r => {
                  const count = market.regime_distribution[r] || 0
                  const pct = market.tickers_scored > 0 ? (count / market.tickers_scored) * 100 : 0
                  if (pct === 0) return null
                  const colors: Record<string, string> = {
                    calm: 'bg-emerald-400', normal: 'bg-blue-400', elevated: 'bg-amber-400',
                    stressed: 'bg-orange-400', crisis: 'bg-red-500'
                  }
                  return (
                    <div
                      key={r}
                      className={`h-full ${colors[r]} first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${pct}%` }}
                      title={`${r}: ${count} tickers (${pct.toFixed(1)}%)`}
                    />
                  )
                })}
              </div>
            )}
            {market.regime_distribution && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {(['calm', 'normal', 'elevated', 'stressed', 'crisis'] as const).map(r => {
                  const count = market.regime_distribution[r] || 0
                  if (count === 0) return null
                  return (
                    <span key={r} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        r === 'calm' ? 'bg-emerald-400' : r === 'normal' ? 'bg-blue-400' :
                        r === 'elevated' ? 'bg-amber-400' : r === 'stressed' ? 'bg-orange-400' : 'bg-red-500'
                      }`} />
                      {r}: {count.toLocaleString()}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Tickers Scored</p>
                  <p className="text-2xl font-semibold tabular-nums">{market?.tickers_scored?.toLocaleString() || '—'}</p>
                </div>
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Model Version</p>
                  <p className="text-2xl font-semibold">{health?.model_version || '—'}</p>
                </div>
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Data Freshness</p>
                  <p className="text-2xl font-semibold">
                    {health?.hours_since_last_update != null
                      ? `${Math.round(health.hours_since_last_update)}h`
                      : '—'}
                  </p>
                </div>
                <Activity className={`w-5 h-5 ${health?.is_stale ? 'text-amber-500' : 'text-emerald-500'}`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Signals</p>
                  <p className="text-2xl font-semibold">4</p>
                  <p className="text-xs text-muted">DTD, Vol, DD, SC</p>
                </div>
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Ticker Lookup ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="w-4 h-4" />
              Ticker Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter ticker (e.g. AAPL, TSLA, NVDA)"
                value={searchTicker}
                onChange={e => setSearchTicker(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupTicker()}
                className="max-w-xs"
              />
              <Button onClick={lookupTicker} disabled={tickerLoading} size="sm">
                {tickerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
              </Button>
            </div>

            {tickerError && (
              <p className="text-sm text-red-500 mt-3">{tickerError}</p>
            )}

            {tickerResult && (
              <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-lg font-bold">{tickerResult.ticker}</span>
                    <Badge variant={regimeBadge(tickerResult.regime)} className="ml-2 capitalize">
                      {tickerResult.regime}
                    </Badge>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {(tickerResult.fragility_score * 100).toFixed(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  {tickerResult.components.map(c => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-sm mb-0.5">
                        <span className="text-secondary">{c.description || c.name}</span>
                        <span className="tabular-nums font-medium">{(c.score * 100).toFixed(1)}%</span>
                      </div>
                      {scoreBar(c.score)}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted mt-3">
                  {tickerResult.components_available}/4 signals available | As of {tickerResult.date}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Top Fragile / Resilient ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Fragile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Most Fragile
              </CardTitle>
              <Link href="/fragility">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  Full Dashboard <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {topFragile.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No data available</p>
              ) : (
                <div className="space-y-3">
                  {topFragile.map((t, i) => (
                    <div key={t.ticker} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-4">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{t.ticker}</p>
                          <Badge variant={regimeBadge(t.regime)} className="text-[10px] capitalize">{t.regime}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums text-red-600">{(t.fragility_score * 100).toFixed(1)}</p>
                        <div className="flex gap-1 mt-0.5">
                          {t.dtd_score != null && <span className="text-[10px] text-muted" title="DTD">D:{(t.dtd_score*100).toFixed(0)}</span>}
                          {t.vol_ratio_score != null && <span className="text-[10px] text-muted" title="Vol Ratio">V:{(t.vol_ratio_score*100).toFixed(0)}</span>}
                          {t.drawdown_score != null && <span className="text-[10px] text-muted" title="Drawdown">DD:{(t.drawdown_score*100).toFixed(0)}</span>}
                          {t.sc_degree_score != null && <span className="text-[10px] text-muted" title="SC Degree">SC:{(t.sc_degree_score*100).toFixed(0)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Resilient */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Most Resilient
              </CardTitle>
              <Link href="/fragility">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  Full Dashboard <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {topResilient.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No data available</p>
              ) : (
                <div className="space-y-3">
                  {topResilient.map((t, i) => (
                    <div key={t.ticker} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-4">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{t.ticker}</p>
                          <Badge variant={regimeBadge(t.regime)} className="text-[10px] capitalize">{t.regime}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums text-emerald-600">{(t.fragility_score * 100).toFixed(1)}</p>
                        <div className="flex gap-1 mt-0.5">
                          {t.dtd_score != null && <span className="text-[10px] text-muted" title="DTD">D:{(t.dtd_score*100).toFixed(0)}</span>}
                          {t.vol_ratio_score != null && <span className="text-[10px] text-muted" title="Vol Ratio">V:{(t.vol_ratio_score*100).toFixed(0)}</span>}
                          {t.drawdown_score != null && <span className="text-[10px] text-muted" title="Drawdown">DD:{(t.drawdown_score*100).toFixed(0)}</span>}
                          {t.sc_degree_score != null && <span className="text-[10px] text-muted" title="SC Degree">SC:{(t.sc_degree_score*100).toFixed(0)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Signal Coverage + Quick Links ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signal Coverage */}
          {health?.component_coverage && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Signal Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(health.component_coverage).map(([name, count]) => {
                    const labels: Record<string, string> = {
                      dtd: 'Distance-to-Default (Merton)',
                      vol_ratio: 'Realized Vol Ratio (20d/252d)',
                      drawdown: 'Drawdown from 52w High',
                      sc_degree: 'Supply Chain Degree',
                    }
                    const pct = health.tickers_scored > 0 ? (count / health.tickers_scored) * 100 : 0
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-secondary">{labels[name] || name}</span>
                          <span className="tabular-nums text-muted">{count.toLocaleString()} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explore */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Explore GANO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/fragility" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-medium text-sm">Fragility Dashboard</p>
                        <p className="text-xs text-muted">Full market fragility analysis with historical trends</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted" />
                  </div>
                </Link>
                <Link href="/chat" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-medium text-sm">AI Chat</p>
                        <p className="text-xs text-muted">Ask questions about any ticker, sector, or risk scenario</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted" />
                  </div>
                </Link>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-secondary mb-1">What powers this?</p>
                <p className="text-xs text-muted leading-relaxed">
                  4 orthogonal signals — Merton distance-to-default, realized vol ratio, drawdown depth,
                  and supply chain network degree — cross-sectionally percentile-ranked and weighted into a
                  single fragility score. Validated against COVID-19 (10.2% monotonic quintile spread) and SVB crisis.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
