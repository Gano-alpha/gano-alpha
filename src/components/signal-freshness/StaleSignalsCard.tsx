'use client';

import { cn } from '@/lib/utils';
import type { StaleSignal } from '@/lib/api';
import { AlertTriangle, Clock } from 'lucide-react';

interface StaleSignalsCardProps {
  signals: StaleSignal[];
  className?: string;
}

export function StaleSignalsCard({ signals, className }: StaleSignalsCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'LONG' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  };

  const getTierColor = (tier: string) => {
    return tier === 'SNIPER' ? 'text-indigo-600 bg-indigo-50' : 'text-violet-600 bg-violet-50';
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Stale Signals</h3>
              <p className="text-sm text-slate-500 mt-0.5">Signals older than 24 hours</p>
            </div>
          </div>
          {signals.length > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
              {signals.length} stale
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {signals.length > 0 ? (
          signals.map((signal, idx) => (
            <div key={`${signal.signal_date}-${signal.ticker}-${idx}`} className="px-6 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{signal.ticker}</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium',
                    getTierColor(signal.signal_tier)
                  )}>
                    {signal.signal_tier}
                  </span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium',
                    getDirectionColor(signal.direction)
                  )}>
                    {signal.direction}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">{formatDate(signal.signal_date)}</span>
                  {signal.hours_since_publish !== null && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock size={14} />
                      <span>{signal.hours_since_publish.toFixed(1)}h old</span>
                    </div>
                  )}
                </div>
              </div>

              {signal.staleness_reason && (
                <p className="text-xs text-slate-400 mt-1">{signal.staleness_reason}</p>
              )}
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
              <Clock size={24} className="text-emerald-500" />
            </div>
            <p className="text-slate-600 font-medium">All signals are fresh</p>
            <p className="text-sm text-slate-400 mt-1">No stale signals detected</p>
          </div>
        )}
      </div>
    </div>
  );
}
