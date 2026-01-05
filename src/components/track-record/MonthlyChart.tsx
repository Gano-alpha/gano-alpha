'use client';

import { cn } from '@/lib/utils';
import type { MonthlyPerformance } from '@/lib/api';

interface MonthlyChartProps {
  data: MonthlyPerformance[];
  className?: string;
}

export function MonthlyChart({ data, className }: MonthlyChartProps) {
  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  };

  // Find max signal count for scaling bar width
  const maxSignals = Math.max(...data.map(d => d.total_signals), 1);

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Monthly Performance</h3>
        <p className="text-sm text-slate-500 mt-0.5">ENTER signals by month</p>
      </div>

      <div className="p-6">
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                {/* Month Label */}
                <div className="w-16 text-sm font-medium text-slate-600">
                  {formatMonth(month.month)}
                </div>

                {/* Signals Bar */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded"
                        style={{ width: `${(month.total_signals / maxSignals) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs text-slate-500">{month.total_signals}</span>
                  </div>
                </div>

                {/* Win Rate */}
                <div className={cn(
                  'w-16 text-sm font-medium text-right',
                  month.win_rate !== null && month.win_rate >= 50 ? 'text-emerald-600' :
                  month.win_rate !== null ? 'text-red-600' : 'text-slate-400'
                )}>
                  {month.win_rate !== null ? `${month.win_rate.toFixed(0)}%` : '—'}
                </div>

                {/* Avg Return */}
                <div className={cn(
                  'w-20 text-sm font-semibold text-right',
                  month.avg_return_pct !== null && month.avg_return_pct > 0 ? 'text-emerald-600' :
                  month.avg_return_pct !== null && month.avg_return_pct < 0 ? 'text-red-600' : 'text-slate-400'
                )}>
                  {month.avg_return_pct !== null
                    ? `${month.avg_return_pct > 0 ? '+' : ''}${month.avg_return_pct.toFixed(1)}%`
                    : '—'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            No monthly data available
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-end gap-6 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded" />
            <span>Signal Count</span>
          </div>
          <span>Win Rate</span>
          <span>Avg Return</span>
        </div>
      </div>
    </div>
  );
}
