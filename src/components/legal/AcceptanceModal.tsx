'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CurrentVersions } from '@/lib/api';
import { FileText, Shield, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AcceptanceModalProps {
  versions: CurrentVersions;
  onAccept: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function AcceptanceModal({ versions, onAccept, isLoading, className }: AcceptanceModalProps) {
  const [tosChecked, setTosChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  const canAccept = tosChecked && privacyChecked && !isLoading;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={cn('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4', className)}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Accept Terms to Continue</h2>
          <p className="text-sm text-slate-500 mt-1">
            Please review and accept our terms before using GANO Alpha
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Terms of Service */}
          <div className={cn(
            'p-4 rounded-lg border-2 transition-colors cursor-pointer',
            tosChecked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
          )}
            onClick={() => setTosChecked(!tosChecked)}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                tosChecked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
              )}>
                {tosChecked && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  <span className="font-medium text-slate-900">Terms of Service</span>
                  <span className="text-xs text-slate-400">v{versions.tos_version}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  I have read and agree to the Terms of Service
                </p>
                <Link
                  href="/terms"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read full terms <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className={cn(
            'p-4 rounded-lg border-2 transition-colors cursor-pointer',
            privacyChecked ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
          )}
            onClick={() => setPrivacyChecked(!privacyChecked)}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                privacyChecked ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
              )}>
                {privacyChecked && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-indigo-600" />
                  <span className="font-medium text-slate-900">Privacy Policy</span>
                  <span className="text-xs text-slate-400">v{versions.privacy_version}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  I have read and agree to the Privacy Policy
                </p>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Read full policy <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Effective Date Notice */}
          <p className="text-xs text-slate-400 text-center">
            Effective date: {formatDate(versions.effective_date)}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onAccept}
            disabled={!canAccept}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition-colors',
              canAccept
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Accepting...' : 'Accept and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
