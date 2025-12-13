'use client'

import { useState } from 'react'
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
} from 'lucide-react'

// Mock data for NVDA
const stockData: Record<string, any> = {
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 495.22,
    change: 12.45,
    changePercent: 2.58,
    marketCap: 1.22e12,
    peRatio: 65.2,
    signal: 'buy' as const,
    signalConfidence: 0.89,
    solvency: {
      months: 48,
      cash: 18.3e9,
      debt: 9.7e9,
      burnRate: 1.2e9,
    },
    centrality: 0.92,
    sector: 'Semiconductors',
    industry: 'Graphics Processing Units',
    description: 'NVIDIA designs and manufactures graphics processing units (GPUs) and system-on-chip units.',
  },
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 185.92,
    change: 1.65,
    changePercent: 0.89,
    marketCap: 2.89e12,
    peRatio: 28.5,
    signal: 'buy' as const,
    signalConfidence: 0.85,
    solvency: { months: 72, cash: 62.5e9, debt: 111e9, burnRate: 2.1e9 },
    centrality: 0.88,
    sector: 'Consumer Electronics',
    industry: 'Consumer Electronics',
  },
}

const supplyChainData: Record<string, { suppliers: any[]; customers: any[] }> = {
  NVDA: {
    suppliers: [
      { id: 'tsm', ticker: 'TSM', name: 'Taiwan Semiconductor', relation: 'Chip Fabrication', confidence: 0.95 },
      { id: 'asml', ticker: 'ASML', name: 'ASML Holding', relation: 'Lithography', confidence: 0.88 },
      { id: 'lrcx', ticker: 'LRCX', name: 'Lam Research', relation: 'Fab Equipment', confidence: 0.82 },
      { id: 'skws', ticker: 'SWKS', name: 'Skyworks', relation: 'RF Components', confidence: 0.75 },
    ],
    customers: [
      { id: 'msft', ticker: 'MSFT', name: 'Microsoft', relation: 'Azure Cloud', confidence: 0.92 },
      { id: 'meta', ticker: 'META', name: 'Meta Platforms', relation: 'AI Infrastructure', confidence: 0.89 },
      { id: 'googl', ticker: 'GOOGL', name: 'Alphabet', relation: 'Data Centers', confidence: 0.87 },
      { id: 'amzn', ticker: 'AMZN', name: 'Amazon', relation: 'AWS Cloud', confidence: 0.91 },
      { id: 'tsla', ticker: 'TSLA', name: 'Tesla', relation: 'Autonomous Driving', confidence: 0.78 },
    ],
  },
  AAPL: {
    suppliers: [
      { id: 'tsm', ticker: 'TSM', name: 'Taiwan Semiconductor', relation: 'Chip Fabrication', confidence: 0.98 },
      { id: 'swks', ticker: 'SWKS', name: 'Skyworks Solutions', relation: 'RF Chips', confidence: 0.92 },
      { id: 'qcom', ticker: 'QCOM', name: 'Qualcomm', relation: 'Modems', confidence: 0.88 },
      { id: 'hon', ticker: 'HON', name: 'Honeywell', relation: 'Manufacturing', confidence: 0.72 },
    ],
    customers: [
      { id: 'bby', ticker: 'BBY', name: 'Best Buy', relation: 'Retail', confidence: 0.85 },
      { id: 'amzn', ticker: 'AMZN', name: 'Amazon', relation: 'Distribution', confidence: 0.82 },
      { id: 'vz', ticker: 'VZ', name: 'Verizon', relation: 'Carrier Sales', confidence: 0.79 },
    ],
  },
}

const whisperAlerts = [
  {
    id: 1,
    sourceTicker: 'TSM',
    type: 'capacity',
    severity: 'medium' as const,
    summary: 'Q4 capacity expansion ahead of schedule, may benefit NVDA allocation',
    time: '5h ago',
    filingType: '10-Q',
  },
  {
    id: 2,
    sourceTicker: 'MSFT',
    type: 'demand',
    severity: 'low' as const,
    summary: 'Azure AI services seeing unprecedented demand per 8-K disclosure',
    time: '1d ago',
    filingType: '8-K',
  },
  {
    id: 3,
    sourceTicker: 'ASML',
    type: 'supply',
    severity: 'high' as const,
    summary: 'Equipment delivery delays mentioned in supplier 8-K, may impact TSM',
    time: '2d ago',
    filingType: '8-K',
  },
]

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

export default function StockPage() {
  const params = useParams()
  const router = useRouter()
  const ticker = (params.ticker as string)?.toUpperCase() || 'NVDA'
  const stock = stockData[ticker] || stockData.NVDA
  const supplyChain = supplyChainData[ticker] || supplyChainData.NVDA

  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'whispers'>('overview')
  const [graphFullscreen, setGraphFullscreen] = useState(false)

  const handleNodeClick = (node: any) => {
    if (node.ticker && node.ticker !== ticker) {
      router.push(`/stock/${node.ticker}`)
    }
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
                  <p className="text-sm text-muted mt-1">{stock.sector} • {stock.industry}</p>
                </div>
              </div>

              {/* Center - Price */}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-200">
              <div>
                <p className="text-sm text-secondary">Market Cap</p>
                <p className="text-lg font-semibold text-primary">{formatMarketCap(stock.marketCap)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">P/E Ratio</p>
                <p className="text-lg font-semibold text-primary">{stock.peRatio.toFixed(1)}</p>
              </div>
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
              <div>
                <p className="text-sm text-secondary flex items-center gap-1">
                  <Network className="w-3 h-3" /> Centrality
                </p>
                <p className="text-lg font-semibold text-indigo-600">
                  {(stock.centrality * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary">Connections</p>
                <p className="text-lg font-semibold text-primary">
                  ↑{supplyChain.suppliers.length} • ↓{supplyChain.customers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'graph', label: 'Supply Chain Graph' },
            { id: 'whispers', label: 'Whisper Alerts' },
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
                {supplyChain.suppliers.map((node: any) => (
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
                ))}
              </CardContent>
            </Card>

            {/* Central Node */}
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center mb-4">
                  <span className="text-white text-2xl font-bold">{stock.ticker}</span>
                </div>
                <h3 className="text-lg font-semibold text-primary">{stock.name}</h3>
                <p className="text-sm text-secondary mt-1">{stock.sector}</p>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Signal Strength</span>
                    <Badge variant="success">{Math.round(stock.signalConfidence * 100)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Network Centrality</span>
                    <span className="font-medium text-indigo-600">{(stock.centrality * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">Survival Runway</span>
                    <span className="font-medium text-buy">{stock.solvency.months} months</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setActiveTab('graph')}
                >
                  <Network className="w-4 h-4 mr-2" />
                  View Full Graph
                </Button>
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
                {supplyChain.customers.map((node: any) => (
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
                ))}
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
                      <p className="text-lg font-semibold text-primary">TSM (98%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'whispers' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Whisper Alerts for {stock.ticker}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {whisperAlerts.map((alert) => (
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
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
