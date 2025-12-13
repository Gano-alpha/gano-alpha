// Core Types for Gano Alpha

export type Signal = 'buy' | 'sell' | 'hold' | 'warning'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Stock {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  sector: string
  industry: string
}

export interface StockSignal {
  ticker: string
  signal: Signal
  confidence: number
  reason: string
  timestamp: Date
}

export interface SupplyChainEdge {
  id: string
  sourceTicker: string
  sourceName: string
  targetTicker: string
  targetName: string
  relationshipType: 'supplier' | 'customer' | 'partner' | 'competitor'
  confidence: number
  evidence?: string
  lastUpdated: Date
}

export interface SupplyChainNode {
  id: string
  ticker: string
  name: string
  sector: string
  centrality: number
  health: number
  riskLevel: RiskLevel
  upstreamCount: number
  downstreamCount: number
}

export interface WhisperAlert {
  id: string
  sourceTicker: string
  sourceName: string
  affectedTicker: string
  affectedName: string
  alertType: 'delay' | 'shortage' | 'demand_change' | 'guidance' | 'other'
  severity: RiskLevel
  summary: string
  filingType: '8-K' | '10-K' | '10-Q'
  filingDate: Date
  extractedText: string
}

export interface SolvencyMetrics {
  ticker: string
  cashAndEquivalents: number
  totalDebt: number
  quarterlyBurnRate: number
  monthsOfRunway: number
  debtToEquity: number
  currentRatio: number
  quickRatio: number
}

export interface PortfolioPosition {
  ticker: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  value: number
  gainLoss: number
  gainLossPercent: number
  weight: number
}

export interface PortfolioExposure {
  ticker: string
  name: string
  directWeight: number
  indirectWeight: number
  totalExposure: number
  pathways: string[]
}

export interface ShockSimulationResult {
  scenario: string
  affectedNodes: {
    ticker: string
    name: string
    impact: number
    pathFromShock: string[]
  }[]
  portfolioImpact: {
    totalLoss: number
    lossPercent: number
    worstHit: string
  }
}

export interface WatchlistItem {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  signal?: Signal
  signalConfidence?: number
  alertCount: number
  addedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
}

export interface SearchResult {
  type: 'stock' | 'sector' | 'theme'
  ticker?: string
  name: string
  description?: string
  matchScore: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
