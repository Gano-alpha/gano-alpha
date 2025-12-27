'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SupplyChainGraph } from '@/components/features/supply-chain-graph'
import { cn } from '@/lib/utils'
import {
  Search,
  Loader2,
  List,
  GitBranch,
  Network,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowRight,
} from 'lucide-react'

interface Signal {
  ticker: string
  name: string | null
  tier?: 'SNIPER' | 'SCOUT'
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  solvency?: number | null
  centrality?: number | null
  mertonPd?: number | null
  altmanZ?: number | null
  drawdown?: number | null
  upstreamCount?: number | null
  downstreamCount?: number | null
  lastUpdated?: string
}

interface MiniNode {
  id: string
  ticker: string
  name: string
  type: 'supplier' | 'customer'
  relation: string
  confidence: number
}

interface MiniGraph {
  centerTicker: string
  centerName: string
  suppliers: MiniNode[]
  customers: MiniNode[]
}

const mockSignals: Signal[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    tier: 'SNIPER',
    signal: 'SELL',
    confidence: 0.96,
    centrality: 0.82,
    mertonPd: 12.4,
    altmanZ: 1.5,
    drawdown: -18.4,
    upstreamCount: 5,
    downstreamCount: 3,
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    tier: 'SCOUT',
    signal: 'BUY',
    confidence: 0.91,
    centrality: 0.65,
    mertonPd: 3.1,
    altmanZ: 3.2,
    drawdown: -9.2,
    upstreamCount: 7,
    downstreamCount: 10,
  },
  {
    ticker: 'TSM',
    name: 'TSMC',
    tier: 'SCOUT',
    signal: 'SELL',
    confidence: 0.89,
    centrality: 0.88,
    mertonPd: 8.8,
    altmanZ: 2.4,
    drawdown: -14.6,
    upstreamCount: 9,
    downstreamCount: 6,
  },
]

