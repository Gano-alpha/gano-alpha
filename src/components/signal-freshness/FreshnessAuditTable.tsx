'use client';

import { cn } from '@/lib/utils';
import type { FreshnessAuditRecord } from '@/lib/api';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface FreshnessAuditTableProps {
  records: FreshnessAuditRecord[];
  className?: string;
}

const STATUS_ICONS = {
  ON_TIME: { icon: CheckCircle2, color: 'text-emerald-500' },
  LATE_BUT_BEFORE_OPEN: { icon: AlertTriangle, color: 'text-amber-500' },
  LATE_AFTER_OPEN: { icon: XCircle, color: 'text-red-500' },
  NOT_APPLICABLE: { icon: Clock, color: 'text-slate-400' },
};

export function FreshnessAuditTable({ records, className }: FreshnessAuditTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (slaStatus: string) => {
    return STATUS_ICONS[slaStatus as keyof typeof STATUS_ICONS] || STATUS_ICONS.NOT_APPLICABLE;
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Freshness Audit Log</h3>
        <p className="text-sm text-slate-500 mt-0.5">Daily signal publication history</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Published</th>
              <th className="px-6 py-3">Before Open</th>
              <th className="px-6 py-3">Signals</th>
              <th className="px-6 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length > 0 ? (
              records.map((record) => {
                const statusConfig = getStatusConfig(record.sla_status);
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={record.signal_date} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">
                      {formatDate(record.signal_date)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon size={16} className={statusConfig.color} />
                        <span className={cn(
                          'text-sm font-medium',
                          record.sla_status === 'ON_TIME' ? 'text-emerald-600' :
                          record.sla_status === 'LATE_BUT_BEFORE_OPEN' ? 'text-amber-600' :
                          record.sla_status === 'LATE_AFTER_OPEN' ? 'text-red-600' : 'text-slate-500'
                        )}>
                          {record.sla_status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {formatTime(record.published_at)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        'text-sm font-medium',
                        record.minutes_before_market_open > 0 ? 'text-emerald-600' :
                        record.minutes_before_market_open < 0 ? 'text-red-600' : 'text-slate-600'
                      )}>
                        {record.minutes_before_market_open > 0 ? '+' : ''}
                        {record.minutes_before_market_open} min
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {record.total_signals}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">
                      {record.delay_reason || '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No audit records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
