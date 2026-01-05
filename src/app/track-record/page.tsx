'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getTrackRecordSummary,
  getTrackRecordQuickStats,
  getMonthlyPerformance,
  getSignalOutcomes,
  getMethodologyInfo,
  type TrackRecordSummary,
  type TrackRecordQuickStats,
  type MonthlyPerformance,
  type SignalOutcome,
  type MethodologyInfo,
} from '@/lib/api';
import {
  PerformanceHeader,
  TierPerformanceCard,
  MonthlyChart,
  SignalTable,
  MethodologyCard,
} from '@/components/track-record';
import { RefreshCw, Filter } from 'lucide-react';

export default function TrackRecordPage() {
  const [quickStats, setQuickStats] = useState<TrackRecordQuickStats | null>(null);
  const [summary, setSummary] = useState<TrackRecordSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPerformance[]>([]);
  const [signals, setSignals] = useState<SignalOutcome[]>([]);
  const [methodology, setMethodology] = useState<MethodologyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [days, setDays] = useState(365);
  const [tierFilter, setTierFilter] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsData, summaryData, monthlyData, signalsData, methodData] = await Promise.all([
        getTrackRecordQuickStats(),
        getTrackRecordSummary(days, tierFilter || undefined),
        getMonthlyPerformance(12),
        getSignalOutcomes(days, tierFilter || undefined, outcomeFilter || undefined, 50),
        getMethodologyInfo(),
      ]);

      setQuickStats(statsData);
      setSummary(summaryData);
      setMonthly(monthlyData);
      setSignals(signalsData);
      setMethodology(methodData);
    } catch (err) {
      console.error('Failed to fetch track record data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [days, tierFilter, outcomeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-slate-900">
              GANO Alpha
            </a>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm text-slate-600 hover:text-slate-900">
                Sign In
              </a>
              <a
                href="/signup"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading && !quickStats ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header with Quick Stats */}
            {quickStats && <PerformanceHeader stats={quickStats} />}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Filter size={16} />
                <span>Filters:</span>
              </div>

              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value={180}>Last 6 months</option>
                <option value={365}>Last 12 months</option>
                <option value={730}>Last 24 months</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">All Tiers</option>
                <option value="ENTER">ENTER Only</option>
                <option value="WATCH">WATCH Only</option>
                <option value="AVOID">AVOID Only</option>
              </select>

              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">All Outcomes</option>
                <option value="WIN">Winners</option>
                <option value="LOSS">Losers</option>
                <option value="PENDING">Pending</option>
              </select>

              <button
                onClick={fetchData}
                disabled={isLoading}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Tier Performance Cards */}
            {summary && summary.by_tier.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summary.by_tier.map((tier) => (
                  <TierPerformanceCard key={tier.signal_tier} tier={tier} />
                ))}
              </div>
            )}

            {/* Monthly Chart and Methodology */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MonthlyChart data={monthly} />
              </div>
              {methodology && (
                <div>
                  <MethodologyCard methodology={methodology} />
                </div>
              )}
            </div>

            {/* Signal History Table */}
            <SignalTable signals={signals} />

            {/* Disclaimer */}
            <div className="text-center py-6 text-xs text-slate-400 border-t border-slate-200">
              <p>
                Past performance does not guarantee future results. All signals shown represent
                actual historical recommendations. GANO Alpha is not a registered investment advisor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
