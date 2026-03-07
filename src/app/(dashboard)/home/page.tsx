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
  HelpCircle,
  Info,
  Network,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Loader2,
} from 'lucide-react'

const API_BASE = '/backend'

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

const regimeExplainer = (regime: string) => {
  switch (regime) {
    case 'calm': return 'Most companies are financially healthy with low stress indicators.'
    case 'normal': return 'Typical market conditions. Some pockets of stress but nothing systemic.'
    case 'elevated': return 'Above-average stress detected across the market. Worth monitoring.'
    case 'stressed': return 'Significant financial stress. Multiple sectors showing warning signs.'
    case 'crisis': return 'Extreme stress levels similar to major market crises.'
    default: return ''
  }
}

const componentExplainer: Record<string, string> = {
  dtd: 'How far a company is from defaulting on its debt, based on the Merton structural credit model. Lower percentile = closer to default = more fragile.',
  vol_ratio: 'Recent 20-day volatility compared to the past year. When this spikes, it means the stock is moving much more than usual — a sign of stress.',
  drawdown: 'How far the stock has fallen from its 52-week high. A -30% drawdown means significant pain for holders.',
  sc_degree: 'How many supplier/customer connections a company has. More connections = more ways stress can spread to or from this company.',
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
        setTickerError(`No fragility data for ${ticker}. Try a US-listed stock like AAPL, TSLA, or META.`)
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

        {/* ── What is this? ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-primary">GANO Fragility Index</h2>
              <p className="text-sm text-secondary mt-1 leading-relaxed">
                We measure how <strong>financially fragile</strong> every US-listed company is, updated daily.
                Think of it like a credit score for stock fragility — <strong>0 = rock solid, 100 = extremely fragile</strong>.
                We combine 4 independent signals: how close a company is to defaulting on its debt, how volatile it&apos;s been recently,
                how far it&apos;s fallen from its highs, and how exposed it is through supply chain connections.
              </p>
              <p className="text-sm text-secondary mt-2 leading-relaxed">
                The index was validated against real crises — it correctly identified the most fragile companies
                <strong> before</strong> COVID-19 and SVB collapsed, with a 10.2% return spread between the most and least fragile quintiles.
              </p>
            </div>
          </div>
        </div>

        {/* ── Hero: Market Fragility Overview ──────────────────────────── */}
        {market && (
          <div className={`rounded-xl border p-6 ${regimeBg(market.regime)}`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted font-medium">Today&apos;s Market Reading</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-bold tabular-nums text-primary">
                    {(market.median_score * 100).toFixed(1)}
                  </span>
                  <span className="text-sm text-secondary">/ 100</span>
                  <Badge variant={regimeBadge(market.regime)} className="capitalize text-sm">
                    {market.regime}
                  </Badge>
                </div>
                <p className="text-sm text-secondary mt-1">
                  {regimeExplainer(market.regime)}
                </p>
                <p className="text-xs text-muted mt-2">
                  Based on {market.tickers_scored.toLocaleString()} US stocks as of {market.date}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center min-w-[240px]">
                <div>
                  <p className="text-xs text-muted">Average</p>
                  <p className="text-xl font-semibold tabular-nums">{(market.mean_score * 100).toFixed(1)}</p>
                </div>
                <div title="90th percentile — only 10% of stocks are more fragile than this">
                  <p className="text-xs text-muted">Top 10%</p>
                  <p className="text-xl font-semibold tabular-nums">{(market.p90_score * 100).toFixed(1)}</p>
                </div>
                <div title="99th percentile — the most fragile 1% of stocks">
                  <p className="text-xs text-muted">Top 1%</p>
                  <p className="text-xl font-semibold tabular-nums">{(market.p99_score * 100).toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Regime Distribution */}
            {market.regime_distribution && (
              <>
                <p className="text-xs text-muted mt-4 mb-1">How stocks are distributed across risk levels:</p>
                <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden">
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
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {(['calm', 'normal', 'elevated', 'stressed', 'crisis'] as const).map(r => {
                    const count = market.regime_distribution[r] || 0
                    if (count === 0) return null
                    const labels: Record<string, string> = {
                      calm: 'Calm (0-20)', normal: 'Normal (20-40)', elevated: 'Elevated (40-60)',
                      stressed: 'Stressed (60-80)', crisis: 'Crisis (80-100)'
                    }
                    return (
                      <span key={r} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${
                          r === 'calm' ? 'bg-emerald-400' : r === 'normal' ? 'bg-blue-400' :
                          r === 'elevated' ? 'bg-amber-400' : r === 'stressed' ? 'bg-orange-400' : 'bg-red-500'
                        }`} />
                        {labels[r]}: {count.toLocaleString()}
                      </span>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Ticker Lookup ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="w-4 h-4" />
              Look Up Any Stock
            </CardTitle>
            <p className="text-sm text-secondary mt-1">
              Enter a ticker symbol to see its fragility breakdown — what&apos;s driving its risk score and how each signal contributes.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. AAPL, TSLA, NVDA, META, JPM"
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{tickerResult.ticker}</span>
                    <Badge variant={regimeBadge(tickerResult.regime)} className="capitalize">
                      {tickerResult.regime}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold tabular-nums">
                      {(tickerResult.fragility_score * 100).toFixed(1)}
                    </span>
                    <span className="text-sm text-muted ml-1">/ 100</span>
                  </div>
                </div>
                <p className="text-xs text-secondary mb-4">
                  {tickerResult.fragility_score > 0.7
                    ? 'This stock shows high fragility — multiple stress signals are elevated.'
                    : tickerResult.fragility_score > 0.4
                    ? 'Moderate fragility — some stress signals are present but not alarming.'
                    : 'Low fragility — this stock appears financially resilient right now.'}
                </p>

                <p className="text-xs font-medium text-secondary mb-2">Signal Breakdown (each scored 0-100, higher = more fragile):</p>
                <div className="space-y-3">
                  {tickerResult.components.map(c => {
                    const friendlyNames: Record<string, string> = {
                      dtd: 'Default Risk',
                      vol_ratio: 'Volatility Spike',
                      drawdown: 'Price Decline',
                      sc_degree: 'Supply Chain Exposure',
                    }
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between text-sm mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-primary">{friendlyNames[c.name] || c.name}</span>
                            <span className="text-xs text-muted">({Math.round(c.weight * 100)}% weight)</span>
                          </div>
                          <span className="tabular-nums font-semibold">{(c.score * 100).toFixed(1)}</span>
                        </div>
                        {scoreBar(c.score)}
                        <p className="text-xs text-muted mt-0.5">{componentExplainer[c.name]}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-muted mt-4 pt-3 border-t border-slate-200">
                  {tickerResult.components_available}/4 signals available for this stock | Data as of {tickerResult.date}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Top Fragile / Resilient ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Fragile */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Highest Risk Stocks
                </CardTitle>
                <Link href="/fragility">
                  <Button variant="ghost" size="sm" className="text-indigo-600">
                    See all <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted mt-1">Companies showing the most stress signals right now. Higher score = more fragile.</p>
            </CardHeader>
            <CardContent>
              {topFragile.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No data available</p>
              ) : (
                <div className="space-y-2">
                  {topFragile.map((t, i) => (
                    <button
                      key={t.ticker}
                      onClick={() => { setSearchTicker(t.ticker); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-4 tabular-nums">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{t.ticker}</p>
                          <Badge variant={regimeBadge(t.regime)} className="text-[10px] capitalize">{t.regime}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums text-red-600">{(t.fragility_score * 100).toFixed(1)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Resilient */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Most Resilient Stocks
                </CardTitle>
                <Link href="/fragility">
                  <Button variant="ghost" size="sm" className="text-indigo-600">
                    See all <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted mt-1">Companies with the lowest fragility — financially healthy with stable prices.</p>
            </CardHeader>
            <CardContent>
              {topResilient.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No data available</p>
              ) : (
                <div className="space-y-2">
                  {topResilient.map((t, i) => (
                    <button
                      key={t.ticker}
                      onClick={() => { setSearchTicker(t.ticker); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted w-4 tabular-nums">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{t.ticker}</p>
                          <Badge variant={regimeBadge(t.regime)} className="text-[10px] capitalize">{t.regime}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums text-emerald-600">{(t.fragility_score * 100).toFixed(1)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Methodology ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Info className="w-4 h-4" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1">The 4 Signals</h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Each stock is scored on 4 independent dimensions of financial fragility,
                    then combined into a single 0-100 score.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">30%</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Default Risk (Merton Model)</p>
                      <p className="text-xs text-muted">
                        Uses the Merton structural credit model to estimate how close a company is to
                        defaulting on its debt, based on equity value, debt, and volatility.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">25%</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Volatility Spike</p>
                      <p className="text-xs text-muted">
                        Compares recent 20-day realized volatility to the full-year average.
                        A ratio above 1.0 means the stock is more volatile than usual.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">25%</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Price Decline (Drawdown)</p>
                      <p className="text-xs text-muted">
                        How far the stock has fallen from its 52-week high.
                        A stock at its high scores 0; a stock down 50% scores much higher.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">20%</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Supply Chain Exposure</p>
                      <p className="text-xs text-muted">
                        Counts how many supplier and customer relationships a company has.
                        More connections mean more ways for financial stress to spread.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1">Scoring Method</h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Each signal is <strong>percentile-ranked</strong> across all stocks on that day.
                    A score of 75 means the company is more fragile than 75% of the market on that signal.
                    The final score is a weighted average of all available signals.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1">Regime Classification</h3>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Calm', range: '0 - 20', color: 'bg-emerald-400', desc: 'Low risk, stable' },
                      { label: 'Normal', range: '20 - 40', color: 'bg-blue-400', desc: 'Typical conditions' },
                      { label: 'Elevated', range: '40 - 60', color: 'bg-amber-400', desc: 'Above-average stress' },
                      { label: 'Stressed', range: '60 - 80', color: 'bg-orange-400', desc: 'Significant concern' },
                      { label: 'Crisis', range: '80 - 100', color: 'bg-red-500', desc: 'Extreme fragility' },
                    ].map(r => (
                      <div key={r.label} className="flex items-center gap-2 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.color} flex-shrink-0`} />
                        <span className="font-medium w-16">{r.label}</span>
                        <span className="text-muted w-12 tabular-nums">{r.range}</span>
                        <span className="text-muted">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-1">Validation</h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Backtested against COVID-19 (March 2020) and SVB crisis (March 2023).
                    The most fragile quintile experienced 10.2% worse returns than the least fragile during COVID,
                    with monotonic spread across all 5 quintiles. Rank stability (Spearman rho) above 0.9 week-to-week.
                  </p>
                </div>
              </div>
            </div>

            {/* Data stats */}
            {health && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
                  <span>Model: {health.model_version}</span>
                  <span>Last updated: {health.last_computed_date}</span>
                  <span>Coverage: {health.tickers_scored.toLocaleString()} stocks</span>
                  {health.component_coverage && Object.entries(health.component_coverage).map(([k, v]) => {
                    const names: Record<string, string> = { dtd: 'Default Risk', vol_ratio: 'Volatility', drawdown: 'Drawdown', sc_degree: 'Supply Chain' }
                    return <span key={k}>{names[k] || k}: {v.toLocaleString()} stocks</span>
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
