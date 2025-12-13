'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SupplyChainGraph } from '@/components/features/supply-chain-graph'
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Plus,
  Star,
  Network,
  Shield,
  ChevronDown,
  List,
  GitBranch,
  Maximize2,
  X,
  Loader2,
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

  // Filter states
  const [signalFilter, setSignalFilter] = useState('All')
  const [solvencyFilter, setSolvencyFilter] = useState('All')
  const [centralityFilter, setCentralityFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [graphFullscreen, setGraphFullscreen] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

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
        const res = await fetch('/api/signals?limit=50')
        if (res.ok) {
          const data = await res.json()
          // Deduplicate by ticker
          const seen = new Set<string>()
          const uniqueSignals = data.filter((s: Signal) => {
            if (seen.has(s.ticker)) return false
            seen.add(s.ticker)
            return true
          })
          // Use real data from API - no mock fallbacks
          const enhanced = uniqueSignals.map((s: Signal) => ({
            ...s,
            solvency: s.solvency ?? null,
            centrality: s.centrality ?? null,
            upstreamCount: s.upstreamCount ?? null,
            downstreamCount: s.downstreamCount ?? null,
          }))
          setSignals(enhanced)
          // Set first ticker as default for graph
          if (enhanced.length > 0 && !selectedTicker) {
            setSelectedTicker(enhanced[0].ticker)
          }
        }
      } catch (error) {
        console.error('Error fetching signals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
  }, [])

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

    return matchesSearch && matchesSignal && matchesSolvency && matchesCentrality
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
                    Filters
                  </Button>
                </>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && viewMode === 'list' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Signal Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Signal</label>
                    <select
                      value={signalFilter}
                      onChange={(e) => setSignalFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="All">All</option>
                      <option value="Buy">Buy</option>
                      <option value="Hold">Hold</option>
                      <option value="Sell">Sell</option>
                    </select>
                  </div>

                  {/* Solvency Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Solvency</label>
                    <select
                      value={solvencyFilter}
                      onChange={(e) => setSolvencyFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="All">All</option>
                      <option value="High (>48mo)">High (&gt;48mo)</option>
                      <option value="Medium">Medium (12-48mo)</option>
                      <option value="Low (<12mo)">Low (&lt;12mo)</option>
                    </select>
                  </div>

                  {/* Centrality Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary">Centrality</label>
                    <select
                      value={centralityFilter}
                      onChange={(e) => setCentralityFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="All">All</option>
                      <option value="High">High (&gt;70%)</option>
                      <option value="Medium">Medium (40-70%)</option>
                      <option value="Low">Low (&lt;40%)</option>
                    </select>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {(signalFilter !== 'All' || solvencyFilter !== 'All' || centralityFilter !== 'All') && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-secondary">Active filters:</span>
                    {signalFilter !== 'All' && (
                      <button
                        onClick={() => setSignalFilter('All')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                      >
                        Signal: {signalFilter}
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {solvencyFilter !== 'All' && (
                      <button
                        onClick={() => setSolvencyFilter('All')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                      >
                        Solvency: {solvencyFilter}
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {centralityFilter !== 'All' && (
                      <button
                        onClick={() => setCentralityFilter('All')}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
                      >
                        Centrality: {centralityFilter}
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSignalFilter('All')
                        setSolvencyFilter('All')
                        setCentralityFilter('All')
                      }}
                      className="text-xs text-secondary hover:text-primary underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Sort by:</span>
                <select className="text-sm font-medium text-primary bg-transparent focus:outline-none cursor-pointer">
                  <option>Signal Confidence</option>
                  <option>Market Cap</option>
                  <option>Centrality</option>
                  <option>Solvency</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="text-right p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Price
                      </th>
                      <th className="text-right p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Change
                      </th>
                      <th className="text-right p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Market Cap
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Signal
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="w-3 h-3" />
                          Solvency
                        </div>
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <Network className="w-3 h-3" />
                          Centrality
                        </div>
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Connections
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-secondary">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading...
                        </td>
                      </tr>
                    ) : filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-secondary">
                          No opportunities found
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((stock) => (
                        <tr
                          key={stock.ticker}
                          onClick={() => handleRowClick(stock.ticker)}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <span className="text-sm font-semibold text-slate-600">
                                  {stock.ticker.slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-primary">{stock.ticker}</p>
                                <p className="text-sm text-secondary truncate max-w-[150px]">{stock.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <p className="font-medium text-primary tabular-nums">
                              ${stock.price?.toFixed(2) || '-'}
                            </p>
                          </td>
                          <td className="p-4 text-right">
                            {stock.priceChange !== null && stock.priceChange !== undefined ? (
                              <div className={`flex items-center justify-end gap-1 ${
                                stock.priceChange >= 0 ? 'text-buy' : 'text-sell'
                              }`}>
                                {stock.priceChange >= 0 ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : (
                                  <TrendingDown className="w-4 h-4" />
                                )}
                                <span className="font-medium tabular-nums">
                                  {stock.priceChange >= 0 ? '+' : ''}{stock.priceChange.toFixed(2)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <p className="text-secondary tabular-nums">
                              {stock.marketCap ? formatMarketCap(stock.marketCap) : '-'}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={
                                stock.signal === 'BUY' ? 'success' :
                                stock.signal === 'SELL' ? 'danger' : 'warning'
                              }
                              className="min-w-[60px] justify-center"
                            >
                              {stock.signal}
                            </Badge>
                            <p className="text-xs text-muted mt-1 tabular-nums">
                              {Math.round(stock.confidence * 100)}%
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            {stock.solvency !== null && stock.solvency !== undefined ? (
                              <div className="flex flex-col items-center">
                                <span className={`text-sm font-medium tabular-nums ${
                                  stock.solvency >= 48 ? 'text-buy' :
                                  stock.solvency >= 24 ? 'text-warning' : 'text-sell'
                                }`}>
                                  {stock.solvency}mo
                                </span>
                                <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-1">
                                  <div
                                    className={`h-full rounded-full ${
                                      stock.solvency >= 48 ? 'bg-buy' :
                                      stock.solvency >= 24 ? 'bg-warning' : 'bg-sell'
                                    }`}
                                    style={{ width: `${Math.min(stock.solvency / 96 * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {stock.centrality !== null && stock.centrality !== undefined ? (
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-medium text-indigo-600 tabular-nums">
                                  {(stock.centrality * 100).toFixed(0)}%
                                </span>
                                <div className="w-12 h-1.5 bg-slate-100 rounded-full mt-1">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${stock.centrality * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {stock.upstreamCount !== null || stock.downstreamCount !== null ? (
                              <div className="flex items-center justify-center gap-2 text-sm text-secondary">
                                <span className="tabular-nums">↑{stock.upstreamCount ?? '-'}</span>
                                <span className="text-slate-300">|</span>
                                <span className="tabular-nums">↓{stock.downstreamCount ?? '-'}</span>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm">
                                <Star className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon-sm">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
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
