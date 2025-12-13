'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SupplyChainGraph } from '@/components/features/supply-chain-graph'
import {
  TrendingUp,
  TrendingDown,
  Star,
  Bell,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Shield,
  Network,
  Zap,
  ChevronRight,
  Building2,
  Maximize2,
  X,
  Loader2,
} from 'lucide-react'

interface StockData {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  peRatio: number
  signal: 'buy' | 'hold' | 'sell'
  signalConfidence: number
  solvency: {
    months: number
    cash: number
    debt: number
    burnRate: number
  }
  centrality: number
  sector: string
  industry: string
  description: string
}

interface SupplyChainNode {
  id: string
  ticker: string
  name: string
  type: 'supplier' | 'customer'
  relation: string
  confidence: number
}

interface WhisperAlert {
  id: string
  sourceTicker: string
  type: string
  severity: 'high' | 'medium' | 'low'
  summary: string
  time: string
  filingType: string
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

export default function StockPage() {
  const params = useParams()
  const router = useRouter()
  const ticker = (params.ticker as string)?.toUpperCase() || ''

  const [stock, setStock] = useState<StockData | null>(null)
  const [supplyChain, setSupplyChain] = useState<{ suppliers: SupplyChainNode[]; customers: SupplyChainNode[] }>({ suppliers: [], customers: [] })
  const [whispers, setWhispers] = useState<WhisperAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'whispers'>('overview')
  const [graphFullscreen, setGraphFullscreen] = useState(false)

  useEffect(() => {
    if (!ticker) return

    async function fetchStockData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch supply chain data from the backend
        const supplyChainRes = await fetch(`/api/supply-chain/${ticker}`)

        if (supplyChainRes.ok) {
          const scData = await supplyChainRes.json()

          // Set stock data from API response
          setStock({
            ticker: ticker,
            name: scData.name || `${ticker} Inc.`,
            price: scData.price || 0,
            change: scData.change || 0,
            changePercent: scData.changePercent || 0,
            marketCap: scData.marketCap || 0,
            peRatio: scData.peRatio || 0,
            signal: scData.signal || 'hold',
            signalConfidence: scData.signalConfidence || 0.5,
            solvency: scData.solvency || { months: 0, cash: 0, debt: 0, burnRate: 0 },
            centrality: scData.centrality || 0,
            sector: scData.sector || 'Unknown',
            industry: scData.industry || 'Unknown',
            description: scData.description || '',
          })

          // Set supply chain data
          setSupplyChain({
            suppliers: (scData.suppliers || []).map((s: any, idx: number) => ({
              id: s.id || `supplier-${idx}`,
              ticker: s.ticker,
              name: s.name,
              type: 'supplier' as const,
              relation: s.relation || 'Supplier',
              confidence: s.confidence || 0.8,
            })),
            customers: (scData.customers || []).map((c: any, idx: number) => ({
              id: c.id || `customer-${idx}`,
              ticker: c.ticker,
              name: c.name,
              type: 'customer' as const,
              relation: c.relation || 'Customer',
              confidence: c.confidence || 0.8,
            })),
          })
        } else {
          // If API fails, create minimal stock data with the ticker
          setStock({
            ticker: ticker,
            name: `${ticker}`,
            price: 0,
            change: 0,
            changePercent: 0,
            marketCap: 0,
            peRatio: 0,
            signal: 'hold',
            signalConfidence: 0.5,
            solvency: { months: 0, cash: 0, debt: 0, burnRate: 0 },
            centrality: 0,
            sector: 'Unknown',
            industry: 'Unknown',
            description: '',
          })
          setSupplyChain({ suppliers: [], customers: [] })
        }

        // Fetch whisper alerts for this ticker
        const whispersRes = await fetch(`/api/whispers?ticker=${ticker}&limit=5`)
        if (whispersRes.ok) {
          const whispersData = await whispersRes.json()
          setWhispers(whispersData.map((w: any) => ({
            id: w.id,
            sourceTicker: w.sourceTicker,
            type: w.type || 'info',
            severity: w.severity || 'low',
            summary: w.summary || w.title,
            time: w.timestamp ? getRelativeTime(w.timestamp) : 'Recently',
            filingType: w.filingType || '8-K',
          })))
        }
      } catch (err) {
        console.error('Error fetching stock data:', err)
        setError('Failed to load stock data')
        // Still set minimal data so page renders
        setStock({
          ticker: ticker,
          name: ticker,
          price: 0,
          change: 0,
          changePercent: 0,
          marketCap: 0,
          peRatio: 0,
          signal: 'hold',
          signalConfidence: 0.5,
          solvency: { months: 0, cash: 0, debt: 0, burnRate: 0 },
          centrality: 0,
          sector: 'Unknown',
          industry: 'Unknown',
          description: '',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [ticker])

  const handleNodeClick = (node: any) => {
    if (node.ticker && node.ticker !== ticker) {
      router.push(`/stock/${node.ticker}`)
    }
  }

  function getRelativeTime(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-secondary">Loading {ticker} data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-primary mb-2">Stock Not Found</h2>
            <p className="text-secondary mb-4">Could not find data for {ticker}</p>
            <Button onClick={() => router.push('/market')}>
              Back to Market
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="p-6 space-y-6">
        {/* Stock Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Left - Stock Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{stock.ticker.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-primary">{stock.ticker}</h1>
                    <Badge
                      variant={
                        stock.signal === 'buy' ? 'success' :
                        stock.signal === 'sell' ? 'danger' : 'warning'
                      }
                      className="text-sm"
                    >
                      {stock.signal.toUpperCase()} • {Math.round(stock.signalConfidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-secondary">{stock.name}</p>
                  {stock.sector !== 'Unknown' && (
                    <p className="text-sm text-muted mt-1">{stock.sector} • {stock.industry}</p>
                  )}
                </div>
              </div>

              {/* Center - Price */}
              {stock.price > 0 && (
                <div className="text-center lg:text-right">
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    ${stock.price.toFixed(2)}
                  </p>
                  <div className={`flex items-center justify-center lg:justify-end gap-2 mt-1 ${
                    stock.changePercent >= 0 ? 'text-buy' : 'text-sell'
                  }`}>
                    {stock.changePercent >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="text-lg font-semibold tabular-nums">
                      {stock.changePercent >= 0 ? '+' : ''}${stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Right - Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Star className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button>
                  Add to Watchlist
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            {(stock.marketCap > 0 || stock.solvency.months > 0 || supplyChain.suppliers.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-200">
                {stock.marketCap > 0 && (
                  <div>
                    <p className="text-sm text-secondary">Market Cap</p>
                    <p className="text-lg font-semibold text-primary">{formatMarketCap(stock.marketCap)}</p>
                  </div>
                )}
                {stock.peRatio > 0 && (
                  <div>
                    <p className="text-sm text-secondary">P/E Ratio</p>
                    <p className="text-lg font-semibold text-primary">{stock.peRatio.toFixed(1)}</p>
                  </div>
                )}
                {stock.solvency.months > 0 && (
                  <div>
                    <p className="text-sm text-secondary flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Solvency
                    </p>
                    <p className={`text-lg font-semibold ${
                      stock.solvency.months >= 48 ? 'text-buy' :
                      stock.solvency.months >= 24 ? 'text-warning' : 'text-sell'
                    }`}>
                      {stock.solvency.months} months
                    </p>
                  </div>
                )}
                {stock.centrality > 0 && (
                  <div>
                    <p className="text-sm text-secondary flex items-center gap-1">
                      <Network className="w-3 h-3" /> Centrality
                    </p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {(stock.centrality * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
                {(supplyChain.suppliers.length > 0 || supplyChain.customers.length > 0) && (
                  <div>
                    <p className="text-sm text-secondary">Connections</p>
                    <p className="text-lg font-semibold text-primary">
                      ↑{supplyChain.suppliers.length} • ↓{supplyChain.customers.length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'graph', label: 'Supply Chain Graph' },
            { id: 'whispers', label: 'Alerts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Suppliers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  Upstream Suppliers ({supplyChain.suppliers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplyChain.suppliers.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">No supplier data available</p>
                ) : (
                  supplyChain.suppliers.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => router.push(`/stock/${node.ticker}`)}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">{node.ticker}</p>
                          <p className="text-xs text-secondary">{node.relation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted tabular-nums">
                          {Math.round(node.confidence * 100)}%
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Central Node */}
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center mb-4">
                  <span className="text-white text-2xl font-bold">{stock.ticker}</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">{stock.name}</h3>
                {stock.sector !== 'Unknown' && (
                  <p className="text-sm text-secondary mt-1">{stock.sector}</p>
                )}

                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Signal Strength</span>
                    <Badge variant={stock.signal === 'buy' ? 'success' : stock.signal === 'sell' ? 'danger' : 'warning'}>
                      {Math.round(stock.signalConfidence * 100)}%
                    </Badge>
                  </div>
                  {stock.centrality > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Network Centrality</span>
                      <span className="font-medium text-indigo-600">{(stock.centrality * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {stock.solvency.months > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Survival Runway</span>
                      <span className="font-medium text-buy">{stock.solvency.months} months</span>
                    </div>
                  )}
                </div>

                {(supplyChain.suppliers.length > 0 || supplyChain.customers.length > 0) && (
                  <Button
                    variant="outline"
                    className="w-full mt-6"
                    onClick={() => setActiveTab('graph')}
                  >
                    <Network className="w-4 h-4 mr-2" />
                    View Full Graph
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Customers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  Downstream Customers ({supplyChain.customers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplyChain.customers.length === 0 ? (
                  <p className="text-sm text-secondary text-center py-4">No customer data available</p>
                ) : (
                  supplyChain.customers.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => router.push(`/stock/${node.ticker}`)}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">{node.ticker}</p>
                          <p className="text-xs text-secondary">{node.relation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted tabular-nums">
                          {Math.round(node.confidence * 100)}%
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'graph' && (
          <>
            {/* Fullscreen Graph Modal */}
            {graphFullscreen && (
              <div className="fixed inset-0 z-50 bg-canvas">
                <div className="absolute top-4 right-4 z-10">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGraphFullscreen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <SupplyChainGraph
                  centerTicker={stock.ticker}
                  centerName={stock.name}
                  suppliers={supplyChain.suppliers}
                  customers={supplyChain.customers}
                  onNodeClick={handleNodeClick}
                  className="h-screen"
                />
              </div>
            )}

            {supplyChain.suppliers.length === 0 && supplyChain.customers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Network className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary mb-2">No Supply Chain Data</h3>
                  <p className="text-secondary">
                    Supply chain relationships for {stock.ticker} are not yet available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-indigo-600" />
                      Supply Chain Network
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGraphFullscreen(true)}
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Fullscreen
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SupplyChainGraph
                      centerTicker={stock.ticker}
                      centerName={stock.name}
                      suppliers={supplyChain.suppliers}
                      customers={supplyChain.customers}
                      onNodeClick={handleNodeClick}
                      className="h-[500px]"
                    />
                  </CardContent>
                </Card>

                {/* Graph Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-secondary">Upstream Dependency</p>
                          <p className="text-lg font-semibold text-primary">
                            {supplyChain.suppliers.length} suppliers
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-50">
                          <TrendingDown className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-secondary">Downstream Reach</p>
                          <p className="text-lg font-semibold text-primary">
                            {supplyChain.customers.length} customers
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <AlertTriangle className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm text-secondary">Critical Dependency</p>
                          <p className="text-lg font-semibold text-primary">
                            {supplyChain.suppliers.length > 0
                              ? `${supplyChain.suppliers[0].ticker} (${Math.round(supplyChain.suppliers[0].confidence * 100)}%)`
                              : 'None identified'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'whispers' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Alerts for {stock.ticker}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {whispers.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-secondary">No alerts for {stock.ticker}</p>
                  <p className="text-sm text-muted mt-1">
                    We&apos;ll notify you when news or events could impact this stock.
                  </p>
                </div>
              ) : (
                whispers.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          alert.severity === 'high' ? 'bg-sell/10' :
                          alert.severity === 'medium' ? 'bg-warning/10' : 'bg-buy/10'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            alert.severity === 'high' ? 'text-sell' :
                            alert.severity === 'medium' ? 'text-warning' : 'text-buy'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary">{alert.sourceTicker}</span>
                            <ArrowRight className="w-3 h-3 text-muted" />
                            <span className="font-medium text-indigo-600">{stock.ticker}</span>
                            <Badge variant="secondary" className="text-xs">
                              {alert.filingType}
                            </Badge>
                          </div>
                          <p className="text-sm text-secondary mt-1">{alert.summary}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted whitespace-nowrap">{alert.time}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
