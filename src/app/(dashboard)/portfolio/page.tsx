'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  AlertTriangle,
  ExternalLink,
  Eye,
  Network,
  Shield,
  Zap,
  Star,
  X,
} from 'lucide-react'

interface WatchlistItem {
  ticker: string
  name: string
  price: number
  change: number
  signal: 'buy' | 'hold' | 'sell'
  signalConfidence: number
  alertsEnabled: boolean
  pendingAlerts: number
  addedAt: string
  notes: string
}

export default function WatchlistPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load watchlist from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gano_watchlist')
    if (stored) {
      try {
        const items = JSON.parse(stored)
        setWatchlistItems(items)
      } catch (e) {
        console.error('Error parsing watchlist:', e)
      }
    }
    setLoading(false)
  }, [])

  // Save watchlist to localStorage
  const saveWatchlist = (items: WatchlistItem[]) => {
    localStorage.setItem('gano_watchlist', JSON.stringify(items))
    setWatchlistItems(items)
  }

  const removeFromWatchlist = (ticker: string) => {
    const updated = watchlistItems.filter(item => item.ticker !== ticker)
    saveWatchlist(updated)
  }

  const toggleAlerts = (ticker: string) => {
    const updated = watchlistItems.map(item =>
      item.ticker === ticker ? { ...item, alertsEnabled: !item.alertsEnabled } : item
    )
    saveWatchlist(updated)
  }

  const filteredItems = watchlistItems.filter(
    (item) =>
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalAlerts = watchlistItems.reduce((sum, item) => sum + item.pendingAlerts, 0)

  // Empty State
  if (!loading && watchlistItems.length === 0) {
    return (
      <div className="min-h-screen">
        <Header
          title="Watchlist"
          subtitle="Track stocks and get supply chain alerts"
        />

        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-indigo-600" />
              </div>

              <h2 className="text-2xl font-bold text-primary mb-3">
                Start Your Watchlist
              </h2>

              <p className="text-secondary mb-6 max-w-md mx-auto">
                Add stocks to your watchlist to get personalized supply chain alerts.
                When a supplier files an 8-K or news breaks about their supply chain,
                you&apos;ll be the first to know how it affects your positions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-slate-50">
                  <Bell className="w-6 h-6 text-warning mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">Real-time Alerts</p>
                  <p className="text-xs text-secondary mt-1">
                    Get notified when supply chain events affect your stocks
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <Network className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">Hidden Exposures</p>
                  <p className="text-xs text-secondary mt-1">
                    See supplier dependencies you didn&apos;t know existed
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <Shield className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary">Risk Analysis</p>
                  <p className="text-xs text-secondary mt-1">
                    Understand your concentration risk
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/market">
                  <Button size="lg">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Market
                  </Button>
                </Link>
                <Button variant="outline" size="lg" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add by Ticker
                </Button>
              </div>

              <p className="text-xs text-muted mt-6">
                Pro tip: Click the star icon on any stock in the Market tab to add it here
              </p>
            </CardContent>
          </Card>

          {/* Suggested Stocks */}
          <Card className="max-w-2xl mx-auto mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" />
                Popular Stocks to Watch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['NVDA', 'AAPL', 'TSLA', 'MSFT'].map((ticker) => (
                  <Link
                    key={ticker}
                    href={`/stock/${ticker}`}
                    className="p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors text-center"
                  >
                    <p className="font-semibold text-primary">{ticker}</p>
                    <p className="text-xs text-indigo-600 mt-1">View →</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Watchlist"
        subtitle="Track stocks and get supply chain alerts"
      />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Stocks Tracked</p>
              <p className="text-2xl font-semibold text-primary mt-1">{watchlistItems.length}</p>
              <p className="text-sm text-muted mt-2">In your watchlist</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondary">Active Alerts</p>
              <p className="text-2xl font-semibold text-warning mt-1">{totalAlerts}</p>
              <p className="text-sm text-muted mt-2">From supply chain whispers</p>
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <p className="text-sm text-secondary">Quick Action</p>
              <Link href="/simulation" className="mt-2">
                <Button size="sm" variant="outline" className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Run Stress Test
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

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
          <Link href="/market">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </Button>
          </Link>
        </div>

        {/* Watchlist Items */}
        <Card>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-secondary">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-secondary">
                No stocks match your search
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.ticker}
                  className="p-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/stock/${item.ticker}`}
                      className="flex items-center gap-4 flex-1"
                    >
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
                    </Link>

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
                          onClick={() => toggleAlerts(item.ticker)}
                          className={item.alertsEnabled ? 'text-warning' : 'text-muted'}
                        >
                          {item.alertsEnabled ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <BellOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Link href={`/stock/${item.ticker}`}>
                          <Button variant="ghost" size="icon-sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeFromWatchlist(item.ticker)}
                          className="text-muted hover:text-sell"
                        >
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
              ))
            )}
          </div>
        </Card>

        {/* Tip Card */}
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">Hidden Exposure Analysis</p>
              <p className="text-sm text-secondary">
                Once you have 3+ stocks, we&apos;ll analyze your hidden supply chain exposures
              </p>
            </div>
            {watchlistItems.length >= 3 && (
              <Link href="/simulation">
                <Button variant="outline" size="sm">
                  View Analysis
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
