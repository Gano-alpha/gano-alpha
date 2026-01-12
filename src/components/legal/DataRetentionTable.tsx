'use client';

import { cn } from '@/lib/utils';
import type { DataRetentionInfo } from '@/lib/api';
import { Database, Clock, Scale, Trash2, Lock } from 'lucide-react';

interface DataRetentionTableProps {
  data: DataRetentionInfo[];
  className?: string;
}

export function DataRetentionTable({ data, className }: DataRetentionTableProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Data Retention Policy</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">GDPR-compliant data retention information</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3">Data Category</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Retention Period</th>
              <th className="px-6 py-3">Legal Basis</th>
              <th className="px-6 py-3">Deletable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-900">{item.data_category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">{item.description}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    {item.retention_period}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Scale size={14} className="text-slate-400" />
                    {item.legal_basis}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.can_delete ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Trash2 size={14} />
                      <span className="text-sm">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Lock size={14} />
                      <span className="text-sm">No</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
