'use client';

import {
  MessageSquare, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Bug, Lightbulb, Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedbackStats } from '@/lib/api';

interface FeedbackStatsCardProps {
  stats: FeedbackStats;
  className?: string;
}

export function FeedbackStatsCard({ stats, className }: FeedbackStatsCardProps) {
  const formatHours = (hours: number | null) => {
    if (hours === null) return 'N/A';
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* Total Count */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.total_count}</p>
            <p className="text-xs text-slate-500">Total Feedback</p>
          </div>
        </div>
      </div>

      {/* Unresolved */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.unresolved_count}</p>
            <p className="text-xs text-slate-500">Unresolved</p>
          </div>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.this_week_count}</p>
            <p className="text-xs text-slate-500">This Week</p>
          </div>
        </div>
      </div>

      {/* Avg Resolution Time */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {formatHours(stats.avg_resolution_hours)}
            </p>
            <p className="text-xs text-slate-500">Avg Resolution</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeedbackBreakdownProps {
  stats: FeedbackStats;
  className?: string;
}

export function FeedbackBreakdown({ stats, className }: FeedbackBreakdownProps) {
  const typeConfig = [
    { key: 'bug', label: 'Bugs', icon: Bug, color: 'text-red-600 bg-red-100' },
    { key: 'feature_request', label: 'Features', icon: Lightbulb, color: 'text-amber-600 bg-amber-100' },
    { key: 'praise', label: 'Praise', icon: Heart, color: 'text-pink-600 bg-pink-100' },
  ];

  const statusConfig = [
    { key: 'new', label: 'New', color: 'bg-blue-500' },
    { key: 'triaged', label: 'Triaged', color: 'bg-purple-500' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
    { key: 'resolved', label: 'Resolved', color: 'bg-emerald-500' },
  ];

  const total = stats.total_count || 1;

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {/* By Type */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">By Type</h4>
        <div className="space-y-2">
          {typeConfig.map(({ key, label, icon: Icon, color }) => {
            const count = stats.by_type[key] || 0;
            const pct = (count / total) * 100;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color.split(' ')[1])}>
                  <Icon size={16} className={color.split(' ')[0]} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                    <div
                      className={cn('h-full rounded-full', color.split(' ')[1].replace('100', '500'))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">By Status</h4>
        <div className="space-y-2">
          {statusConfig.map(({ key, label, color }) => {
            const count = stats.by_status[key] || 0;
            const pct = (count / total) * 100;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', color)} />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1">
                    <div
                      className={cn('h-full rounded-full', color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
