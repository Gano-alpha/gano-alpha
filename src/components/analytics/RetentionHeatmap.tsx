'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid3X3, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCohortRetention,
  getRetentionRates,
  type CohortData,
  type RetentionData,
} from '@/lib/api';

interface RetentionHeatmapProps {
  getAccessToken: () => Promise<string | null>;
}

export function RetentionHeatmap({ getAccessToken }: RetentionHeatmapProps) {
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCohort, setShowCohort] = useState(true);

  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cohorts, retention] = await Promise.all([
        getCohortRetention(getAccessTokenRef.current, {
          start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
        getRetentionRates(getAccessTokenRef.current),
      ]);
      setCohortData(cohorts);
      setRetentionData(retention);
    } catch (err) {
      console.error('Failed to load retention data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getRetentionColor = (value: number | null): string => {
    if (value === null) return 'bg-slate-100';
    if (value >= 80) return 'bg-emerald-500 text-white';
    if (value >= 60) return 'bg-emerald-400 text-white';
    if (value >= 40) return 'bg-emerald-300 text-emerald-900';
    if (value >= 20) return 'bg-amber-300 text-amber-900';
    if (value >= 10) return 'bg-orange-300 text-orange-900';
    return 'bg-red-300 text-red-900';
  };

  const formatCohortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dayColumns = ['D0', 'D1', 'D3', 'D7', 'D14', 'D30'];

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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Grid3X3 size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Retention</h3>
            <p className="text-sm text-slate-500">User retention by cohort</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setShowCohort(true)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              showCohort
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Cohort View
          </button>
          <button
            onClick={() => setShowCohort(false)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              !showCohort
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Overall
          </button>
        </div>
      </div>

      {showCohort ? (
        /* Cohort Heatmap */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">
                  Cohort
                </th>
                {dayColumns.map((day) => (
                  <th key={day} className="text-center text-xs font-medium text-slate-500 pb-3 px-2">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortData.slice(-12).map((cohort) => (
                <tr key={cohort.cohort_date}>
                  <td className="py-1 pr-4 text-xs text-slate-600 whitespace-nowrap">
                    {formatCohortDate(cohort.cohort_date)}
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-12 h-8 rounded flex items-center justify-center text-xs font-medium',
                      getRetentionColor(cohort.day_0)
                    )}>
                      {cohort.day_0 !== null ? `${cohort.day_0}%` : '-'}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-12 h-8 rounded flex items-center justify-center text-xs font-medium',
                      getRetentionColor(cohort.day_1)
                    )}>
                      {cohort.day_1 !== null ? `${cohort.day_1}%` : '-'}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-12 h-8 rounded flex items-center justify-center text-xs font-medium',
                      getRetentionColor(cohort.day_3)
                    )}>
                      {cohort.day_3 !== null ? `${cohort.day_3}%` : '-'}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-12 h-8 rounded flex items-center justify-center text-xs font-medium',
                      getRetentionColor(cohort.day_7)
                    )}>
                      {cohort.day_7 !== null ? `${cohort.day_7}%` : '-'}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-12 h-8 rounded flex items-center justify-center text-xs font-medium',
                      getRetentionColor(cohort.day_14)
                    )}>
                      {cohort.day_14 !== null ? `${cohort.day_14}%` : '-'}
                    </div>
                  </td>
                  <td className="py-1 px-1">
                    <div className={cn(
                      'w-12 h-8 rounded flex items-center justify-center text-xs font-medium',
                      getRetentionColor(cohort.day_30)
                    )}>
                      {cohort.day_30 !== null ? `${cohort.day_30}%` : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Overall Retention */
        <div className="space-y-4">
          {retentionData.map((item) => (
            <div key={item.days_since_signup} className="flex items-center gap-4">
              <span className="w-16 text-sm text-slate-600">D{item.days_since_signup}</span>
              <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all"
                  style={{ width: `${item.retention_rate_pct}%` }}
                />
              </div>
              <span className="w-16 text-right text-sm font-medium text-slate-900">
                {item.retention_rate_pct.toFixed(1)}%
              </span>
              <span className="w-24 text-right text-xs text-slate-500">
                {item.active_users.toLocaleString()} / {item.total_users.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Info size={12} />
          Retention %:
        </span>
        <div className="flex gap-1">
          {[
            { color: 'bg-red-300', label: '0-10%' },
            { color: 'bg-orange-300', label: '10-20%' },
            { color: 'bg-amber-300', label: '20-40%' },
            { color: 'bg-emerald-300', label: '40-60%' },
            { color: 'bg-emerald-400', label: '60-80%' },
            { color: 'bg-emerald-500', label: '80%+' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded', item.color)} />
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
