'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Trash2,
  Bell,
  BellOff,
  MoreVertical,
  AlertTriangle,
  ExternalLink,
  PieChart,
  Shield,
  Network,
} from 'lucide-react'

// Mock watchlist data
const watchlistItems = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 495.22,
    change: 2.58,
    signal: 'buy' as const,
    signalConfidence: 0.89,
    alertsEnabled: true,
    pendingAlerts: 2,
    addedAt: '2024-01-15',
    notes: 'Key AI play, watching TSM capacity',
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 185.92,
    change: 0.89,
    signal: 'buy' as const,
    signalConfidence: 0.85,
    alertsEnabled: true,
    pendingAlerts: 1,
    addedAt: '2024-01-10',
    notes: 'Supplier delays from SWKS',
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.50,
    change: -1.82,
    signal: 'warning' as const,
    signalConfidence: 0.72,
    alertsEnabled: false,
    pendingAlerts: 0,
    addedAt: '2024-01-20',
    notes: '',
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    price: 147.85,
    change: -3.21,
    signal: 'sell' as const,
    signalConfidence: 0.78,
    alertsEnabled: true,
    pendingAlerts: 0,
    addedAt: '2024-01-12',
    notes: 'Competition heating up',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: 378.91,
    change: 1.15,
    signal: 'buy' as const,
    signalConfidence: 0.82,
    alertsEnabled: true,
    pendingAlerts: 0,
    addedAt: '2024-01-08',
    notes: 'Azure growth strong',
  },
]

// Portfolio exposure analysis
const portfolioExposure = {
  totalValue: 125840,
  dayChange: 1847,
  dayChangePercent: 1.49,
  topExposures: [
    { name: 'Taiwan Semiconductor', ticker: 'TSM', exposure: 42, risk: 'high' as const },
    { name: 'China Supply Chain', ticker: null, exposure: 28, risk: 'medium' as const },
    { name: 'Energy Costs', ticker: null, exposure: 15, risk: 'low' as const },
  ],
  sectorBreakdown: [
    { sector: 'Semiconductors', weight: 45 },
    { sector: 'Software', weight: 25 },
    { sector: 'Consumer Electronics', weight: 18 },
    { sector: 'Electric Vehicles', weight: 12 },
  ],
}

export default function WatchlistPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredItems = watchlistItems.filter(
    (item) =>
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAlerts = watchlistItems.reduce((sum, item) => sum + item.pendingAlerts, 0)

  return (
    <div className="min-h-screen">
      <Header
        title="Watchlist"
        subtitle="Track your positions and get supply chain alerts"
      />

      <div className="p-6 space-y-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Portfolio Value</p>
              <p className="text-2xl font-semibold text-primary mt-1 tabular-nums">
                ${portfolioExposure.totalValue.toLocaleString()}
              </p>
              <div className={`flex items-center gap-1 mt-2 ${
                portfolioExposure.dayChangePercent >= 0 ? 'text-buy' : 'text-sell'
              }`}>
                {portfolioExposure.dayChangePercent >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium tabular-nums">
                  {portfolioExposure.dayChangePercent >= 0 ? '+' : ''}
                  ${portfolioExposure.dayChange.toLocaleString()} ({portfolioExposure.dayChangePercent}%)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Stocks Tracked</p>
              <p className="text-2xl font-semibold text-primary mt-1">{watchlistItems.length}</p>
              <p className="text-sm text-muted mt-2">Across {portfolioExposure.sectorBreakdown.length} sectors</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Active Alerts</p>
              <p className="text-2xl font-semibold text-warning mt-1">{totalAlerts}</p>
              <p className="text-sm text-muted mt-2">From supply chain whispers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Top Risk Exposure</p>
              <p className="text-2xl font-semibold text-sell mt-1">
                {portfolioExposure.topExposures[0].exposure}%
              </p>
              <p className="text-sm text-muted mt-2">{portfolioExposure.topExposures[0].name}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Watchlist Table */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Actions */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>

            {/* Watchlist Items */}
            <Card>
              <div className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <div
                    key={item.ticker}
                    className="p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-600">
                            {item.ticker.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-primary">{item.ticker}</p>
                            {item.pendingAlerts > 0 && (
                              <Badge variant="danger" className="text-xs">
                                {item.pendingAlerts} alert{item.pendingAlerts > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-secondary">{item.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Price */}
                        <div className="text-right">
                          <p className="font-semibold text-primary tabular-nums">
                            ${item.price.toFixed(2)}
                          </p>
                          <p className={`text-sm tabular-nums ${
                            item.change >= 0 ? 'text-buy' : 'text-sell'
                          }`}>
                            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                          </p>
                        </div>

                        {/* Signal */}
                        <div className="w-20 text-center">
                          <Badge
                            variant={
                              item.signal === 'buy' ? 'success' :
                              item.signal === 'sell' ? 'danger' : 'warning'
                            }
                            className="w-full justify-center"
                          >
                            {item.signal.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted mt-1 tabular-nums">
                            {Math.round(item.signalConfidence * 100)}%
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className={item.alertsEnabled ? 'text-warning' : 'text-muted'}
                          >
                            {item.alertsEnabled ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-muted hover:text-sell">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <p className="mt-3 ml-16 text-sm text-secondary bg-slate-50 rounded-lg px-3 py-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Portfolio X-Ray Sidebar */}
          <div className="space-y-4">
            {/* Sector Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  Sector Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolioExposure.sectorBreakdown.map((sector) => (
                  <div key={sector.sector} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">{sector.sector}</span>
                      <span className="font-medium text-primary tabular-nums">{sector.weight}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full"
                        style={{ width: `${sector.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Hidden Exposures */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Hidden Exposures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolioExposure.topExposures.map((exposure, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      exposure.risk === 'high' ? 'border-sell/20 bg-sell/5' :
                      exposure.risk === 'medium' ? 'border-warning/20 bg-warning/5' :
                      'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary text-sm">{exposure.name}</p>
                        {exposure.ticker && (
                          <p className="text-xs text-muted">{exposure.ticker}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold tabular-nums ${
                          exposure.risk === 'high' ? 'text-sell' :
                          exposure.risk === 'medium' ? 'text-warning' : 'text-secondary'
                        }`}>
                          {exposure.exposure}%
                        </p>
                        <Badge
                          variant={
                            exposure.risk === 'high' ? 'danger' :
                            exposure.risk === 'medium' ? 'warning' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {exposure.risk}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full mt-2" size="sm">
                  View Full X-Ray Report
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Run Stress Test
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Network className="w-4 h-4 mr-2" />
                  View Supply Chain Map
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Configure Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
