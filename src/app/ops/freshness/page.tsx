'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getSignalFreshnessStatus,
  getSLAComplianceReport,
  getFreshnessAudit,
  getStaleSignals,
  type SignalFreshnessStatus,
  type SLAComplianceReport,
  type FreshnessAuditRecord,
  type StaleSignal,
} from '@/lib/api';
import {
  SLAStatusCard,
  SLAComplianceCard,
  FreshnessAuditTable,
  StaleSignalsCard,
} from '@/components/signal-freshness';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Dev mode bypass aligned with backend DASHBOARD_ACCESS env var
const isDashboardDevMode = process.env.NEXT_PUBLIC_DASHBOARD_ACCESS === 'true';

export default function SignalFreshnessPage() {
  const { isAuthenticated, getAccessToken, user } = useAuth();

  const [freshnessStatus, setFreshnessStatus] = useState<SignalFreshnessStatus | null>(null);
  const [complianceReport, setComplianceReport] = useState<SLAComplianceReport | null>(null);
  const [auditRecords, setAuditRecords] = useState<FreshnessAuditRecord[]>([]);
  const [staleSignals, setStaleSignals] = useState<StaleSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditDays, setAuditDays] = useState(30);

  // Access control - same roles as ops dashboard, with dev mode bypass
  const allowedRoles = ['admin', 'superadmin', 'tester', 'developer'];
  const hasAccess = isDashboardDevMode || (user?.role && allowedRoles.includes(user.role));

  const fetchData = useCallback(async () => {
    if (!isAuthenticated && !isDashboardDevMode) return;

    setIsLoading(true);
    setError(null);

    try {
      const [status, compliance, audit, stale] = await Promise.all([
        getSignalFreshnessStatus(getAccessToken),
        getSLAComplianceReport(getAccessToken, auditDays),
        getFreshnessAudit(getAccessToken, auditDays),
        getStaleSignals(getAccessToken),
      ]);

      setFreshnessStatus(status);
      setComplianceReport(compliance);
      setAuditRecords(audit);
      setStaleSignals(stale);
    } catch (err) {
      console.error('Failed to fetch signal freshness data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAccessToken, auditDays]);

  useEffect(() => {
    if ((isAuthenticated || isDashboardDevMode) && hasAccess) {
      fetchData();
    }
  }, [isAuthenticated, hasAccess, fetchData]);

  if (!isAuthenticated && !isDashboardDevMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Please sign in to view the signal freshness dashboard.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">You don&apos;t have access to this page.</p>
          <p className="text-sm text-slate-400 mt-2">Required roles: {allowedRoles.join(', ')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/ops/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Signal Freshness</h1>
                <p className="text-sm text-slate-500 mt-0.5">SLA compliance and staleness monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <select
                value={auditDays}
                onChange={(e) => setAuditDays(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading && !freshnessStatus ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Row: Current Status + Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {freshnessStatus && <SLAStatusCard status={freshnessStatus} />}
              {complianceReport && <SLAComplianceCard report={complianceReport} />}
            </div>

            {/* Stale Signals */}
            <StaleSignalsCard signals={staleSignals} />

            {/* Audit Table */}
            <FreshnessAuditTable records={auditRecords} />
          </div>
        )}
      </div>
    </div>
  );
}
