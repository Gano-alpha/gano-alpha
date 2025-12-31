"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

interface CompareItem {
  rank: number;
  ticker: string;
  value: string;
  confidence: number;
}

interface SplitCompareBlockProps {
  title: string;
  subtitle?: string;
  left: {
    label: string;
    description?: string;
    items: CompareItem[];
  };
  right: {
    label: string;
    description?: string;
    items: CompareItem[];
  };
  metric: string;
  onTickerClick?: (ticker: string) => void;
  className?: string;
}

/**
 * Split Compare Block
 *
 * Purpose: Show contrast, not just magnitude. Make macro intuition concrete.
 * Used for: benefit/hurt, winners/losers, long/short, in/out
 *
 * Layout:
 * LEFT (Benefit/Winners/Long) | RIGHT (Hurt/Losers/Short)
 * Symmetry matters. Same metric on both sides.
 */
export function SplitCompareBlock({
  title,
  subtitle,
  left,
  right,
  metric,
  onTickerClick,
  className = ""
}: SplitCompareBlockProps) {
  const [leftExpanded, setLeftExpanded] = useState(true);
  const [rightExpanded, setRightExpanded] = useState(true);

  const maxItems = Math.max(left.items.length, right.items.length);
  const displayCount = Math.min(5, maxItems);

  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm text-primary font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted mt-1">{subtitle}</p>
        )}
      </div>

      {/* Split View */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Left Side (Benefit/Winners/Long) */}
        <div>
          <button
            onClick={() => setLeftExpanded(!leftExpanded)}
            className="w-full px-4 py-2 bg-teal/5 border-b border-border flex items-center justify-between hover:bg-teal/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-teal" />
              <span className="text-xs font-medium text-teal">{left.label}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-teal transition-transform ${leftExpanded ? '' : '-rotate-90'}`}
            />
          </button>

          {leftExpanded && (
            <div className="divide-y divide-border">
              {left.description && (
                <p className="px-4 py-2 text-xs text-muted bg-background/30">
                  {left.description}
                </p>
              )}
              {left.items.slice(0, displayCount).map((item, i) => (
                <div
                  key={item.rank}
                  className="px-4 py-2 flex items-center justify-between hover:bg-surface/80 transition-colors"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animation: 'fade-slide-in 0.2s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-mono">{item.rank}</span>
                    <button
                      onClick={() => onTickerClick?.(item.ticker)}
                      className="font-mono text-sm text-primary font-medium hover:text-accent transition-colors"
                    >
                      {item.ticker}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-teal">{item.value}</span>
                    <span className="text-[10px] text-muted">{item.confidence.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {left.items.length > displayCount && (
                <p className="px-4 py-2 text-xs text-muted">
                  +{left.items.length - displayCount} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Side (Hurt/Losers/Short) */}
        <div>
          <button
            onClick={() => setRightExpanded(!rightExpanded)}
            className="w-full px-4 py-2 bg-red-500/5 border-b border-border flex items-center justify-between hover:bg-red-500/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-red-400" />
              <span className="text-xs font-medium text-red-400">{right.label}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-red-400 transition-transform ${rightExpanded ? '' : '-rotate-90'}`}
            />
          </button>

          {rightExpanded && (
            <div className="divide-y divide-border">
              {right.description && (
                <p className="px-4 py-2 text-xs text-muted bg-background/30">
                  {right.description}
                </p>
              )}
              {right.items.slice(0, displayCount).map((item, i) => (
                <div
                  key={item.rank}
                  className="px-4 py-2 flex items-center justify-between hover:bg-surface/80 transition-colors"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animation: 'fade-slide-in 0.2s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-mono">{item.rank}</span>
                    <button
                      onClick={() => onTickerClick?.(item.ticker)}
                      className="font-mono text-sm text-primary font-medium hover:text-accent transition-colors"
                    >
                      {item.ticker}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-red-400">{item.value}</span>
                    <span className="text-[10px] text-muted">{item.confidence.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {right.items.length > displayCount && (
                <p className="px-4 py-2 text-xs text-muted">
                  +{right.items.length - displayCount} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-background/50 border-t border-border">
        <p className="text-xs text-muted">
          Ranked by {metric}. Same methodology on both sides.
        </p>
      </div>
    </div>
  );
}
