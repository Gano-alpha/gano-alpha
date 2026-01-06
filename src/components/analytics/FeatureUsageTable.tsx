'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Layers, Loader2, TrendingUp, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFeatureUsage, type FeatureUsage } from '@/lib/api';

interface FeatureUsageTableProps {
  getAccessToken: () => Promise<string | null>;
}

export function FeatureUsageTable({ getAccessToken }: FeatureUsageTableProps) {
  const [features, setFeatures] = useState<FeatureUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFeatureUsage(getAccessTokenRef.current, { days, limit: 20 });
      setFeatures(data);
    } catch (err) {
      console.error('Failed to load feature usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  const formatFeatureName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const maxUsage = Math.max(...features.map(f => f.total_usage), 1);

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
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Layers size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Feature Usage</h3>
            <p className="text-sm text-slate-500">Top features by engagement</p>
          </div>
        </div>

        {/* Days Selector */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                days === d
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {features.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No feature usage data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase pb-3 pr-4">
                  Feature
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp size={12} />
                    Usage
                  </div>
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Users size={12} />
                    Users
                  </div>
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase pb-3 pl-4">
                  <div className="flex items-center justify-end gap-1">
                    <Clock size={12} />
                    Avg Time
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={feature.feature_key}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-200 text-slate-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatFeatureName(feature.feature_key)}
                        </p>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(feature.total_usage / maxUsage) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-slate-900">
                      {feature.total_usage.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-slate-600">
                      {feature.unique_users.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span className="text-sm text-slate-500">
                      {formatDuration(feature.avg_duration_seconds)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total Features</p>
          <p className="text-lg font-bold text-slate-900">{features.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total Usage</p>
          <p className="text-lg font-bold text-blue-600">
            {features.reduce((acc, f) => acc + f.total_usage, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Unique Users</p>
          <p className="text-lg font-bold text-slate-900">
            {Math.max(...features.map(f => f.unique_users), 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
