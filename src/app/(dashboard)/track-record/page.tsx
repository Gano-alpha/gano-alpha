'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Shield,
  BarChart3,
  Info,
  ExternalLink,
} from 'lucide-react'

const API_BASE = '/backend'

// ─── Types ──────────────────────────────────────────────────────────────

interface SnapshotDay {
  date: string
  tickers_scored: number
  median_score: number
  mean_score: number
  p90_score: number
  regime_distribution: Record<string, number>
}

interface TrackRecordStats {
  total_snapshot_days: number
  first_snapshot_date: string
  latest_snapshot_date: string
  avg_tickers_per_day: number
  avg_q5_q1_spread: number | null
}

interface ReturnRecord {
  date: string
  q1_return: number
  q5_return: number
  spread: number
  n_tickers: number
}

interface HistoryPoint {
  date: string
  median_score: number
  mean_score: number
  p90_score: number
  tickers_scored: number
  regime: string
}

// ─── Helpers ────────────────────────────────────────────────────────────

const regimeColor = (regime: string) => {
  switch (regime) {
    case 'calm': return 'bg-emerald-400'
    case 'normal': return 'bg-blue-400'
    case 'elevated': return 'bg-amber-400'
    case 'stressed': return 'bg-orange-400'
    case 'crisis': return 'bg-red-500'
    default: return 'bg-slate-400'
  }
}

const regimeBadge = (regime: string): 'success' | 'warning' | 'danger' | 'default' => {
  switch (regime) {
    case 'calm': return 'success'
    case 'normal': return 'default'
    case 'elevated': return 'warning'
    case 'stressed': case 'crisis': return 'danger'
    default: return 'default'
  }
}

const classifyRegime = (score: number) => {
  if (score < 0.20) return 'calm'
  if (score < 0.40) return 'normal'
  if (score < 0.60) return 'elevated'
  if (score < 0.80) return 'stressed'
  return 'crisis'
}

