'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Eye,
  Globe2,
  Activity,
  Shield,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Bell,
  BellOff,
  Trash2,
  Search,
} from 'lucide-react'

type Direction = 'BUY' | 'SELL' | 'HOLD'

type Posture = {
  geo: 'High' | 'Moderate' | 'Low'
  macro: 'High' | 'Moderate' | 'Low'
  reg: 'High' | 'Moderate' | 'Low'
}

interface WatchItem {
  ticker: string
  name: string
  price: number
  change: number
  signal: Direction
  confidence: number
  tier: 'SNIPER' | 'SCOUT'
  posture: Posture
  macroBadge?: string
  regionBadge?: string
  regBadge?: string
  alertsEnabled?: boolean
}

const mockWatchlist: WatchItem[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    price: 138.25,
    change: -2.1,
    signal: 'SELL',
    confidence: 0.96,
    tier: 'SNIPER',
    posture: { geo: 'High', macro: 'High', reg: 'Moderate' },
    macroBadge: 'Rates',
    regionBadge: 'TW supply',
    regBadge: 'Export Ctrl',
    alertsEnabled: true,
  },
  {
    ticker: 'AAPL',
    name: 'Apple',
    price: 212.4,
    change: 1.8,
    signal: 'BUY',
    confidence: 0.91,
    tier: 'SCOUT',
    posture: { geo: 'High', macro: 'Moderate', reg: 'Low' },
    macroBadge: 'Dollar',
    regionBadge: 'CN demand',
    regBadge: 'Export Ctrl',
    alertsEnabled: true,
  },
  {
    ticker: 'TSM',
    name: 'TSMC',
    price: 128.7,
    change: -0.6,
    signal: 'SELL',
    confidence: 0.89,
    tier: 'SCOUT',
    posture: { geo: 'High', macro: 'Moderate', reg: 'High' },
    macroBadge: 'Rates',
    regionBadge: 'TW supply',
    regBadge: 'Export Ctrl',
    alertsEnabled: false,
  },
]

export default function WatchlistPage() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<WatchItem[]>(mockWatchlist)

  const filtered = useMemo(() => {
    return items.filter((i) =>
      !search ||
      i.ticker.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [items, search])

  const postureSummary = useMemo(() => {
    const geoHigh = items.filter((i) => i.posture.geo === 'High').length
    const macroHigh = items.filter((i) => i.posture.macro === 'High').length
    const regHigh = items.filter((i) => i.posture.reg === 'High').length
    return { geoHigh, macroHigh, regHigh }
  }, [items])

  const toggleAlerts = (ticker: string) => {
    setItems((prev) => prev.map((i) => (i.ticker === ticker ? { ...i, alertsEnabled: !i.alertsEnabled } : i)))
  }

  const removeItem = (ticker: string) => {
    setItems((prev) => prev.filter((i) => i.ticker !== ticker))
  }

  const signalBadge = (dir: Direction) => (
    <Badge
      className={cn(
        'min-w-[64px] justify-center text-[11px]',
        dir === 'BUY' ? 'bg-emerald-100 text-emerald-800' :
        dir === 'SELL' ? 'bg-rose-100 text-rose-800' :
        'bg-amber-100 text-amber-800'
      )}
    >
      {dir}
    </Badge>
  )

  const postureChip = (label: string, value: number, tone: 'geo' | 'macro' | 'reg') => {
    const toneColor = tone === 'geo' ? 'bg-blue-50 text-blue-700 border-blue-200' :
      tone === 'macro' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
      'bg-amber-50 text-amber-700 border-amber-200'
    return (
      <div className={cn('px-3 py-2 rounded-xl border flex items-center gap-2', toneColor)}>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
    )
  }

  const postureBadges = (p: Posture) => (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant={p.geo === 'High' ? 'destructive' : 'secondary'}>Geo: {p.geo}</Badge>
      <Badge variant={p.macro === 'High' ? 'outline' : 'secondary'}>Macro: {p.macro}</Badge>
      <Badge variant={p.reg === 'High' ? 'outline' : 'secondary'}>Reg: {p.reg}</Badge>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Header title="Watchlist" subtitle="Posture by geo/macro/regulation with quick shocks." />

      <div className="p-6 space-y-6">
        {/* Posture summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {postureChip('High Geo Risk', postureSummary.geoHigh, 'geo')}
          {postureChip('High Macro Sensitivity', postureSummary.macroHigh, 'macro')}
          {postureChip('Regulatory Risk', postureSummary.regHigh, 'reg')}
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search watchlist..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/simulation">
                  <Zap className="w-4 h-4 mr-1" /> Run shock on watchlist
                </Link>
              </Button>
              <Button asChild>
                <Link href="/market">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Watchlist table */}
        <Card>
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No names match.</div>
            ) : (
              filtered.map((i) => (
                <div key={i.ticker} className="p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-700">{i.ticker.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{i.ticker}</p>
                          <Badge variant="secondary">{i.tier}</Badge>
                          {signalBadge(i.signal)}
                          <Badge variant="secondary">{(i.confidence * 100).toFixed(0)}%</Badge>
                        </div>
                        <p className="text-sm text-slate-500">{i.name}</p>
                        {postureBadges(i.posture)}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap justify-end">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 tabular-nums">${i.price.toFixed(2)}</p>
                        <p className={cn('text-sm tabular-nums flex items-center justify-end gap-1', i.change >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                          {i.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {i.change >= 0 ? '+' : ''}{i.change.toFixed(2)}%
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {i.macroBadge && <Badge variant="outline">Macro: {i.macroBadge}</Badge>}
                        {i.regionBadge && <Badge variant="secondary">Region: {i.regionBadge}</Badge>}
                        {i.regBadge && <Badge variant="secondary">Reg: {i.regBadge}</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => toggleAlerts(i.ticker)}>
                          {i.alertsEnabled ? <Bell className="w-4 h-4 text-amber-600" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                        </Button>
                        <Link href={`/simulation?tickers=${i.ticker}`}>
                          <Button variant="ghost" size="icon-sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeItem(i.ticker)}>
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Tip */}
        <Card className="bg-indigo-50/70 border-indigo-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">Hidden exposure analysis</p>
              <p className="text-sm text-slate-600">Run a multi-shock on your watchlist to see who breaks first.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/simulation">
                <Zap className="w-4 h-4 mr-1" /> Run shock
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
