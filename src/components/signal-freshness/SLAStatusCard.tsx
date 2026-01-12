'use client';

import { cn } from '@/lib/utils';
import type { SignalFreshnessStatus } from '@/lib/api';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface SLAStatusCardProps {
  status: SignalFreshnessStatus;
  className?: string;
}

const SLA_STATUS_CONFIG: Record<string, {
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  ON_TIME: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'On Time'
  },
  LATE_BUT_BEFORE_OPEN: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Late (Before Open)'
  },
  LATE_AFTER_OPEN: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Late (After Open)'
  },
  NOT_APPLICABLE: {
    icon: Clock,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Holiday'
  },
};

// Default fallback for unknown status values
const DEFAULT_STATUS_CONFIG = {
  icon: Clock,
  color: 'text-slate-500',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  label: 'Unknown'
};

export function SLAStatusCard({ status, className }: SLAStatusCardProps) {
  const config = SLA_STATUS_CONFIG[status.sla_status] || DEFAULT_STATUS_CONFIG;
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
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
          <div className="flex items-center gap-3">
            <StatusIcon size={24} className={config.color} />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Signal Freshness</h3>
              <p className="text-sm text-slate-500">{formatDate(status.signal_date)}</p>
            </div>
          </div>
          <div className={cn(
            'px-3 py-1.5 rounded-full text-sm font-semibold',
            config.bg,
            config.color
          )}>
            {config.label}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Signals */}
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{status.total_signals}</p>
            <p className="text-xs text-slate-500 mt-1">Total Signals</p>
          </div>

          {/* Enter Signals */}
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{status.enter_signals}</p>
            <p className="text-xs text-emerald-600 mt-1">Enter</p>
          </div>

          {/* Watch Signals */}
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{status.watch_signals}</p>
            <p className="text-xs text-amber-600 mt-1">Watch</p>
          </div>

          {/* Avoid Signals */}
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{status.avoid_signals}</p>
            <p className="text-xs text-red-600 mt-1">Avoid</p>
          </div>
        </div>

        {/* Publication Details */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Published At</span>
            <span className="font-medium text-slate-700">
              {formatTime(status.published_at)}
            </span>
          </div>
          {status.hours_since_publish !== null && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-500">Age</span>
              <span className={cn(
                'font-medium',
                status.is_stale ? 'text-red-600' : 'text-slate-700'
              )}>
                {status.hours_since_publish.toFixed(1)}h
                {status.is_stale && ' (Stale)'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
