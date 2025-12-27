'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'

interface Signal {
  ticker: string
  name: string
  signal: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  hub?: number
  pd?: number
  region?: string
  macro?: string
}

const riskDrivers = [
  { label: 'Rates (^TNX)', value: '+15 bps', exposed: 450, trend: 'up' as const },
  { label: 'Oil (CL)', value: '-2.5%', exposed: 430, trend: 'down' as const },
  { label: 'Region (CN/TW)', value: 'Elevated', exposed: 450, trend: 'up' as const },
]

const mockSignals: Signal[] = [
  { ticker: 'NVDA', name: 'NVIDIA', signal: 'SELL', confidence: 0.96, hub: 0.82, pd: 0.142, region: 'TW supply', macro: 'Rates' },
  { ticker: 'AAPL', name: 'Apple', signal: 'BUY', confidence: 0.92, hub: 0.65, pd: 0.05, region: 'CN demand', macro: 'Dollar' },
  { ticker: 'TSM', name: 'TSMC', signal: 'SELL', confidence: 0.91, hub: 0.88, pd: 0.12, region: 'TW supply', macro: 'Rates' },
]

export default function HomePage() {
  const router = useRouter()
  const [signals, setSignals] = useState<Signal[]>([])
  const [scenarioText, setScenarioText] = useState('')

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals?limit=5')
        if (res.ok) {
          const data = await res.json()
          setSignals(data.length ? data : mockSignals)
        } else {
          setSignals(mockSignals)
        }
      } catch {
        setSignals(mockSignals)
      }
    }
    fetchSignals()
  }, [])

  const topSignals = signals.slice(0, 3)

  return (
    <div className="min-h-screen">
      <Header title="Brief" subtitle="Today’s risk field" />

      <div className="p-6 space-y-6">
        {/* Risk field chips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {riskDrivers.map(driver => (
            <Card key={driver.label} className="bg-surface border border-slate-200/70 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{driver.label}</span>
                  {driver.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div className="text-2xl font-semibold text-slate-900">{driver.value}</div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{driver.exposed} exposed</span>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => router.push('/simulation')}>
                    Run scenario
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top signals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Top Signals</h2>
            <Link href="/market" className="text-sm text-slate-600 hover:text-slate-900">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topSignals.map(sig => (
              <Card key={sig.ticker} className="border border-slate-200/70 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{sig.ticker}</div>
                      <div className="text-sm text-slate-500">{sig.name}</div>
                    </div>
                    <Badge variant={sig.signal === 'BUY' ? 'outline' : sig.signal === 'SELL' ? 'destructive' : 'secondary'}>
                      {sig.signal}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    Confidence <span className="font-semibold text-slate-900">{(sig.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {sig.hub !== undefined && <span>Hub {(sig.hub * 100).toFixed(0)}%</span>}
                    {sig.pd !== undefined && <span>PD {(sig.pd * 100).toFixed(1)}%</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {sig.macro && <Badge className="bg-slate-900 text-white">Macro: {sig.macro}</Badge>}
                    {sig.region && <Badge variant="secondary">Region: {sig.region}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick scenario */}
        <Card className="border border-slate-200/70 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Zap className="w-4 h-4 text-slate-900" />
              Quick scenario entry
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Paste news headline or article..."
                value={scenarioText}
                onChange={e => setScenarioText(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => router.push('/simulation')}
                className={cn('md:w-40 bg-slate-900 hover:bg-slate-800 text-white')}
              >
                Parse & Run
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