export default function MarketPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'cards' | 'graph'>('cards')
  const [signals, setSignals] = useState<Signal[]>([])
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'All' | 'SNIPER' | 'SCOUT'>('All')
  const [directionFilter, setDirectionFilter] = useState<'All' | 'BUY' | 'SELL' | 'HOLD'>('All')
  const [minConfidence, setMinConfidence] = useState(0.8)
  const [loading, setLoading] = useState(true)

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [graph, setGraph] = useState<MiniGraph | null>(null)
  const [graphLoading, setGraphLoading] = useState(false)

  // Load signals
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/signals?limit=50')
        if (res.ok) {
          const data = await res.json()
          setSignals(data?.length ? data : mockSignals)
          if (!selectedTicker && data?.length) setSelectedTicker(data[0].ticker)
        } else {
          setSignals(mockSignals)
          if (!selectedTicker) setSelectedTicker(mockSignals[0].ticker)
        }
      } catch (e) {
        console.error('fetch signals error', e)
        setSignals(mockSignals)
        if (!selectedTicker) setSelectedTicker(mockSignals[0].ticker)
      } finally {
        setLoading(false)
      }
    }
    load()
    // selectedTicker intentionally omitted to avoid resetting when user clicks a new ticker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load mini-graph
  useEffect(() => {
    if (!selectedTicker || viewMode !== 'graph') return
    const ticker = selectedTicker
    async function loadGraph() {
      setGraphLoading(true)
      try {
        const res = await fetch(`/api/supply-chain/${ticker}`)
        if (res.ok) {
          const data = await res.json()
          setGraph({
            centerTicker: ticker,
            centerName: data.name || ticker,
            suppliers: (data.suppliers || []).map((s: any, i: number) => ({
              id: s.id || `sup-${i}`,
              ticker: s.ticker,
              name: s.name,
              type: 'supplier',
              relation: s.relation || 'Supplier',
              confidence: s.confidence || 0.8,
            })),
            customers: (data.customers || []).map((c: any, i: number) => ({
              id: c.id || `cust-${i}`,
              ticker: c.ticker,
              name: c.name,
              type: 'customer',
              relation: c.relation || 'Customer',
              confidence: c.confidence || 0.8,
            })),
          })
        } else {
          setGraph({ centerTicker: ticker, centerName: ticker, suppliers: [], customers: [] })
        }
      } catch (e) {
        console.error('graph error', e)
        setGraph({ centerTicker: ticker, centerName: ticker, suppliers: [], customers: [] })
      } finally {
        setGraphLoading(false)
      }
    }
    loadGraph()
  }, [selectedTicker, viewMode])

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      const matchesSearch =
        !search ||
        s.ticker.toLowerCase().includes(search.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(search.toLowerCase())
      const matchesTier = tierFilter === 'All' || s.tier === tierFilter
      const matchesDir = directionFilter === 'All' || s.signal === directionFilter
      const matchesConf = s.confidence >= minConfidence
      return matchesSearch && matchesTier && matchesDir && matchesConf
    })
  }, [signals, search, tierFilter, directionFilter, minConfidence])

  const tierBadge = (tier?: string) => {
    if (!tier) return null
    return (
      <Badge className={cn('text-[11px] uppercase', tier === 'SNIPER' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white')}>
        {tier}
      </Badge>
    )
  }

  const signalBadge = (signal: Signal['signal']) => (
    <Badge
      className={cn(
        'text-[11px] min-w-[64px] justify-center',
        signal === 'BUY' ? 'bg-emerald-100 text-emerald-800' :
        signal === 'SELL' ? 'bg-rose-100 text-rose-800' :
        'bg-amber-100 text-amber-800'
      )}
    >
      {signal}
    </Badge>
  )

  const statChip = (label: string, value: string | number | null | undefined, tone: 'neutral' | 'risk' | 'safe' = 'neutral') => {
    if (value === null || value === undefined) return null
    return (
      <div
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1',
          tone === 'risk' && 'border-rose-200 bg-rose-50 text-rose-700',
          tone === 'safe' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
          tone === 'neutral' && 'border-slate-200 bg-slate-50 text-slate-700'
        )}
      >
        {label}: {value}
      </div>
    )
  }

  const handleScenario = (ticker: string) => {
    router.push(`/simulation?tickers=${ticker}`)
  }

  return (
    <div className="min-h-screen">
      <Header title="Signals" subtitle="Graph, macro, and solvency intelligence in one view" />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <Card>
          <CardContent className="p-4 flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  viewMode === 'cards' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <List className="w-4 h-4" /> Cards
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2',
                  viewMode === 'graph' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <GitBranch className="w-4 h-4" /> Graph
              </button>
            </div>

            <div className="flex-1 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[220px]">
                <Input
                  placeholder="Search ticker or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="h-11 px-3 rounded-lg border border-slate-200 text-sm"
              >
                <option value="All">All tiers</option>
                <option value="SNIPER">Sniper</option>
                <option value="SCOUT">Scout</option>
              </select>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as any)}
                className="h-11 px-3 rounded-lg border border-slate-200 text-sm"
              >
                <option value="All">All directions</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
                <option value="HOLD">Hold</option>
              </select>
              <select
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="h-11 px-3 rounded-lg border border-slate-200 text-sm"
              >
                <option value={0.0}>Any confidence</option>
                <option value={0.7}>70%+</option>
                <option value={0.8}>80%+</option>
                <option value={0.9}>90%+</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Cards view */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Showing {filtered.length} signals</span>
              <Link href="/simulation" className="text-indigo-600 hover:text-indigo-800">Run multi-shock</Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading signals…
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-500">
                  No signals match your filters.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((s) => (
                  <Card key={s.ticker} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {tierBadge(s.tier)}
                          {signalBadge(s.signal)}
                        </div>
                        <div className="text-lg font-semibold text-slate-900">{s.ticker}</div>
                        <div className="text-sm text-slate-500 line-clamp-1">{s.name || '—'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className="text-xl font-semibold text-slate-900">{(s.confidence * 100).toFixed(0)}%</div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.min(s.confidence * 100, 100)}%` }} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {statChip('PD', s.mertonPd !== null && s.mertonPd !== undefined ? `${s.mertonPd.toFixed(1)}%` : null, 'risk')}
                        {statChip('Z', s.altmanZ, s.altmanZ !== null && s.altmanZ !== undefined && s.altmanZ < 1.8 ? 'risk' : 'neutral')}
                        {statChip('Drawdown', s.drawdown !== null ? `${s.drawdown.toFixed(1)}%` : null, s.drawdown !== null && s.drawdown < -15 ? 'risk' : 'neutral')}
                        {statChip('Centrality', s.centrality !== null && s.centrality !== undefined ? `${(s.centrality * 100).toFixed(0)}%` : null, 'neutral')}
                        {statChip('Solvency', s.solvency !== null && s.solvency !== undefined ? `${s.solvency}m` : null, s.solvency !== null && s.solvency < 12 ? 'risk' : 'neutral')}
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Network className="w-4 h-4 text-indigo-600" />↑{s.upstreamCount ?? '-'} ↓{s.downstreamCount ?? '-'}
                          </span>
                          {s.lastUpdated && <span className="text-xs text-slate-400">Updated {new Date(s.lastUpdated).toLocaleDateString()}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedTicker(s.ticker); setViewMode('graph') }}>
                            <GitBranch className="w-4 h-4 mr-1" /> Graph
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleScenario(s.ticker)}>
                            <Zap className="w-4 h-4 mr-1" /> Shock
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Graph view */}
        {viewMode === 'graph' && (
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-600" />
                  Supply graph
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Click nodes to explore suppliers/customers. Switch back to cards for the “why” strips.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Jump to ticker…"
                  value={selectedTicker || ''}
                  onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                  className="w-40"
                />
                <Button variant="outline" size="sm" onClick={() => setViewMode('cards')}>
                  <List className="w-4 h-4 mr-1" /> Cards
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {graphLoading ? (
                <div className="h-[600px] flex items-center justify-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading graph…
                </div>
              ) : !graph || (!graph.suppliers.length && !graph.customers.length) ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-slate-500">
                  <GitBranch className="w-10 h-10 text-slate-300 mb-3" />
                  No graph data for {selectedTicker || 'this ticker'} yet.
                </div>
              ) : (
                <SupplyChainGraph
                  centerTicker={graph.centerTicker}
                  centerName={graph.centerName}
                  suppliers={graph.suppliers}
                  customers={graph.customers}
                  onNodeClick={(node) => node.ticker && setSelectedTicker(node.ticker)}
                  className="h-[640px]"
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
