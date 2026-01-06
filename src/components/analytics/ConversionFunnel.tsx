'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Filter, Loader2, ChevronRight, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getConversionFunnel, type FunnelStep } from '@/lib/api';

interface ConversionFunnelProps {
  getAccessToken: () => Promise<string | null>;
}

export function ConversionFunnel({ getAccessToken }: ConversionFunnelProps) {
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getConversionFunnel(getAccessTokenRef.current);
      setFunnelData(data.sort((a, b) => a.step_order - b.step_order));
    } catch (err) {
      console.error('Failed to load funnel data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)}d`;
  };

  const maxUsers = funnelData[0]?.users_completed || 1;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-center text-red-600 py-8">{error}</div>
      </div>
    );
  }

  // Calculate overall conversion
  const overallConversion = funnelData.length > 1
    ? ((funnelData[funnelData.length - 1].users_completed / funnelData[0].users_completed) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Filter size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Conversion Funnel</h3>
            <p className="text-sm text-slate-500">Signup to subscription journey</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">{overallConversion}%</p>
          <p className="text-xs text-slate-500">Overall conversion</p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-3">
        {funnelData.map((step, index) => {
          const widthPercent = (step.users_completed / maxUsers) * 100;
          const isLast = index === funnelData.length - 1;

          return (
            <div key={step.step_key}>
              {/* Step Row */}
              <div className="flex items-center gap-4">
                {/* Step Number */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  index === 0 ? 'bg-indigo-600 text-white' :
                  isLast ? 'bg-emerald-600 text-white' :
                  'bg-slate-200 text-slate-600'
                )}>
                  {step.step_order}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">
                      {step.step_name}
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Users size={14} />
                        {step.users_completed.toLocaleString()}
                      </span>
                      {step.step_conversion_pct !== null && (
                        <span className={cn(
                          'font-medium',
                          step.step_conversion_pct >= 50 ? 'text-emerald-600' :
                          step.step_conversion_pct >= 25 ? 'text-amber-600' :
                          'text-red-600'
                        )}>
                          {step.step_conversion_pct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-lg transition-all duration-500',
                        index === 0 ? 'bg-indigo-500' :
                        isLast ? 'bg-emerald-500' :
                        'bg-indigo-400'
                      )}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>

                  {/* Time to step */}
                  {step.avg_time_to_step_seconds !== null && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                      <Clock size={10} />
                      Avg time: {formatDuration(step.avg_time_to_step_seconds)}
                    </div>
                  )}
                </div>
              </div>

              {/* Drop-off indicator */}
              {!isLast && step.prev_step_users !== null && (
                <div className="ml-12 flex items-center gap-2 py-2 text-xs text-slate-400">
                  <ChevronRight size={12} />
                  <span>
                    {((1 - (funnelData[index + 1]?.users_completed || 0) / step.users_completed) * 100).toFixed(1)}% drop-off
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total Signups</p>
          <p className="text-lg font-bold text-slate-900">
            {funnelData[0]?.users_completed.toLocaleString() || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Subscribers</p>
          <p className="text-lg font-bold text-emerald-600">
            {funnelData[funnelData.length - 1]?.users_completed.toLocaleString() || 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Biggest Drop</p>
          <p className="text-lg font-bold text-red-600">
            {funnelData.reduce((max, step, i) => {
              if (i === 0 || step.step_conversion_pct === null) return max;
              const dropoff = 100 - step.step_conversion_pct;
              return dropoff > max.dropoff ? { name: step.step_name, dropoff } : max;
            }, { name: '-', dropoff: 0 }).name}
          </p>
        </div>
      </div>
    </div>
  );
}
