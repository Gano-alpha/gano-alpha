'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, TrendingUp, TrendingDown, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getDailyActiveUsers,
  getWeeklyActiveUsers,
  getMonthlyActiveUsers,
  type DailyActiveUsers,
  type WeeklyActiveUsers,
  type MonthlyActiveUsers,
} from '@/lib/api';

interface ActiveUsersChartProps {
  getAccessToken: () => Promise<string | null>;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';

export function ActiveUsersChart({ getAccessToken }: ActiveUsersChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [dailyData, setDailyData] = useState<DailyActiveUsers[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyActiveUsers[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyActiveUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [daily, weekly, monthly] = await Promise.all([
        getDailyActiveUsers(getAccessTokenRef.current, {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
        getWeeklyActiveUsers(getAccessTokenRef.current, 12),
        getMonthlyActiveUsers(getAccessTokenRef.current, 12),
      ]);
      setDailyData(daily);
      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch (err) {
      console.error('Failed to load active users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentData = () => {
    switch (timeRange) {
      case 'daily':
        return dailyData.map(d => ({ date: d.activity_date, value: d.dau }));
      case 'weekly':
        return weeklyData.map(d => ({ date: d.week_start, value: d.wau }));
      case 'monthly':
        return monthlyData.map(d => ({ date: d.month_start, value: d.mau }));
    }
  };

  const data = getCurrentData();
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const latestValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const changePercent = previousValue > 0 ? ((latestValue - previousValue) / previousValue) * 100 : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === 'daily') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (timeRange === 'weekly') {
      return `W${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const getLabel = () => {
    switch (timeRange) {
      case 'daily': return 'DAU';
      case 'weekly': return 'WAU';
      case 'monthly': return 'MAU';
    }
  };

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
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Active Users</h3>
            <p className="text-sm text-slate-500">{getLabel()} over time</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['daily', 'weekly', 'monthly'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                timeRange === range
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-baseline gap-4 mb-6">
        <span className="text-4xl font-bold text-slate-900">
          {latestValue.toLocaleString()}
        </span>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
        )}>
          {changePercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {Math.abs(changePercent).toFixed(1)}%
        </div>
        <span className="text-sm text-slate-500">vs previous period</span>
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end gap-1">
        {data.slice(-30).map((item, index) => (
          <div
            key={item.date}
            className="flex-1 flex flex-col items-center group"
          >
            <div
              className={cn(
                'w-full rounded-t transition-all',
                index === data.slice(-30).length - 1
                  ? 'bg-indigo-600'
                  : 'bg-indigo-200 group-hover:bg-indigo-400'
              )}
              style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: 4 }}
              title={`${formatDate(item.date)}: ${item.value.toLocaleString()}`}
            />
          </div>
        ))}
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between mt-2 text-xs text-slate-400">
        <span>{data.length > 0 ? formatDate(data[Math.max(0, data.length - 30)].date) : ''}</span>
        <span>{data.length > 0 ? formatDate(data[data.length - 1].date) : ''}</span>
      </div>

      {/* Additional Stats for Daily */}
      {timeRange === 'daily' && dailyData.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">Avg Sessions</p>
            <p className="text-lg font-semibold text-slate-900">
              {Math.round(dailyData.reduce((acc, d) => acc + d.total_sessions, 0) / dailyData.length).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Avg Events</p>
            <p className="text-lg font-semibold text-slate-900">
              {Math.round(dailyData.reduce((acc, d) => acc + d.total_events, 0) / dailyData.length).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Avg Duration</p>
            <p className="text-lg font-semibold text-slate-900">
              {Math.round(dailyData.reduce((acc, d) => acc + d.avg_session_duration_seconds, 0) / dailyData.length / 60)}m
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
