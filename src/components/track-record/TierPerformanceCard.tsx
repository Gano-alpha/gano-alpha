'use client';

import { cn } from '@/lib/utils';
import type { TierSummary } from '@/lib/api';
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react';

interface TierPerformanceCardProps {
  tier: TierSummary;
  className?: string;
}

const TIER_CONFIG: Record<string, {
  color: string;
  bg: string;
  border: string;
  description: string;
}> = {
  ENTER: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'High conviction buy signals',
  },
  WATCH: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'Quality stocks awaiting timing',
  },
  AVOID: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    description: 'Value traps - statistically weak',
  },
};

const DEFAULT_TIER_CONFIG = {
  color: 'text-slate-600',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  description: 'Signal tier',
};

export function TierPerformanceCard({ tier, className }: TierPerformanceCardProps) {
  const config = TIER_CONFIG[tier.signal_tier] || DEFAULT_TIER_CONFIG;

  const getReturnColor = (value: number | null) => {
    if (value === null) return 'text-slate-500';
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const formatReturn = (value: number | null) => {
    if (value === null) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border overflow-hidden',
      config.border,
      className
    )}>
      {/* Header */}
      <div className={cn('px-6 py-4 border-b', config.bg, config.border)}>
        <div className="flex items-center justify-between">
          <div>
            <span className={cn('text-lg font-bold', config.color)}>{tier.signal_tier}</span>
            <p className="text-sm text-slate-500 mt-0.5">{config.description}</p>
          </div>
          <div className={cn(
            'px-3 py-1.5 rounded-full text-sm font-semibold',
            tier.win_rate !== null && tier.win_rate >= 50 ? 'bg-emerald-100 text-emerald-700' :
            tier.win_rate !== null ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
          )}>
            {tier.win_rate !== null ? `${tier.win_rate.toFixed(1)}% Win` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6">
        {/* Signal Counts */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{tier.total_signals}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{tier.winners}</p>
            <p className="text-xs text-slate-500">Winners</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{tier.losers}</p>
            <p className="text-xs text-slate-500">Losers</p>
          </div>
        </div>

        {/* Win Rate Bar */}
        {tier.completed_signals > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Win/Loss Ratio</span>
              <span className="font-medium text-slate-700">
                {tier.winners}W / {tier.losers}L
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(tier.winners / tier.completed_signals) * 100}%` }}
              />
              <div
                className="h-full bg-red-500"
                style={{ width: `${(tier.losers / tier.completed_signals) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Return Stats */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Avg Return</span>
            <span className={cn('text-sm font-semibold', getReturnColor(tier.avg_return_pct))}>
              {formatReturn(tier.avg_return_pct)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Median Return</span>
            <span className={cn('text-sm font-semibold', getReturnColor(tier.median_return_pct))}>
              {formatReturn(tier.median_return_pct)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Trophy size={14} className="text-emerald-500" />
              Best
            </div>
            <span className={cn('text-sm font-semibold', getReturnColor(tier.best_return_pct))}>
              {formatReturn(tier.best_return_pct)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <AlertTriangle size={14} className="text-red-500" />
              Worst
            </div>
            <span className={cn('text-sm font-semibold', getReturnColor(tier.worst_return_pct))}>
              {formatReturn(tier.worst_return_pct)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
