"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface Signal {
  ticker: string;
  model: 'OG' | 'Sniper';
  direction: 'long' | 'short';
  score: number;
  reason?: string;
}

interface Warning {
  ticker: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  detail?: string;
}

interface MacroContext {
  vix: number;
  vixChange: number;
  vixRegime: 'Low' | 'Normal' | 'Elevated' | 'Crisis';
  rate10y: number;
  rateChange: number;
  creditSpread: string;
  spyChange: number;
}

interface ContextPanelProps {
  macroContext: MacroContext;
  signals: Signal[];
  warnings: Warning[];
  modelHealth?: {
    status: 'healthy' | 'degraded' | 'stale';
    lastUpdate: string;
  };
  onRefresh?: () => void;
  onTickerClick?: (ticker: string) => void;
  isRefreshing?: boolean;
}

// =============================================================================
// Paginated Card Component
// =============================================================================

function PaginatedCard<T>({
  title,
  items,
  pageSize = 5,
  renderItem,
  emptyMessage,
  emptySubtext,
  className = "",
}: {
  title: string;
  items: T[];
  pageSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage: string;
  emptySubtext?: string;
  className?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(items.length / pageSize);
  const visibleItems = items.slice(page * pageSize, (page + 1) * pageSize);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className={`rounded-lg border border-border bg-surface/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <p className="text-xs text-muted uppercase tracking-wider">{title}</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!canPrev}
              className="p-0.5 text-muted hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] text-muted tabular-nums">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!canNext}
              className="p-0.5 text-muted hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        {items.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-secondary">{emptyMessage}</p>
            {emptySubtext && (
              <p className="text-xs text-muted mt-1">{emptySubtext}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {visibleItems.map((item, i) => renderItem(item, page * pageSize + i))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Context Panel
// =============================================================================

export function ContextPanel({
  macroContext,
  signals,
  warnings,
  modelHealth,
  onRefresh,
  onTickerClick,
  isRefreshing = false,
}: ContextPanelProps) {
  const getVixColor = (regime: string) => {
    switch (regime) {
      case 'Low': return 'text-teal';
      case 'Normal': return 'text-primary';
      case 'Elevated': return 'text-amber-400';
      case 'Crisis': return 'text-red-400';
      default: return 'text-primary';
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface/30 border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-xs text-muted uppercase tracking-wider">Context</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 text-muted hover:text-secondary disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Market Context - Always visible, compact */}
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Market</p>
          <div className="space-y-2 font-mono text-sm">
            {/* VIX */}
            <div className="flex items-center justify-between">
              <span className="text-muted">VIX</span>
              <div className="flex items-center gap-2">
                <span className="text-primary">{macroContext.vix.toFixed(1)}</span>
                <span className={`text-xs ${macroContext.vixChange >= 0 ? 'text-red-400' : 'text-teal'}`}>
                  {macroContext.vixChange >= 0 ? '+' : ''}{macroContext.vixChange.toFixed(1)}%
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${getVixColor(macroContext.vixRegime)} bg-current/10`}>
                  {macroContext.vixRegime}
                </span>
              </div>
            </div>

            {/* 10Y Rate */}
            <div className="flex items-center justify-between">
              <span className="text-muted">10Y</span>
              <div className="flex items-center gap-2">
                <span className="text-primary">{macroContext.rate10y.toFixed(2)}%</span>
                <span className={`text-xs ${macroContext.rateChange >= 0 ? 'text-red-400' : 'text-teal'}`}>
                  {macroContext.rateChange >= 0 ? '+' : ''}{macroContext.rateChange.toFixed(0)}bp
                </span>
              </div>
            </div>

            {/* Credit */}
            <div className="flex items-center justify-between">
              <span className="text-muted">Credit</span>
              <span className="text-primary">{macroContext.creditSpread}</span>
            </div>

            {/* SPY */}
            <div className="flex items-center justify-between">
              <span className="text-muted">SPY</span>
              <span className={macroContext.spyChange >= 0 ? 'text-teal' : 'text-red-400'}>
                {macroContext.spyChange >= 0 ? '+' : ''}{macroContext.spyChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Top Signals - Paginated */}
        <PaginatedCard
          title="Top Signals"
          items={signals}
          pageSize={5}
          emptyMessage="No high-conviction signals"
          emptySubtext="This is normal. We don't force trades."
          renderItem={(signal, i) => (
            <button
              key={i}
              onClick={() => onTickerClick?.(signal.ticker)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-background transition-colors"
            >
              <div className="flex items-center gap-2">
                {signal.direction === 'long' ? (
                  <TrendingUp size={12} className="text-teal" />
                ) : (
                  <TrendingDown size={12} className="text-red-400" />
                )}
                <span className="font-mono text-sm text-primary font-medium">{signal.ticker}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted">{signal.model}</span>
                <span className={`font-mono text-sm ${signal.direction === 'long' ? 'text-teal' : 'text-red-400'}`}>
                  {signal.score.toFixed(2)}
                </span>
              </div>
            </button>
          )}
        />

        {/* Risk Alerts - Paginated */}
        {warnings.length > 0 && (
          <PaginatedCard
            title="Risk Alerts"
            items={warnings}
            pageSize={5}
            emptyMessage="No active alerts"
            className="border-amber-500/30 bg-amber-500/5"
            renderItem={(warning, i) => (
              <button
                key={i}
                onClick={() => onTickerClick?.(warning.ticker)}
                className="w-full flex items-start gap-2 px-2 py-1.5 rounded hover:bg-background/50 transition-colors"
              >
                <AlertTriangle size={12} className={`mt-0.5 flex-shrink-0 ${
                  warning.severity === 'high' ? 'text-red-400' :
                  warning.severity === 'medium' ? 'text-amber-400' : 'text-muted'
                }`} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary font-medium">{warning.ticker}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${
                      warning.severity === 'high' ? 'text-red-400 bg-red-400/10' :
                      warning.severity === 'medium' ? 'text-amber-400 bg-amber-400/10' : 'text-muted bg-muted/10'
                    }`}>
                      {warning.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">{warning.type}</p>
                </div>
              </button>
            )}
          />
        )}

        {/* Model Health - Mini chip */}
        {modelHealth && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-surface/50">
            <div className="flex items-center gap-2">
              <Activity size={12} className={
                modelHealth.status === 'healthy' ? 'text-teal' :
                modelHealth.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
              } />
              <span className="text-xs text-muted">Models</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${
                modelHealth.status === 'healthy' ? 'text-teal' :
                modelHealth.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {modelHealth.status}
              </span>
              <span className="text-[10px] text-muted">{modelHealth.lastUpdate}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