const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`
const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// ─── Component ──────────────────────────────────────────────────────────

export default function TrackRecordPage() {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [stats, setStats] = useState<TrackRecordStats | null>(null)
  const [returns, setReturns] = useState<ReturnRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(90)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [histRes, statsRes, returnsRes] = await Promise.all([
          fetch(`${API_BASE}/api/fragility/market/history?days=${days}`),
          fetch(`${API_BASE}/api/fragility/track-record/stats`),
          fetch(`${API_BASE}/api/fragility/track-record/returns?forward_days=30&lookback_days=${days}`),
        ])

        if (histRes.ok) {
          const data = await histRes.json()
          setHistory(data.data || [])
        }
        if (statsRes.ok) setStats(await statsRes.json())
        if (returnsRes.ok) {
          const data = await returnsRes.json()
          setReturns(data || [])
        }
      } catch (err) {
        setError('Failed to load track record data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [days])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h1 className="text-lg font-semibold text-primary">Public Track Record</h1>
              <p className="text-sm text-secondary mt-1 leading-relaxed">
                Every day, we save an <strong>immutable snapshot</strong> of every stock&apos;s fragility score.
                This page shows the full history — no backfilling, no revisions, no hindsight.
                These are the actual scores as computed on each date.
              </p>
              {stats && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {stats.total_snapshot_days} days of snapshots
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    ~{stats.avg_tickers_per_day?.toLocaleString()} stocks/day
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Since {formatDate(stats.first_snapshot_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Time Range Selector ─────────────────────────────────────── */}
        <div className="flex gap-2">
          {[30, 90, 180, 365].map(d => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setDays(d); setLoading(true) }}
            >
              {d}d
            </Button>
          ))}
        </div>

        {/* ── Daily History Table ──────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Daily Fragility Snapshots
            </CardTitle>
            <p className="text-xs text-muted mt-1">
              Each row is an immutable record — the market-wide fragility reading saved at end of day.
            </p>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No snapshot data available yet. Snapshots start accumulating daily.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-muted">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4 text-right">Median</th>
                      <th className="py-2 pr-4 text-right">Mean</th>
                      <th className="py-2 pr-4 text-right">P90</th>
                      <th className="py-2 pr-4 text-right">Stocks</th>
                      <th className="py-2 pr-4">Regime</th>
                      <th className="py-2">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice().reverse().map(day => {
                      const regime = day.regime || classifyRegime(day.median_score)
                      return (
                        <tr key={day.date} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2 pr-4 tabular-nums">{formatDate(day.date)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums font-medium">
                            {(day.median_score * 100).toFixed(1)}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted">
                            {(day.mean_score * 100).toFixed(1)}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted">
                            {(day.p90_score * 100).toFixed(1)}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted">
                            {day.tickers_scored?.toLocaleString() || '—'}
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant={regimeBadge(regime)} className="capitalize text-[10px]">{regime}</Badge>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-0.5 h-2 w-32 rounded-full overflow-hidden">
                              {(['calm', 'normal', 'elevated', 'stressed', 'crisis'] as const).map(r => {
                                const total = day.tickers_scored || 1
                                const regDist = (day as unknown as { regime_distribution?: Record<string, number> }).regime_distribution
                                // History endpoint doesn't have regime_distribution, so show a simple bar
                                return null
                              })}
                              {/* Show a median bar visualization */}
                              <div className="h-full w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    day.median_score > 0.7 ? 'bg-red-400' :
                                    day.median_score > 0.5 ? 'bg-orange-400' :
                                    day.median_score > 0.3 ? 'bg-amber-400' :
                                    day.median_score > 0.15 ? 'bg-blue-400' : 'bg-emerald-400'
                                  }`}
                                  style={{ width: `${day.median_score * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── GANO vs Returns ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Does Fragility Predict Returns?
            </CardTitle>
            <p className="text-xs text-muted mt-1">
              We split stocks into quintiles by fragility score on each date, then measure forward 30-day returns.
              If the index works, the most fragile quintile (Q5) should underperform the least fragile (Q1).
            </p>
          </CardHeader>
          <CardContent>
            {returns.length === 0 ? (
              <div className="text-center py-8">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-muted">
                  Forward return analysis requires 30+ days of snapshots. Data is accumulating — check back soon.
                </p>
              </div>
            ) : (
              <>
                {/* Summary card */}
                {stats?.avg_q5_q1_spread != null && (
                  <div className={`p-4 rounded-lg border mb-4 ${
                    stats.avg_q5_q1_spread < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {stats.avg_q5_q1_spread < 0 ? (
                        <TrendingDown className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">
                          Average Q5-Q1 Spread: {(stats.avg_q5_q1_spread * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-secondary mt-0.5">
                          {stats.avg_q5_q1_spread < 0
                            ? 'The most fragile stocks underperformed the least fragile — the index is working as intended.'
                            : 'The spread is currently positive — more data needed for statistical significance.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs text-muted">
                        <th className="py-2 pr-4">Snapshot Date</th>
                        <th className="py-2 pr-4 text-right">Q1 Return (Least Fragile)</th>
                        <th className="py-2 pr-4 text-right">Q5 Return (Most Fragile)</th>
                        <th className="py-2 pr-4 text-right">Spread</th>
                        <th className="py-2 pr-4 text-right">N Tickers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map(r => (
                        <tr key={r.date} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2 pr-4 tabular-nums">{formatDate(r.date)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-emerald-600 font-medium">
                            {(r.q1_return * 100).toFixed(2)}%
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-red-600 font-medium">
                            {(r.q5_return * 100).toFixed(2)}%
                          </td>
                          <td className={`py-2 pr-4 text-right tabular-nums font-semibold ${
                            r.spread < 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {(r.spread * 100).toFixed(2)}%
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-muted">
                            {r.n_tickers.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Methodology Summary ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Methodology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">What We Measure</h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    The GANO Fragility Index measures how financially fragile each US-listed company is
                    on a given day. It combines four independent signals into a single score from 0
                    (rock solid) to 100 (extremely fragile).
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">The Four Signals</h3>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Distance-to-Default', weight: '30%', desc: 'Merton structural credit model. Measures how close a company is to defaulting on its debt based on equity value, total debt, and equity volatility. Lower DTD = higher fragility.' },
                      { name: 'Volatility Ratio', weight: '25%', desc: 'Ratio of 20-day realized volatility to 252-day (annual) realized volatility. Values above 1.0 indicate the stock is more volatile than its baseline — a sign of acute stress.' },
                      { name: 'Drawdown', weight: '25%', desc: 'Current price decline from 52-week high. A -40% drawdown means significant pain and potential for further selling pressure.' },
                      { name: 'Supply Chain Degree', weight: '20%', desc: 'Number of supplier + customer connections in our 225K-edge supply chain graph. More connections = more pathways for stress contagion.' },
                    ].map(s => (
                      <div key={s.name} className="flex gap-3">
                        <div className="w-10 h-6 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600">{s.weight}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium">{s.name}</p>
                          <p className="text-xs text-muted">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">Scoring Method</h3>
                  <p className="text-xs text-secondary leading-relaxed">
                    Each signal is <strong>cross-sectionally percentile-ranked</strong> on each date.
                    A percentile of 0.85 means the company is more fragile than 85% of the market on that signal.
                    The final score is a weighted average of available signals, with weights redistributed
                    proportionally when a signal is missing for a given ticker.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">Validation</h3>
                  <div className="space-y-2 text-xs text-secondary">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="font-medium text-primary mb-1">COVID-19 (March 2020)</p>
                      <p>10.2% return spread between most and least fragile quintiles. Monotonic across all 5 quintiles. The most fragile stocks (D1) had median crash of -44.5% vs -34.3% for least fragile (D10).</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="font-medium text-primary mb-1">SVB Crisis (March 2023)</p>
                      <p>Financial sector fragility elevated in February 2023, 30+ days before SVB collapse. Regional bank fragility scores spiked to crisis levels.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="font-medium text-primary mb-1">Rank Stability</p>
                      <p>Week-to-week Spearman rank correlation above 0.9. Scores change gradually, not randomly.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-primary mb-2">Data Sources</h3>
                  <div className="text-xs text-muted space-y-1">
                    <p>OHLCV price data: Polygon.io (20K+ tickers daily)</p>
                    <p>Merton PD/DD: 23.7M records back to 1999</p>
                    <p>Supply chain graph: 225K edges from SEC filings (10-K, 10-Q)</p>
                    <p>Model version: gfi_v3.0 | Weights: DTD=0.30, Vol=0.25, DD=0.25, SC=0.20</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-muted">
                This is not investment advice. The GANO Fragility Index is a research tool measuring financial stress.
                Past performance in backtests does not guarantee future predictive accuracy.
                All scores are computed mechanically with no human discretion.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
