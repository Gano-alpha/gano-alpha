'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SignalCard } from '@/components/features/signal-card'
import { SupplyChainGraph } from '@/components/features/supply-chain-graph'
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  List,
  GitBranch,
  Maximize2,
  X,
  Loader2,
  Calendar,
} from 'lucide-react'

interface Signal {
  ticker: string
  name: string
  signal: 'BUY' | 'HOLD' | 'SELL'
  confidence: number
  whisperScore: number
  supplyChainRisk: number
  lastUpdated: string
  solvency?: number
  centrality?: number
  price?: number | null
  priceChange?: number | null
  marketCap?: number | null
  upstreamCount?: number
  downstreamCount?: number
  tier?: 'SNIPER' | 'SCOUT' | string
  mertonPd?: number | null
  altmanZ?: number | null
  sharpe?: number | null
  drawdown?: number | null
  miniGraph?: {
    suppliers: { ticker: string; confidence?: number }[]
    customers: { ticker: string; confidence?: number }[]
  }
}

interface SearchResult {
  ticker: string
  name: string
  signal?: 'BUY' | 'HOLD' | 'SELL'
  change?: number
}

interface SupplyChainNode {
  id: string
  ticker: string
  name: string
  type: 'supplier' | 'customer'
  relation: string
  confidence: number
}

interface GraphData {
  centerTicker: string
  centerName: string
  suppliers: SupplyChainNode[]
  customers: SupplyChainNode[]
}

const mockSignals: Signal[] = [
  {
    ticker: 'ACME',
    name: 'Acme Corp',
    signal: 'SELL',
    confidence: 0.965,
    whisperScore: 0,
    supplyChainRisk: 0,
    lastUpdated: new Date().toISOString(),
    solvency: 0.35,
    centrality: 0.82,
    upstreamCount: 5,
    downstreamCount: 3,
    tier: 'SNIPER',
    mertonPd: 14.2,
    altmanZ: 1.5,
    sharpe: -0.4,
    drawdown: -18.4,
  },
  {
    ticker: 'BETA',
    name: 'Beta Industries',
    signal: 'BUY',
    confidence: 0.912,
    whisperScore: 0,
    supplyChainRisk: 0,
    lastUpdated: new Date().toISOString(),
    solvency: 0.72,
    centrality: 0.41,
    upstreamCount: 2,
    downstreamCount: 6,
    tier: 'SCOUT',
    mertonPd: 5.8,
    altmanZ: 3.2,
    sharpe: 0.8,
    drawdown: -12.0,
  },
  {
    ticker: 'GNNX',
    name: 'GNN Explorers',
    signal: 'SELL',
    confidence: 0.955,
    whisperScore: 0,
    supplyChainRisk: 0,
    lastUpdated: new Date().toISOString(),
    solvency: 0.28,
    centrality: 0.91,
    upstreamCount: 8,
    downstreamCount: 4,
    tier: 'SNIPER',
    mertonPd: 18.7,
    altmanZ: 1.1,
    sharpe: -0.6,
    drawdown: -22.5,
  },
  {
    ticker: 'RISK',
    name: 'Risk Metrics Inc',
    signal: 'BUY',
    confidence: 0.905,
    whisperScore: 0,
    supplyChainRisk: 0,
    lastUpdated: new Date().toISOString(),
    solvency: 0.65,
    centrality: 0.55,
    upstreamCount: 3,
    downstreamCount: 3,
    tier: 'SCOUT',
    mertonPd: 7.4,
    altmanZ: 2.9,
    sharpe: 0.5,
    drawdown: -10.5,
  },
]

const sectors = [
  'All Sectors',
  'Semiconductors',
  'Software',
  'Consumer Electronics',
  'Electric Vehicles',
  'Cloud Computing',
  'Biotechnology',
]

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

