import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Shield,
  Network,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SignalCardProps {
  ticker: string
  name: string
  direction: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  tier?: 'SNIPER' | 'SCOUT' | string
  solvency?: number | null
  centrality?: number | null
  mertonPd?: number | null
  altmanZ?: number | null
  upstreamCount?: number | null
  downstreamCount?: number | null
  sharpe?: number | null
  drawdown?: number | null
  lastUpdated?: string
  price?: number | null
  priceChange?: number | null
  miniGraph?: {
    suppliers: { ticker: string; confidence?: number }[]
    customers: { ticker: string; confidence?: number }[]
  }
  onSelect?: (ticker: string) => void
}

function confidenceVariant(confidence: number) {
  if (confidence >= 0.95) return 'success'
  if (confidence >= 0.9) return 'warning'
  return 'default'
}

function tierVariant(tier?: string) {
  if (tier === 'SNIPER') return 'success'
  if (tier === 'SCOUT') return 'warning'
  return 'secondary'
}

export function SignalCard(props: SignalCardProps) {
  const [proView, setProView] = useState(false)
  const {
    ticker,
    name,
    direction,
    confidence,
    tier,
    solvency,
    centrality,
    mertonPd,
    altmanZ,
    upstreamCount,
    downstreamCount,
    sharpe,
    drawdown,
    lastUpdated,
    price,
    priceChange,
    miniGraph,
    onSelect,
  } = props

  const roundedConfidence = Math.round(confidence * 1000) / 10
  const thesis = (() => {
    if (proView) {
      const parts: string[] = []
      if (tier) parts.push(`${tier === 'SNIPER' ? 'High' : 'Medium'} conviction`)
      if (centrality !== null && centrality !== undefined) parts.push(`Hub ${Math.round(centrality * 100)}%`)
      if (mertonPd !== null && mertonPd !== undefined) parts.push(`PD ${mertonPd.toFixed(1)}%`)
      if (altmanZ !== null && altmanZ !== undefined) parts.push(`Z ${altmanZ.toFixed(1)}`)
      if (drawdown !== null && drawdown !== undefined) parts.push(`DD ${drawdown.toFixed(1)}%`)
      return parts.join(' • ') || 'Graph + solvency + PD blend'
    }
    const parts: string[] = []
    parts.push(tier === 'SNIPER' ? 'High conviction' : 'Medium conviction')
    if (centrality !== null && centrality !== undefined) {
      parts.push(centrality > 0.7 ? 'Highly connected' : 'Moderately connected')
    }
    if (mertonPd !== null && mertonPd !== undefined) {
      parts.push(`Default risk ~${mertonPd.toFixed(0)}%`)
    }
    if (altmanZ !== null && altmanZ !== undefined) {
      parts.push(
        altmanZ < 1.8
          ? 'Financial health: Weak'
          : altmanZ < 3
            ? 'Financial health: Caution'
            : 'Financial health: Solid'
      )
    }
    if (drawdown !== null && drawdown !== undefined) {
      parts.push(`Already down ${Math.abs(drawdown).toFixed(0)}%`)
    }
    return parts.join(' • ')
  })()

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(ticker)}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl font-semibold">{ticker}</span>
            <Badge variant={confidenceVariant(confidence)}>
              {direction} · {roundedConfidence}%
            </Badge>
            {tier && (
              <Badge variant={tierVariant(tier)} className="uppercase">
                {tier}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-secondary truncate max-w-xl">{name}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {lastUpdated && (
              <span>Updated: {new Date(lastUpdated).toLocaleString()}</span>
            )}
            {price !== null && price !== undefined && (
              <span className="flex items-center gap-1">
                {priceChange !== null && priceChange !== undefined && (
                  <Badge variant={priceChange >= 0 ? 'success' : 'danger'}>
                    {priceChange >= 0 ? '+' : ''}
                    {priceChange.toFixed(2)}%
                  </Badge>
                )}
                ${price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <Badge variant={direction === 'SELL' ? 'danger' : 'success'}>
          {direction === 'SELL' ? (
            <ArrowDownLeft className="w-3 h-3 mr-1" />
          ) : (
            <ArrowUpRight className="w-3 h-3 mr-1" />
          )}
          {direction}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-secondary">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-primary text-sm">Why this call</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setProView((v) => !v)
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              {proView ? 'Simple view' : 'Pro view'}
            </button>
          </div>
          <p className="leading-snug">{thesis || 'Graph + solvency + PD blend'}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-secondary">
              <Shield className="w-3 h-3" />
              Solvency
            </div>
            {solvency !== null && solvency !== undefined ? (
              <>
                <p className="text-sm font-semibold tabular-nums">{solvency.toFixed(2)}</p>
                <Progress value={Math.min(solvency * 10, 100)} />
              </>
            ) : (
              <p className="text-xs text-muted">N/A</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-secondary">
              <Network className="w-3 h-3" />
              Centrality
            </div>
            {centrality !== null && centrality !== undefined ? (
              <>
                <p className="text-sm font-semibold text-indigo-600 tabular-nums">
                  {(centrality * 100).toFixed(0)}%
                </p>
                <Progress value={centrality * 100} />
              </>
            ) : (
              <p className="text-xs text-muted">N/A</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-secondary">
              <AlertTriangle className="w-3 h-3" />
              Merton PD
            </div>
            {mertonPd !== null && mertonPd !== undefined ? (
              <p className="text-sm font-semibold tabular-nums">{mertonPd.toFixed(2)}%</p>
            ) : (
              <p className="text-xs text-muted">N/A</p>
            )}
            {altmanZ !== null && altmanZ !== undefined && (
              <p
                className={cn(
                  'text-xs',
                  altmanZ < 1.8 ? 'text-danger' : altmanZ < 3 ? 'text-warning' : 'text-secondary'
                )}
              >
                Altman Z: {altmanZ.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-secondary">
              <Sparkles className="w-3 h-3" />
              Network
            </div>
            {upstreamCount !== null || downstreamCount !== null ? (
              <p className="text-sm font-semibold tabular-nums">
                ↑{upstreamCount ?? '-'} / ↓{downstreamCount ?? '-'}
              </p>
            ) : (
              <p className="text-xs text-muted">N/A</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-secondary">
              {sharpe !== null && sharpe !== undefined && sharpe >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              Sharpe / Drawdown
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {sharpe !== null && sharpe !== undefined ? sharpe.toFixed(2) : 'N/A'}
            </p>
            {drawdown !== null && drawdown !== undefined && (
              <p className={cn('text-xs tabular-nums', drawdown < 0 ? 'text-sell' : 'text-secondary')}>
                {drawdown.toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect?.(ticker) }}>
            View stock
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
            Add to watchlist
          </Button>
        </div>
      </CardContent>

      {/* Compact network peek */}
      {miniGraph && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between text-xs text-secondary">
            <span className="flex items-center gap-2">
              <Network className="w-3 h-3 text-indigo-600" />
              Upstream {miniGraph.suppliers?.length ?? 0} • Downstream {miniGraph.customers?.length ?? 0}
            </span>
            <span className="text-muted">Click card to open full graph</span>
          </div>
        </div>
      )}
    </Card>
  )
}
