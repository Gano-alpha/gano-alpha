'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Network,
  Bell,
  Zap,
  Activity,
} from 'lucide-react'

// Mock data for demonstration
const marketPulse = {
  spyChange: 0.45,
  vixLevel: 14.2,
  marketSentiment: 'bullish' as const,
}

const topSignals = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', signal: 'buy' as const, confidence: 0.89, change: 2.3 },
  { ticker: 'TSLA', name: 'Tesla Inc', signal: 'warning' as const, confidence: 0.72, change: -1.8 },
  { ticker: 'AAPL', name: 'Apple Inc', signal: 'buy' as const, confidence: 0.85, change: 0.9 },
  { ticker: 'AMD', name: 'AMD Inc', signal: 'sell' as const, confidence: 0.78, change: -3.2 },
]

const recentWhispers = [
  {
    id: 1,
    sourceTicker: 'SWKS',
    sourceName: 'Skyworks Solutions',
    affectedTicker: 'AAPL',
    type: 'delay',
    summary: 'Production delays in RF components mentioned in 8-K filing',
    time: '2h ago',
    severity: 'high' as const,
  },
  {
    id: 2,
    sourceTicker: 'TSM',
    sourceName: 'Taiwan Semiconductor',
    affectedTicker: 'NVDA',
    type: 'capacity',
    summary: 'Q4 capacity expansion ahead of schedule per 10-Q',
    time: '5h ago',
    severity: 'medium' as const,
  },
  {
    id: 3,
    sourceTicker: 'LRCX',
    sourceName: 'Lam Research',
    affectedTicker: 'INTC',
    type: 'demand',
    summary: 'Equipment orders from Intel declining per 8-K guidance',
    time: '1d ago',
    severity: 'medium' as const,
  },
]

const portfolioExposure = [
  { sector: 'Semiconductors', exposure: 42, companies: ['NVDA', 'TSM', 'AMD'] },
  { sector: 'Cloud Services', exposure: 28, companies: ['MSFT', 'AMZN', 'GOOGL'] },
  { sector: 'Consumer Tech', exposure: 18, companies: ['AAPL', 'META'] },
  { sector: 'Other', exposure: 12, companies: ['Various'] },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Your market intelligence at a glance"
      />

      <div className="p-6 space-y-6">
        {/* Market Pulse Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">S&P 500</p>
                  <p className="text-2xl font-semibold text-primary tabular-nums">
                    {marketPulse.spyChange >= 0 ? '+' : ''}{marketPulse.spyChange}%
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${marketPulse.spyChange >= 0 ? 'bg-buy/10' : 'bg-sell/10'}`}>
                  {marketPulse.spyChange >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-buy" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-sell" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">VIX</p>
                  <p className="text-2xl font-semibold text-primary tabular-nums">
                    {marketPulse.vixLevel}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-buy/10">
                  <Activity className="w-5 h-5 text-buy" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">Low volatility</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Active Alerts</p>
                  <p className="text-2xl font-semibold text-primary tabular-nums">3</p>
                </div>
                <div className="p-2 rounded-lg bg-warning/10">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="mt-2 text-xs text-warning">2 high priority</p>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">Graph Edges</p>
                  <p className="text-2xl font-semibold text-primary tabular-nums">2,847</p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Network className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">+124 this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Signals */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Top Signals Today</CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-600">
                View all <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSignals.map((stock) => (
                  <div
                    key={stock.ticker}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-600">
                          {stock.ticker.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-primary">{stock.ticker}</p>
                        <p className="text-sm text-secondary">{stock.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium tabular-nums ${
                          stock.change >= 0 ? 'text-buy' : 'text-sell'
                        }`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change}%
                        </p>
                      </div>
                      <Badge
                        variant={
                          stock.signal === 'buy' ? 'success' :
                          stock.signal === 'sell' ? 'danger' : 'warning'
                        }
                        className="w-16 justify-center"
                      >
                        {stock.signal.toUpperCase()}
                      </Badge>
                      <div className="w-12 text-right">
                        <span className="text-sm text-secondary tabular-nums">
                          {Math.round(stock.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Whisper Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                Whisper Alerts
              </CardTitle>
              <Badge variant="danger">{recentWhispers.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWhispers.map((whisper) => (
                  <div
                    key={whisper.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{whisper.sourceTicker}</span>
                        <ArrowRight className="w-3 h-3 text-muted" />
                        <span className="font-medium text-indigo-600">{whisper.affectedTicker}</span>
                      </div>
                      <span className="text-xs text-muted">{whisper.time}</span>
                    </div>
                    <p className="text-sm text-secondary line-clamp-2">{whisper.summary}</p>
                    <div className="mt-2">
                      <Badge
                        variant={whisper.severity === 'high' ? 'danger' : 'warning'}
                        className="text-xs"
                      >
                        {whisper.severity === 'high' ? (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        ) : null}
                        {whisper.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Exposure */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Hidden Portfolio Exposure</CardTitle>
            <Button variant="ghost" size="sm" className="text-indigo-600">
              View X-Ray <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {portfolioExposure.map((sector) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">{sector.sector}</span>
                    <span className="text-sm font-semibold text-indigo-600 tabular-nums">
                      {sector.exposure}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all"
                      style={{ width: `${sector.exposure}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    {sector.companies.join(', ')}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">Concentration Warning</p>
                  <p className="text-sm text-secondary">
                    42% of your portfolio depends on TSMC through indirect supply chain exposure.
                    Consider diversification.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
