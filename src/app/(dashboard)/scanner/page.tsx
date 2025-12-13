'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Plus,
  Star,
  Network,
  Shield,
  ChevronDown,
} from 'lucide-react'

// Mock data
const scanResults = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 495.22,
    change: 2.34,
    marketCap: 1.22e12,
    signal: 'buy' as const,
    confidence: 0.89,
    solvency: 48,
    centrality: 0.92,
    sector: 'Semiconductors',
    upstreamCount: 12,
    downstreamCount: 47,
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 185.92,
    change: 0.89,
    marketCap: 2.89e12,
    signal: 'buy' as const,
    confidence: 0.85,
    solvency: 72,
    centrality: 0.88,
    sector: 'Consumer Electronics',
    upstreamCount: 34,
    downstreamCount: 8,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.50,
    change: -1.82,
    marketCap: 790e9,
    signal: 'warning' as const,
    confidence: 0.72,
    solvency: 24,
    centrality: 0.76,
    sector: 'Electric Vehicles',
    upstreamCount: 28,
    downstreamCount: 5,
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    price: 147.85,
    change: -3.21,
    marketCap: 238e9,
    signal: 'sell' as const,
    confidence: 0.78,
    solvency: 36,
    centrality: 0.71,
    sector: 'Semiconductors',
    upstreamCount: 8,
    downstreamCount: 22,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: 378.91,
    change: 1.15,
    marketCap: 2.81e12,
    signal: 'buy' as const,
    confidence: 0.82,
    solvency: 96,
    centrality: 0.85,
    sector: 'Software',
    upstreamCount: 15,
    downstreamCount: 89,
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom Inc.',
    price: 1124.50,
    change: 1.89,
    marketCap: 524e9,
    signal: 'buy' as const,
    confidence: 0.86,
    solvency: 42,
    centrality: 0.79,
    sector: 'Semiconductors',
    upstreamCount: 6,
    downstreamCount: 31,
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

const filters = [
  { label: 'Signal', options: ['All', 'Buy', 'Sell', 'Hold', 'Warning'] },
  { label: 'Solvency', options: ['All', 'High (>48mo)', 'Medium', 'Low (<12mo)'] },
  { label: 'Centrality', options: ['All', 'High', 'Medium', 'Low'] },
]

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

export default function ScannerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('All Sectors')
  const [showFilters, setShowFilters] = useState(false)

  const filteredResults = scanResults.filter((stock) => {
    const matchesSearch =
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSector =
      selectedSector === 'All Sectors' || stock.sector === selectedSector
    return matchesSearch && matchesSector
  })

  return (
    <div className="min-h-screen">
      <Header
        title="Stock Scanner"
        subtitle="Discover opportunities with supply chain intelligence"
      />

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by ticker or company name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="h-11"
                />
              </div>

              {/* Sector Dropdown */}
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
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filters.map((filter) => (
                    <div key={filter.label} className="space-y-2">
                      <label className="text-sm font-medium text-primary">
                        {filter.label}
                      </label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-surface text-sm
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {filter.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary">
            Showing <span className="font-medium text-primary">{filteredResults.length}</span> results
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
                {filteredResults.map((stock) => (
                  <tr
                    key={stock.ticker}
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
                          <p className="text-sm text-secondary">{stock.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-medium text-primary tabular-nums">
                        ${stock.price.toFixed(2)}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        stock.change >= 0 ? 'text-buy' : 'text-sell'
                      }`}>
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-medium tabular-nums">
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-secondary tabular-nums">
                        {formatMarketCap(stock.marketCap)}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          stock.signal === 'buy' ? 'success' :
                          stock.signal === 'sell' ? 'danger' : 'warning'
                        }
                        className="min-w-[60px] justify-center"
                      >
                        {stock.signal.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted mt-1 tabular-nums">
                        {Math.round(stock.confidence * 100)}%
                      </p>
                    </td>
                    <td className="p-4 text-center">
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
                    </td>
                    <td className="p-4 text-center">
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
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-secondary">
                        <span className="tabular-nums">↑{stock.upstreamCount}</span>
                        <span className="text-slate-300">|</span>
                        <span className="tabular-nums">↓{stock.downstreamCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-sm">
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
