'use client';

import { AlertTriangle, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FinancialDisclaimerProps {
  variant?: 'inline' | 'banner' | 'compact';
  className?: string;
}

/**
 * Financial Disclaimer Component (B20)
 *
 * Displays required regulatory disclaimer on signal-displaying pages.
 *
 * Variants:
 * - inline: Full disclaimer text for signal pages
 * - banner: Sticky banner at bottom of page
 * - compact: Small inline text with link to full disclaimer
 */
export function FinancialDisclaimer({ variant = 'inline', className }: FinancialDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-slate-500', className)}>
        <Info size={12} />
        <span>Not financial advice.</span>
        <Link
          href="/disclaimer"
          className="text-indigo-600 hover:underline inline-flex items-center gap-1"
        >
          Read disclaimer
          <ExternalLink size={10} />
        </Link>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'bg-amber-50 border-t border-amber-200 px-4 py-3',
        className
      )}>
        <div className="max-w-4xl mx-auto flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">Important:</span>{' '}
            GANO provides informational content only, not financial advice.
            Past performance does not guarantee future results.
            You are solely responsible for your investment decisions.{' '}
            <Link href="/disclaimer" className="font-medium underline hover:no-underline">
              Full disclaimer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default: inline variant
  return (
    <div className={cn(
      'bg-slate-50 border border-slate-200 rounded-lg p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div className="text-sm text-slate-600 space-y-2">
          <p className="font-medium text-slate-900">Important Disclaimer</p>
          <p>
            <strong>Not Financial Advice:</strong> The information provided by GANO is for
            informational and educational purposes only. It should not be construed as
            financial, investment, or trading advice.
          </p>
          <p>
            <strong>No Guarantees:</strong> Past performance is not indicative of future results.
            GANO does not guarantee any specific outcomes or returns.
          </p>
          <p>
            <strong>Your Responsibility:</strong> You are solely responsible for your own
            investment decisions. Always conduct your own research and consider consulting
            with a qualified financial advisor before making any investment.
          </p>
          <p className="pt-2">
            <Link
              href="/disclaimer"
              className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              Read full disclaimer
              <ExternalLink size={12} />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Signal Page Disclaimer - Specific version for pages showing trading signals
 */
export function SignalDisclaimer({ className }: { className?: string }) {
  return (
    <div className={cn(
      'bg-amber-50/50 border border-amber-200/50 rounded-lg px-4 py-3',
      className
    )}>
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <AlertTriangle size={14} className="flex-shrink-0" />
        <p>
          <span className="font-medium">Disclaimer:</span>{' '}
          This is not financial advice. Past performance does not guarantee future results.
          You make your own investment decisions.{' '}
          <Link href="/disclaimer" className="underline hover:no-underline">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}
