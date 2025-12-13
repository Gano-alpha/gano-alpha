'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, Zap, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title?: string
  subtitle?: string
}

interface SearchResult {
  ticker: string
  name: string
  signal?: 'BUY' | 'HOLD' | 'SELL'
  change?: number
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search for stocks
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
          setSearchResults(data.slice(0, 8))
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

  const handleSelectStock = (ticker: string) => {
    setShowResults(false)
    setSearchQuery('')
    router.push(`/stock/${ticker}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // If exact match or single result, go to that stock
      const exactMatch = searchResults.find(
        r => r.ticker.toUpperCase() === searchQuery.toUpperCase()
      )
      if (exactMatch) {
        handleSelectStock(exactMatch.ticker)
      } else if (searchResults.length === 1) {
        handleSelectStock(searchResults[0].ticker)
      } else if (searchQuery.match(/^[A-Za-z]{1,5}$/)) {
        // If it looks like a ticker, try to navigate directly
        handleSelectStock(searchQuery.toUpperCase())
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-surface/80 backdrop-blur-sm border-b border-slate-200">
      {/* Left - Title */}
      <div>
        {title && (
          <h1 className="text-xl font-semibold text-primary">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-secondary">{subtitle}</p>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search with Autocomplete */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Input
            type="text"
            placeholder="Search stocks..."
            className="w-64 pl-10 pr-12"
            icon={isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
          />
          {!searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">K</kbd>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-lg border border-slate-200 shadow-elevated overflow-hidden z-50">
              {searchResults.length === 0 && !isSearching ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-secondary">No stocks found for &quot;{searchQuery}&quot;</p>
                  <button
                    onClick={() => handleSelectStock(searchQuery.toUpperCase())}
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
                      onClick={() => handleSelectStock(stock.ticker)}
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
                          <p className="text-sm text-secondary truncate max-w-[150px]">{stock.name}</p>
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
                        {stock.change !== undefined && (
                          <span className={`text-sm font-medium ${stock.change >= 0 ? 'text-buy' : 'text-sell'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Search Button */}
        <Button variant="ghost" size="icon-sm" className="md:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* War Room Button */}
        <Link href="/simulation">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 border-warning/50 text-warning hover:bg-warning/10 hover:text-warning">
            <Zap className="h-4 w-4" />
            Simulation
          </Button>
        </Link>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sell text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            3
          </span>
        </Button>
      </div>
    </header>
  )
}
