'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, Filter, MessageSquare, ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  getFeedbackTriageQueue,
  getFeedbackStats,
  type FeedbackItem,
  type FeedbackStats,
  type FeedbackStatus,
  type FeedbackType,
  type FeedbackPriority,
} from '@/lib/api';
import {
  FeedbackTriageQueue,
  FeedbackStatsCard,
  FeedbackBreakdown,
} from '@/components/feedback';

// Allowed roles for this page - must match backend require_roles(["admin", "pm"])
const ALLOWED_ROLES = ['admin', 'pm'];

export default function FeedbackTriagePage() {
  const { user, isAuthenticated, loading, getAccessToken } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriority | ''>('');

  // Check role access
  const hasAccess = user && ALLOWED_ROLES.includes(user.role);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!hasAccess) return;

    setIsLoading(true);
    setError(null);

    try {
      const [queueData, statsData] = await Promise.all([
        getFeedbackTriageQueue(getAccessToken, {
          status: statusFilter || undefined,
          feedback_type: typeFilter || undefined,
          priority: priorityFilter || undefined,
          limit: 50,
        }),
        getFeedbackStats(getAccessToken),
      ]);

      setItems(queueData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch feedback data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback data');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, statusFilter, typeFilter, priorityFilter, hasAccess]);

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [fetchData, hasAccess]);

  const handleItemUpdated = (updatedItem: FeedbackItem) => {
    setItems(prev => prev.map(item =>
      item.feedback_id === updatedItem.feedback_id ? updatedItem : item
    ));
    // Refresh stats
    getFeedbackStats(getAccessToken).then(setStats).catch(console.error);
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // Show access denied for users without proper role
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">
            You don&apos;t have permission to access the Feedback Triage page.
            This page is restricted to admin and PM roles.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare size={24} className="text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">Feedback Triage</span>
              </div>
              {user && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  {user.role}
                </span>
              )}
            </div>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mb-8 space-y-4">
            <FeedbackStatsCard stats={stats} />
            <FeedbackBreakdown stats={stats} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | '')}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="triaged">Triaged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won&apos;t Fix</option>
                <option value="duplicate">Duplicate</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as FeedbackType | '')}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Feature Request</option>
                <option value="usability">Usability</option>
                <option value="data_issue">Data Issue</option>
                <option value="general">General</option>
                <option value="praise">Praise</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as FeedbackPriority | '')}
                className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="unset">Unset</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || typeFilter || priorityFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTypeFilter('');
                  setPriorityFilter('');
                }}
                className="self-end px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Triage Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Triage Queue
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({items.length} items)
                </span>
              )}
            </h3>
          </div>

          <FeedbackTriageQueue
            items={items}
            getAccessToken={getAccessToken}
            onItemUpdated={handleItemUpdated}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