export default function MarketPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('All Sectors')
  const [showFilters, setShowFilters] = useState(false)
  const [signals, setSignals] = useState<Signal[]>([])
  const [tierFilter, setTierFilter] = useState<'All' | 'SNIPER' | 'SCOUT'>('SNIPER')
  const [asOfDate, setAsOfDate] = useState<string>('')

  // Filter states
  const [signalFilter, setSignalFilter] = useState('All')
  const [solvencyFilter, setSolvencyFilter] = useState('All')
  const [centralityFilter, setCentralityFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [graphFullscreen, setGraphFullscreen] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [miniGraphCache, setMiniGraphCache] = useState<Record<string, { suppliers: any[]; customers: any[] }>>({})

  // Search autocomplete state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Graph data state
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [graphLoading, setGraphLoading] = useState(false)

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch signals on mount
  useEffect(() => {
    async function fetchSignals() {
      try {
        const params = new URLSearchParams()
        params.set('limit', '50')
        if (tierFilter !== 'All') params.set('tier', tierFilter)
        if (asOfDate) params.set('date', asOfDate)

        const res = await fetch(`/api/signals?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          // Deduplicate by ticker
          const seen = new Set<string>()
          const uniqueSignals = data.filter((s: Signal) => {
            if (seen.has(s.ticker)) return false
            seen.add(s.ticker)
            return true
          })
          // Use real data from API - fallback to mock only if empty
          const enhanced = uniqueSignals.map((s: Signal) => ({
            ...s,
            solvency: s.solvency ?? null,
            centrality: s.centrality ?? null,
            upstreamCount: s.upstreamCount ?? null,
            downstreamCount: s.downstreamCount ?? null,
            tier: s.tier ?? 'SCOUT', // default if backend missing tier
            mertonPd: (s as any).mertonPd ?? null,
            altmanZ: (s as any).altmanZ ?? null,
            sharpe: (s as any).sharpe ?? null,
            drawdown: (s as any).drawdown ?? null,
          }))
          const finalSignals = enhanced.length > 0 ? enhanced : mockSignals
          setSignals(finalSignals)
          // Set first ticker as default for graph
          if (finalSignals.length > 0 && !selectedTicker) {
            setSelectedTicker(finalSignals[0].ticker)
          }
        }
      } catch (error) {
        console.error('Error fetching signals:', error)
        setSignals(mockSignals)
        if (!selectedTicker && mockSignals.length > 0) {
          setSelectedTicker(mockSignals[0].ticker)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
  }, [tierFilter, asOfDate])

  // Search for stocks with autocomplete
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([])
      return
    }

    const searchStocks = async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          // Deduplicate results
          const seen = new Set<string>()
          const unique = data.filter((s: SearchResult) => {
            if (seen.has(s.ticker)) return false
            seen.add(s.ticker)
            return true
          })
          setSearchResults(unique.slice(0, 8))
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchStocks, 200)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Fetch graph data when selectedTicker changes
  useEffect(() => {
    if (!selectedTicker || viewMode !== 'graph') return
    const ticker = selectedTicker // Capture for async closure

    async function fetchGraphData() {
      setGraphLoading(true)
      try {
        const res = await fetch(`/api/supply-chain/${ticker}`)
        if (res.ok) {
          const data = await res.json()
          setGraphData({
            centerTicker: ticker,
            centerName: data.name || ticker,
            suppliers: (data.suppliers || []).map((s: any, idx: number) => ({
              id: s.id || `supplier-${idx}`,
              ticker: s.ticker,
              name: s.name,
              type: 'supplier' as const,
              relation: s.relation || 'Supplier',
              confidence: s.confidence || 0.8,
            })),
            customers: (data.customers || []).map((c: any, idx: number) => ({
              id: c.id || `customer-${idx}`,
              ticker: c.ticker,
              name: c.name,
              type: 'customer' as const,
              relation: c.relation || 'Customer',
              confidence: c.confidence || 0.8,
            })),
          })
        } else {
          setGraphData({
            centerTicker: ticker,
            centerName: ticker,
            suppliers: [],
            customers: [],
          })
        }
      } catch (error) {
        console.error('Error fetching graph data:', error)
        setGraphData({
          centerTicker: ticker,
          centerName: ticker,
          suppliers: [],
          customers: [],
        })
      } finally {
        setGraphLoading(false)
      }
    }

    fetchGraphData()
  }, [selectedTicker, viewMode])

  // Prefetch mini graph for cards (limited to top N to avoid noise)
  useEffect(() => {
    const toFetch = signals
      .slice(0, 10)
      .filter((s) => !miniGraphCache[s.ticker])
      .map((s) => s.ticker)

    if (toFetch.length === 0) return

    async function loadMini() {
      const results = await Promise.all(
        toFetch.map(async (ticker) => {
          try {
            const res = await fetch(`/api/supply-chain/${ticker}?limit=3`)
            if (res.ok) {
              const data = await res.json()
              return {
                ticker,
                suppliers: data.suppliers || [],
                customers: data.customers || [],
              }
            }
          } catch (e) {
            // ignore
          }
          return { ticker, suppliers: [], customers: [] }
        })
      )

      const next: Record<string, { suppliers: any[]; customers: any[] }> = { ...miniGraphCache }
      results.forEach((entry) => {
        next[entry.ticker] = { suppliers: entry.suppliers, customers: entry.customers }
      })
      setMiniGraphCache(next)
    }

    loadMini()
  }, [signals, miniGraphCache])

  const filteredResults = signals.filter((stock) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Signal filter
    const matchesSignal =
      signalFilter === 'All' ||
      stock.signal.toUpperCase() === signalFilter.toUpperCase()

    // Solvency filter
    let matchesSolvency = true
    if (solvencyFilter !== 'All' && stock.solvency !== null && stock.solvency !== undefined) {
      if (solvencyFilter === 'High (>48mo)') {
        matchesSolvency = stock.solvency >= 48
      } else if (solvencyFilter === 'Medium') {
        matchesSolvency = stock.solvency >= 12 && stock.solvency < 48
      } else if (solvencyFilter === 'Low (<12mo)') {
        matchesSolvency = stock.solvency < 12
      }
    }

    // Centrality filter
    let matchesCentrality = true
    if (centralityFilter !== 'All' && stock.centrality !== null && stock.centrality !== undefined) {
      if (centralityFilter === 'High') {
        matchesCentrality = stock.centrality >= 0.7
      } else if (centralityFilter === 'Medium') {
        matchesCentrality = stock.centrality >= 0.4 && stock.centrality < 0.7
      } else if (centralityFilter === 'Low') {
        matchesCentrality = stock.centrality < 0.4
      }
    }

    // Note: Sector filter is not yet implemented as backend doesn't provide sector data
    // Add sector filtering when backend adds sector to signals response

    // Tier filter
    const matchesTier = tierFilter === 'All' || stock.tier?.toUpperCase() === tierFilter

    return matchesSearch && matchesSignal && matchesSolvency && matchesCentrality && matchesTier
  })

  const handleNodeClick = (node: any) => {
    if (node.ticker) {
      setSelectedTicker(node.ticker)
    }
  }

  const handleRowClick = (ticker: string) => {
    router.push(`/stock/${ticker}`)
  }

  const handleSearchSelect = (ticker: string) => {
    setShowSearchResults(false)
    setSearchQuery('')
    if (viewMode === 'graph') {
      setSelectedTicker(ticker)
    } else {
      router.push(`/stock/${ticker}`)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const exactMatch = searchResults.find(
        r => r.ticker.toUpperCase() === searchQuery.toUpperCase()
      )
      if (exactMatch) {
        handleSearchSelect(exactMatch.ticker)
      } else if (searchResults.length === 1) {
        handleSearchSelect(searchResults[0].ticker)
      } else if (searchQuery.match(/^[A-Za-z]{1,5}$/)) {
        handleSearchSelect(searchQuery.toUpperCase())
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Market"
        subtitle="Find opportunities with market intelligence"
      />

      <div className="p-6 space-y-6">
        {/* View Toggle + Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'graph'
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Graph
                </button>
              </div>

              {/* Search Input with Autocomplete */}
              <div className="flex-1 relative" ref={searchRef}>
                <Input
                  type="text"
                  placeholder="Search by ticker or company name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSearchResults(true)
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={handleSearchKeyDown}
                  icon={isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  className="h-11"
                />

                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-lg border border-slate-200 shadow-elevated overflow-hidden z-50">
                    {searchResults.length === 0 && !isSearching ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-secondary">No stocks found for &quot;{searchQuery}&quot;</p>
                        <button
                          onClick={() => handleSearchSelect(searchQuery.toUpperCase())}
                          className="mt-2 text-sm text-indigo-600 hover:underline"
                        >
                          Try viewing {searchQuery.toUpperCase()} anyway
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults.map((stock) => (
                          <button
                            key={stock.ticker}
                            onClick={() => handleSearchSelect(stock.ticker)}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                <span className="text-sm font-semibold text-slate-600">
                                  {stock.ticker.slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-primary">{stock.ticker}</p>
                                <p className="text-sm text-secondary truncate max-w-[200px]">{stock.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {stock.signal && (
                                <Badge
                                  variant={
                                    stock.signal === 'BUY' ? 'success' :
                                    stock.signal === 'SELL' ? 'danger' : 'warning'
                                  }
                                  className="text-xs"
                                >
                                  {stock.signal}
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sector Dropdown - only show in list view */}
              {viewMode === 'list' && (
                <>
                  {/* Date (as-of) and Tier */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-secondary">Tier</label>
                      <div className="flex gap-2">
                        {(['SNIPER', 'SCOUT', 'All'] as const).map((tier) => (
                          <Button
                            key={tier}
                            size="sm"
                            variant={tierFilter === tier ? 'default' : 'outline'}
                            onClick={() => setTierFilter(tier)}
                          >
                            {tier}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-secondary flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> As of
                      </label>
                      <Input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="h-10 w-[180px]"
                      />
                      {asOfDate && (
                        <Button size="sm" variant="ghost" onClick={() => setAsOfDate('')}>
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="h-11 px-4 pr-10 rounded-lg border border-slate-200 bg-surface text-primary text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                               appearance-none cursor-pointer min-w-[180px]"
                    >
                      {sectors.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  </div>

                  {/* Filter Toggle */}
                  <Button
                    variant={showFilters ? 'default' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Refine
                  </Button>
                </>
              )}
            </div>

            {/* Context pills */}
            {viewMode === 'list' && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-secondary">
                <Badge variant="secondary" className="uppercase">
                  Tier: {tierFilter}
                </Badge>
                <Badge variant="secondary">
                  {asOfDate ? `As of ${asOfDate}` : 'Latest'}
                </Badge>
                <span className="text-muted">Refine: {showFilters ? 'On' : 'Off'}</span>
                <span className="text-muted">
                  Signals combine graph centrality, default risk (PD), and solvency (Z).
                </span>
              </div>
            )}

            {/* Refine Drawer */}
            {showFilters && viewMode === 'list' && (
              <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/60 rounded-lg p-3 space-y-3">
                <p className="text-xs text-secondary">Secondary filters (use sparingly)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Signal</label>
                    <select
                      value={signalFilter}
                      onChange={(e) => setSignalFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm"
                    >
                      <option value="All">All</option>
                      <option value="Buy">Buy</option>
                      <option value="Hold">Hold</option>
                      <option value="Sell">Sell</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Solvency</label>
                    <select
                      value={solvencyFilter}
                      onChange={(e) => setSolvencyFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm"
                    >
                      <option value="All">All</option>
                      <option value="High (>48mo)">High (&gt;48mo)</option>
                      <option value="Medium">Medium (12-48mo)</option>
                      <option value="Low (<12mo)">Low (&lt;12mo)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Centrality</label>
                    <select
                      value={centralityFilter}
                      onChange={(e) => setCentralityFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm"
                    >
                      <option value="All">All</option>
                      <option value="High">High (&gt;70%)</option>
                      <option value="Medium">Medium (40-70%)</option>
                      <option value="Low">Low (&lt;40%)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary">
                  <div className="flex gap-2">
                    <span>Tier: {tierFilter}</span>
                    {asOfDate && <span>As of: {asOfDate}</span>}
                  </div>
                  <button
                    onClick={() => {
                      setSignalFilter('All')
                      setSolvencyFilter('All')
                      setCentralityFilter('All')
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    Clear refinements
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary">
                Showing <span className="font-medium text-primary">{filteredResults.length}</span> opportunities
              </p>
            </div>

            {/* Signal Cards */}
            {loading ? (
              <Card className="p-8 text-center text-secondary">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading...
              </Card>
            ) : filteredResults.length === 0 ? (
              <Card className="p-8 text-center text-secondary">
                <p className="font-medium text-primary mb-1">No signals available</p>
                <p className="text-sm text-muted">
                  {signals.length === 0
                    ? 'No signals returned from the model.'
                    : `No signals match the current filters. Max probability: ${
                        Math.max(...signals.map((s) => s.confidence || 0)) * 100 || 0
                      }%.`}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredResults.map((stock) => (
                  <SignalCard
                    key={stock.ticker}
                    ticker={stock.ticker}
                    name={stock.name}
                    direction={stock.signal}
                    confidence={stock.confidence}
                    tier={stock.tier}
                    solvency={stock.solvency}
                    centrality={stock.centrality}
                    mertonPd={stock.mertonPd}
                    altmanZ={stock.altmanZ}
                    upstreamCount={stock.upstreamCount}
                    downstreamCount={stock.downstreamCount}
                    sharpe={stock.sharpe}
                    drawdown={stock.drawdown}
                    lastUpdated={stock.lastUpdated}
                    miniGraph={miniGraphCache[stock.ticker]}
                    onSelect={handleRowClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Graph View */}
        {viewMode === 'graph' && (
          <>
            {/* Fullscreen Graph Modal */}
            {graphFullscreen && graphData && (
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
                  centerTicker={graphData.centerTicker}
                  centerName={graphData.centerName}
                  suppliers={graphData.suppliers}
                  customers={graphData.customers}
                  onNodeClick={handleNodeClick}
                  className="h-screen"
                />
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-600" />
                    Supply Chain Network
                  </CardTitle>
                  <p className="text-sm text-secondary mt-1">
                    {selectedTicker
                      ? `Currently viewing: ${selectedTicker}. Click on any company to explore its supply chain.`
                      : 'Search for a stock above to view its supply chain.'
                    }
                  </p>
                </div>
                {graphData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGraphFullscreen(true)}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Fullscreen
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {graphLoading ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                      <p className="text-secondary">Loading supply chain data for {selectedTicker}...</p>
                    </div>
                  </div>
                ) : !graphData || (!graphData.suppliers.length && !graphData.customers.length) ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <Network className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {selectedTicker ? `No Supply Chain Data for ${selectedTicker}` : 'Select a Stock'}
                      </h3>
                      <p className="text-secondary max-w-md">
                        {selectedTicker
                          ? 'Supply chain relationships for this stock are not yet available.'
                          : 'Use the search bar above to find a stock and view its supply chain network.'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <SupplyChainGraph
                    centerTicker={graphData.centerTicker}
                    centerName={graphData.centerName}
                    suppliers={graphData.suppliers}
                    customers={graphData.customers}
                    onNodeClick={handleNodeClick}
                    className="h-[600px]"
                  />
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {graphData && (graphData.suppliers.length > 0 || graphData.customers.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{graphData.centerTicker}</p>
                    <p className="text-sm text-secondary">Center Node</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{graphData.suppliers.length}</p>
                    <p className="text-sm text-secondary">Suppliers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-teal-600">{graphData.customers.length}</p>
                    <p className="text-sm text-secondary">Customers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-warning">
                      {graphData.suppliers.length > 0 ? graphData.suppliers[0].ticker : '-'}
                    </p>
                    <p className="text-sm text-secondary">Top Supplier</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
