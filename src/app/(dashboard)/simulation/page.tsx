'use client'

import { useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Zap, Play, Loader2, SlidersHorizontal, Plus, X, Target, Activity, Shield, BarChart3 } from 'lucide-react'

type Domain = 'MACRO' | 'REGION' | 'REG' | 'THEME'

interface Shock {
  id: string
  label: string
  domain: Domain
  value: number // percentage / bps
  active: boolean
  description?: string
}

interface ImpactRow {
  ticker: string
  name: string
  score: number
  domainBreakdown: { domain: Domain; value: number }[]
}

const presetShocks: Shock[] = [
  { id: 'rates', label: 'Rates (^TNX)', domain: 'MACRO', value: 20, active: true, description: '+20 bps' },
  { id: 'oil', label: 'Oil (CL)', domain: 'MACRO', value: -5, active: false, description: '-5%' },
  { id: 'tw', label: 'Region: TW Supply', domain: 'REGION', value: -30, active: true, description: '-30% supply' },
  { id: 'export', label: 'Export Control', domain: 'REG', value: 1, active: true, description: 'Chips/EDA' },
]

const mockImpacts: ImpactRow[] = [
  { ticker: 'TSM', name: 'TSMC', score: 12.4, domainBreakdown: [{ domain: 'MACRO', value: 4 }, { domain: 'REGION', value: 6 }, { domain: 'REG', value: 2.4 }] },
  { ticker: 'NVDA', name: 'NVIDIA', score: 9.1, domainBreakdown: [{ domain: 'MACRO', value: 3.9 }, { domain: 'REGION', value: 3.0 }, { domain: 'REG', value: 2.2 }] },
  { ticker: 'AAPL', name: 'Apple', score: 7.3, domainBreakdown: [{ domain: 'MACRO', value: 2.5 }, { domain: 'REGION', value: 3.0 }, { domain: 'REG', value: 1.8 }] },
]

export default function SimulationPage() {
  const [scenarioText, setScenarioText] = useState('')
  const [shocks, setShocks] = useState<Shock[]>(presetShocks)
  const [impacts, setImpacts] = useState<ImpactRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  const activeShocks = useMemo(() => shocks.filter(s => s.active), [shocks])

  const toggleShock = (id: string) => {
    setShocks(prev => prev.map(s => (s.id === id ? { ...s, active: !s.active } : s)))
  }

  const updateShockValue = (id: string, value: number) => {
    setShocks(prev => prev.map(s => (s.id === id ? { ...s, value } : s)))
  }

  const runSimulation = async () => {
    setLoading(true)
    try {
      // TODO: replace with real API call to /api/simulate
      await new Promise(res => setTimeout(res, 800))
      setImpacts(mockImpacts)
    } finally {
      setLoading(false)
    }
  }

  const domainColor = (d: Domain) => {
    switch (d) {
      case 'MACRO': return 'bg-indigo-500'
      case 'REGION': return 'bg-blue-500'
      case 'REG': return 'bg-amber-500'
      case 'THEME': return 'bg-emerald-500'
      default: return 'bg-slate-400'
    }
  }

  const domainLabel = (d: Domain) => {
    switch (d) {
      case 'MACRO': return 'Macro'
      case 'REGION': return 'Region'
      case 'REG': return 'Regulation'
      case 'THEME': return 'Theme'
      default: return d
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Scenarios" subtitle="Compose shocks and see who moves." />

      <div className="p-6 space-y-6">
        {/* Scenario entry */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Zap className="w-4 h-4 text-slate-900" />
              Paste a headline or tweak shocks below.
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="TSM supply chain disruption due to Taiwan crisis"
                value={scenarioText}
                onChange={(e) => setScenarioText(e.target.value)}
                className="flex-1"
              />
              <Button onClick={runSimulation} disabled={loading} className="md:w-40">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                {loading ? 'Running' : 'Run'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shock deck */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              Shocks
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add shock
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {shocks.map((s) => (
              <div key={s.id} className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-lg border",
                s.active ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white opacity-70')}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleShock(s.id)}
                    className={cn("w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold",
                      s.active ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-400')}
                  >
                    {s.value > 0 ? '+' : ''}{s.value}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{s.label}</p>
                      <Badge variant="secondary">{domainLabel(s.domain)}</Badge>
                    </div>
                    {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    step={1}
                    value={s.value}
                    onChange={(e) => updateShockValue(s.id, Number(e.target.value))}
                    className="w-40"
                  />
                  <span className="text-sm text-slate-600 w-12 text-right">{s.value}</span>
                  <Button variant="ghost" size="icon" onClick={() => toggleShock(s.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="pb-2 flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-indigo-600" />
              Top impacted tickers
            </CardTitle>
            {loading && <Badge variant="secondary" className="text-xs">Running…</Badge>}
            {!loading && impacts && <Badge variant="outline" className="text-xs">{activeShocks.length} shocks applied</Badge>}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Calculating impact…
              </div>
            ) : !impacts ? (
              <div className="text-sm text-slate-500 py-4">
                Configure shocks and click Run to see impacted names.
              </div>
            ) : (
              <div className="space-y-3">
                {impacts.map((row) => {
                  const total = row.domainBreakdown.reduce((acc, d) => acc + d.value, 0) || 1
                  return (
                    <div key={row.ticker} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{row.ticker}</p>
                            <span className="text-sm text-slate-500">{row.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Impact score {row.score.toFixed(1)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Activity className="w-4 h-4 mr-1" /> Open graph
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Shield className="w-4 h-4 mr-1" /> Hedge ideas
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {row.domainBreakdown.map((d) => (
                          <div
                            key={d.domain}
                            className={cn(domainColor(d.domain))}
                            style={{ width: `${(d.value / total) * 100}%` }}
                            title={`${domainLabel(d.domain)}: ${d.value.toFixed(1)}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        {row.domainBreakdown.map((d) => (
                          <Badge key={d.domain} variant="secondary">
                            {domainLabel(d.domain)} {d.value.toFixed(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mini summary */}
        {impacts && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Domain contribution
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['MACRO', 'REGION', 'REG', 'THEME'] as Domain[]).map((d) => (
                <div key={d} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500">{domainLabel(d)}</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {impacts
                      .map((i) => i.domainBreakdown.find((x) => x.domain === d)?.value || 0)
                      .reduce((a, b) => a + b, 0)
                      .toFixed(1)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
