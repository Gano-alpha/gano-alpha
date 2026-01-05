'use client';

import { cn } from '@/lib/utils';
import type { SignalOutcome } from '@/lib/api';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface SignalTableProps {
  signals: SignalOutcome[];
  className?: string;
}

const OUTCOME_CONFIG: Record<string, {
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
}> = {
  WIN: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  LOSS: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  PENDING: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const DEFAULT_OUTCOME_CONFIG = {
  icon: Clock,
  color: 'text-slate-500',
  bg: 'bg-slate-50',
};

export function SignalTable({ signals, className }: SignalTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatReturn = (value: number | null) => {
    if (value === null) return '—';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getReturnColor = (value: number | null) => {
    if (value === null) return 'text-slate-500';
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ENTER': return 'text-emerald-600 bg-emerald-50';
      case 'WATCH': return 'text-amber-600 bg-amber-50';
      case 'AVOID': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Signal History</h3>
        <p className="text-sm text-slate-500 mt-0.5">All signals - no cherry-picking</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Ticker</th>
              <th className="px-6 py-3">Tier</th>
              <th className="px-6 py-3">Direction</th>
              <th className="px-6 py-3 text-right">Entry</th>
              <th className="px-6 py-3 text-right">Exit</th>
              <th className="px-6 py-3 text-right">Return</th>
              <th className="px-6 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {signals.length > 0 ? (
              signals.map((signal, idx) => {
                const outcomeConfig = OUTCOME_CONFIG[signal.outcome] || DEFAULT_OUTCOME_CONFIG;
                const OutcomeIcon = outcomeConfig.icon;

                return (
                  <tr key={`${signal.signal_date}-${signal.ticker}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {formatDate(signal.signal_date)}
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{signal.ticker}</span>
                        {signal.company_name && (
                          <p className="text-xs text-slate-400 truncate max-w-[150px]">
                            {signal.company_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        getTierColor(signal.signal_tier)
                      )}>
                        {signal.signal_tier}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        // Map BUY/LONG/ENTER tier to green/up, AVOID/SHORT to red/down
                        ['LONG', 'BUY'].includes(signal.direction) || signal.signal_tier === 'ENTER'
                          ? 'text-emerald-600'
                          : signal.signal_tier === 'AVOID' ? 'text-red-600' : 'text-amber-600'
                      )}>
                        {['LONG', 'BUY'].includes(signal.direction) || signal.signal_tier === 'ENTER' ? (
                          <TrendingUp size={14} />
                        ) : signal.signal_tier === 'AVOID' ? (
                          <TrendingDown size={14} />
                        ) : (
                          <TrendingUp size={14} />
                        )}
                        {signal.direction}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 text-right">
                      {formatPrice(signal.entry_price)}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 text-right">
                      {formatPrice(signal.exit_price)}
                    </td>
                    <td className={cn(
                      'px-6 py-3 text-sm font-semibold text-right',
                      getReturnColor(signal.return_pct)
                    )}>
                      {formatReturn(signal.return_pct)}
                    </td>
                    <td className="px-6 py-3">
                      <div className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        outcomeConfig.bg,
                        outcomeConfig.color
                      )}>
                        <OutcomeIcon size={12} />
                        {signal.outcome}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  No signals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
