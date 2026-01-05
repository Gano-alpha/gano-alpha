'use client';

import { cn } from '@/lib/utils';
import type { TrackRecordQuickStats } from '@/lib/api';
import { TrendingUp, Calendar, BarChart3, Target } from 'lucide-react';

interface PerformanceHeaderProps {
  stats: TrackRecordQuickStats;
  className?: string;
}

export function PerformanceHeader({ stats, className }: PerformanceHeaderProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white', className)}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title Section */}
        <div>
          <h1 className="text-3xl font-bold">Track Record</h1>
          <p className="text-indigo-200 mt-2">
            {stats.data_months}+ months of signal performance data
          </p>
          <p className="text-indigo-300 text-sm mt-1">
            {formatDate(stats.first_signal_date)} — {formatDate(stats.last_signal_date)}
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Signals */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <BarChart3 size={20} className="mx-auto mb-2 text-indigo-200" />
            <p className="text-2xl font-bold">{stats.total_signals.toLocaleString()}</p>
            <p className="text-xs text-indigo-200">Total Signals</p>
          </div>

          {/* Unique Tickers */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Target size={20} className="mx-auto mb-2 text-indigo-200" />
            <p className="text-2xl font-bold">{stats.unique_tickers}</p>
            <p className="text-xs text-indigo-200">Unique Tickers</p>
          </div>

          {/* ENTER Win Rate */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <TrendingUp size={20} className="mx-auto mb-2 text-emerald-300" />
            <p className="text-2xl font-bold">
              {stats.enter_win_rate !== null ? `${stats.enter_win_rate.toFixed(1)}%` : '—'}
            </p>
            <p className="text-xs text-indigo-200">ENTER Win Rate</p>
          </div>

          {/* ENTER Avg Return */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Calendar size={20} className="mx-auto mb-2 text-indigo-200" />
            <p className={cn(
              'text-2xl font-bold',
              stats.enter_avg_return !== null && stats.enter_avg_return > 0 ? 'text-emerald-300' :
              stats.enter_avg_return !== null && stats.enter_avg_return < 0 ? 'text-red-300' : ''
            )}>
              {stats.enter_avg_return !== null
                ? `${stats.enter_avg_return > 0 ? '+' : ''}${stats.enter_avg_return.toFixed(1)}%`
                : '—'}
            </p>
            <p className="text-xs text-indigo-200">ENTER Avg Return</p>
          </div>
        </div>
      </div>
    </div>
  );
}
