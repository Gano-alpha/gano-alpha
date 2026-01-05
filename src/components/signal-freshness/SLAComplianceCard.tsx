'use client';

import { cn } from '@/lib/utils';
import type { SLAComplianceReport } from '@/lib/api';
import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SLAComplianceCardProps {
  report: SLAComplianceReport;
  className?: string;
}

export function SLAComplianceCard({ report, className }: SLAComplianceCardProps) {
  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return 'text-emerald-600';
    if (rate >= 80) return 'text-amber-600';
    return 'text-red-600';
  };

  const getComplianceBg = (rate: number) => {
    if (rate >= 95) return 'bg-emerald-500';
    if (rate >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatDateRange = () => {
    const start = new Date(report.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(report.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">SLA Compliance</h3>
            <p className="text-sm text-slate-500 mt-0.5">{formatDateRange()}</p>
          </div>
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold',
            report.compliance_rate >= 95 ? 'bg-emerald-50 text-emerald-600' :
            report.compliance_rate >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
          )}>
            {report.compliance_rate >= 95 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {report.compliance_rate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-6">
        {/* Compliance Rate Visual */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm text-slate-500">Compliance Rate</span>
            <span className={cn('text-3xl font-bold', getComplianceColor(report.compliance_rate))}>
              {report.compliance_rate.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getComplianceBg(report.compliance_rate))}
              style={{ width: `${report.compliance_rate}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {report.compliant_days} of {report.total_trading_days} trading days on time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Avg Time Before Open */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock size={14} />
              <span className="text-xs">Avg Before Open</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {report.avg_minutes_before_open > 0 ? '+' : ''}{report.avg_minutes_before_open.toFixed(0)} min
            </p>
          </div>

          {/* Trading Days */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <CheckCircle2 size={14} />
              <span className="text-xs">Trading Days</span>
            </div>
            <p className="text-lg font-semibold text-slate-900">{report.total_trading_days}</p>
          </div>

          {/* Delayed Days */}
          <div className={cn(
            'p-3 rounded-lg',
            report.delayed_days > 0 ? 'bg-amber-50' : 'bg-slate-50'
          )}>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <AlertCircle size={14} className={report.delayed_days > 0 ? 'text-amber-500' : ''} />
              <span className="text-xs">Delayed</span>
            </div>
            <p className={cn(
              'text-lg font-semibold',
              report.delayed_days > 0 ? 'text-amber-600' : 'text-slate-900'
            )}>
              {report.delayed_days}
            </p>
          </div>

          {/* Failed Days */}
          <div className={cn(
            'p-3 rounded-lg',
            report.failed_days > 0 ? 'bg-red-50' : 'bg-slate-50'
          )}>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <AlertCircle size={14} className={report.failed_days > 0 ? 'text-red-500' : ''} />
              <span className="text-xs">Failed</span>
            </div>
            <p className={cn(
              'text-lg font-semibold',
              report.failed_days > 0 ? 'text-red-600' : 'text-slate-900'
            )}>
              {report.failed_days}
            </p>
          </div>
        </div>

        {/* Holiday Note */}
        {report.holiday_days > 0 && (
          <p className="text-xs text-slate-400 mt-3 text-center">
            {report.holiday_days} holiday{report.holiday_days > 1 ? 's' : ''} excluded from compliance calculation
          </p>
        )}
      </div>
    </div>
  );
}
