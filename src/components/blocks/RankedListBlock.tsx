"use client";

import { useState } from "react";
import { ChevronDown, Eye, Search, Pin } from "lucide-react";

interface RankedItem {
  rank: number;
  ticker: string;
  primaryMetric: {
    label: string;
    value: string;
  };
  confidence: number;
  chips?: Array<{
    label: string;
    type: "model" | "sector" | "risk" | "event";
  }>;
}

interface RankedListBlockProps {
  items: RankedItem[];
  title?: string;
  footer?: string;
  initialVisibleCount?: number;
  onTickerClick?: (ticker: string) => void;
  onChipClick?: (chip: string) => void;
  onViewEvidence?: (ticker: string) => void;
  onDeepDive?: (ticker: string) => void;
  onPin?: (ticker: string) => void;
  className?: string;
}

const chipStyles = {
  model: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  sector: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  risk: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  event: "bg-teal/10 text-teal border-teal/20",
};

/**
 * Ranked List Block
 *
 * Purpose: Answer "what should I look at?"
 * Enforce discipline: ranked, scored, comparable.
 *
 * Design: Borderless table, tight rows, rank number emphasized
 *
 * Interactions:
 * - Hover reveals actions: "View evidence", "Deep dive", "Pin"
 * - Collapse if >10 rows, default show top 5
 *
 * Layout:
 * Rank | Ticker | Primary Metric | Confidence | Actions (on hover)
 */
export function RankedListBlock({
  items,
  title,
  footer = "Ranked by sensitivity, confidence, and data quality.",
  initialVisibleCount = 5,
  onTickerClick,
  onChipClick,
  onViewEvidence,
  onDeepDive,
  onPin,
  className = "",
}: RankedListBlockProps) {
  const [showAll, setShowAll] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const visibleItems = showAll ? items : items.slice(0, initialVisibleCount);
  const hasMore = items.length > initialVisibleCount;

  // Only show show more/less if >10 rows total
  const showToggle = items.length > 10;

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Header - optional title */}
      {title && (
        <p className="text-xs text-muted uppercase tracking-wider mb-3">{title}</p>
      )}

      {/* Borderless Table */}
      <div className="space-y-0">
        {/* Column Headers - subtle */}
        <div className="grid grid-cols-12 gap-2 px-2 py-1.5 text-[10px] text-muted uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Ticker</div>
          <div className="col-span-5">Metric</div>
          <div className="col-span-2 text-right">Conf.</div>
          <div className="col-span-2"></div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {visibleItems.map((item, i) => {
            const isHovered = hoveredRow === item.rank;
            const isLowConfidence = item.confidence < 0.3;

            return (
              <div
                key={item.rank}
                className={`group grid grid-cols-12 gap-2 px-2 py-2.5 transition-all duration-150 hover:bg-surface/50 rounded ${
                  isLowConfidence ? "opacity-60" : ""
                }`}
                style={{
                  animationDelay: `${i * 40}ms`,
                  animation: "fade-slide-in 0.2s ease-out forwards",
                  opacity: 0,
                }}
                onMouseEnter={() => setHoveredRow(item.rank)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Rank - visually dominant */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={`font-mono text-sm font-bold ${
                      item.rank === 1
                        ? "text-accent"
                        : item.rank <= 3
                        ? "text-primary"
                        : "text-muted"
                    }`}
                  >
                    {item.rank}
                  </span>
                </div>

                {/* Ticker - clickable, opens deep dive */}
                <div className="col-span-2 flex items-center">
                  <button
                    onClick={() => onTickerClick?.(item.ticker)}
                    className="font-mono text-sm text-primary font-medium hover:text-accent transition-colors"
                  >
                    {item.ticker}
                  </button>
                </div>

                {/* Primary Metric */}
                <div className="col-span-5 flex items-center">
                  <span className="font-mono text-sm text-secondary">
                    {item.primaryMetric.label}:{" "}
                    <span className="text-primary">{item.primaryMetric.value}</span>
                  </span>
                </div>

                {/* Confidence - visual bar */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.confidence >= 0.7
                          ? "bg-teal"
                          : item.confidence >= 0.4
                          ? "bg-amber-400"
                          : "bg-muted"
                      }`}
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      item.confidence >= 0.4 ? "text-teal" : "text-muted"
                    }`}
                  >
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <div
                    className={`flex gap-1 transition-opacity ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {onViewEvidence && (
                      <button
                        onClick={() => onViewEvidence(item.ticker)}
                        className="p-1 text-muted hover:text-secondary transition-colors"
                        title="View evidence"
                      >
                        <Eye size={12} />
                      </button>
                    )}
                    {onDeepDive && (
                      <button
                        onClick={() => onDeepDive(item.ticker)}
                        className="p-1 text-muted hover:text-secondary transition-colors"
                        title="Deep dive"
                      >
                        <Search size={12} />
                      </button>
                    )}
                    {onPin && (
                      <button
                        onClick={() => onPin(item.ticker)}
                        className="p-1 text-muted hover:text-secondary transition-colors"
                        title="Pin"
                      >
                        <Pin size={12} />
                      </button>
                    )}
                  </div>

                  {/* Chips when not hovered */}
                  {!isHovered && item.chips && item.chips.length > 0 && (
                    <div className="flex gap-1">
                      {item.chips.slice(0, 1).map((chip, chipIndex) => (
                        <button
                          key={chipIndex}
                          onClick={() => onChipClick?.(chip.label)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:opacity-80 ${chipStyles[chip.type]}`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Show More/Less - only if >10 items */}
      {showToggle && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 py-2 text-xs text-muted hover:text-secondary transition-colors flex items-center justify-center gap-1"
        >
          {showAll ? "Show less" : `Show ${items.length - initialVisibleCount} more`}
          <ChevronDown
            size={14}
            className={`transition-transform ${showAll ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {/* Footer */}
      {footer && (
        <div className="mt-3 pt-2 border-t border-border/50">
          <p className="text-xs text-muted">{footer}</p>
        </div>
      )}
    </div>
  );
}
