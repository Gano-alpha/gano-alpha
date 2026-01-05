'use client';

import { cn } from '@/lib/utils';
import type { MethodologyInfo } from '@/lib/api';
import { BookOpen, Shield, Layers, Database, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface MethodologyCardProps {
  methodology: MethodologyInfo;
  className?: string;
}

export function MethodologyCard({ methodology, className }: MethodologyCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">Methodology</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">{methodology.strategy_type}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Description */}
        <div>
          <p className="text-sm text-slate-600 leading-relaxed">{methodology.description}</p>
        </div>

        {/* Signal Tiers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} className="text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-900">Signal Tiers</h4>
          </div>
          <div className="space-y-2">
            {Object.entries(methodology.signal_tiers).map(([tier, desc]) => (
              <div key={tier} className="flex gap-3">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0',
                  tier === 'ENTER' ? 'bg-emerald-100 text-emerald-700' :
                  tier === 'WATCH' ? 'bg-amber-100 text-amber-700' :
                  tier === 'AVOID' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                )}>
                  {tier}
                </span>
                <span className="text-sm text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Management */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-900">Risk Management</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Stop Loss</p>
              <p className="text-sm font-medium text-slate-900">{methodology.risk_management.stop_loss}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Take Profit</p>
              <p className="text-sm font-medium text-slate-900">{methodology.risk_management.take_profit}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Max Positions</p>
              <p className="text-sm font-medium text-slate-900">{methodology.risk_management.max_positions}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-xs text-slate-500">Holding Period</p>
              <p className="text-sm font-medium text-slate-900">{methodology.risk_management.holding_period}</p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-900">Data Sources</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {methodology.data_sources.map((source, idx) => (
              <span key={idx} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                {source}
              </span>
            ))}
          </div>
        </div>

        {/* Full Methodology Link */}
        <Link
          href={methodology.methodology_url}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
        >
          <span>Read Full Methodology</span>
          <ExternalLink size={14} />
        </Link>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-center">
          Model: {methodology.gano_model_name} ({methodology.gano_model_version})
        </p>
      </div>
    </div>
  );
}
