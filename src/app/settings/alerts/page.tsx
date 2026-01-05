'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, ArrowLeft, Plus, RefreshCw, Loader2, ShieldAlert,
  BellOff, History, Settings2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  getAlertSubscriptions,
  getAlertHistory,
  type AlertSubscription,
  type AlertHistoryItem,
} from '@/lib/api';
import {
  AlertSubscriptionCard,
  CreateAlertModal,
} from '@/components/alerts';

type TabType = 'subscriptions' | 'history';

export default function AlertSettingsPage() {
  const { user, isAuthenticated, loading, getAccessToken } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const [subs, hist] = await Promise.all([
        getAlertSubscriptions(getAccessToken, true),
        getAlertHistory(getAccessToken, { limit: 50 }),
      ]);
      setSubscriptions(subs);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to fetch alert data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alert data');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  const handleSubscriptionUpdate = (updated: AlertSubscription) => {
    setSubscriptions(prev =>
      prev.map(s => s.subscription_id === updated.subscription_id ? updated : s)
    );
  };

  const handleSubscriptionDelete = (subscriptionId: string) => {
    setSubscriptions(prev => prev.filter(s => s.subscription_id !== subscriptionId));
  };

  const handleSubscriptionCreated = (newSub: AlertSubscription) => {
    setSubscriptions(prev => [newSub, ...prev]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading state
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

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell size={24} className="text-indigo-600" />
                <span className="text-xl font-bold text-slate-900">Alert Settings</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} className={cn('text-slate-600', isLoading && 'animate-spin')} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                New Alert
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'subscriptions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Settings2 size={16} />
            Subscriptions
            {subscriptions.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                {subscriptions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <History size={16} />
            History
            {history.length > 0 && (
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : activeTab === 'subscriptions' ? (
          /* Subscriptions Tab */
          subscriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <BellOff size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Alert Subscriptions</h3>
              <p className="text-slate-500 mb-6">
                Create your first alert to get notified about market changes
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                Create Alert
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <AlertSubscriptionCard
                  key={subscription.subscription_id}
                  subscription={subscription}
                  getAccessToken={getAccessToken}
                  onUpdate={handleSubscriptionUpdate}
                  onDelete={handleSubscriptionDelete}
                />
              ))}
            </div>
          )
        ) : (
          /* History Tab */
          history.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <History size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Alert History</h3>
              <p className="text-slate-500">
                Alerts you receive will appear here
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                      Alert
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                      Severity
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                      Value
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((alert) => (
                    <tr key={alert.alert_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{alert.message}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          alert.severity === 'critical' && 'bg-red-100 text-red-700',
                          alert.severity === 'high' && 'bg-orange-100 text-orange-700',
                          alert.severity === 'warning' && 'bg-amber-100 text-amber-700',
                          alert.severity === 'info' && 'bg-blue-100 text-blue-700',
                        )}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {alert.triggered_value !== null ? (
                          <span className="text-sm text-slate-900">
                            {(alert.triggered_value * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full',
                          alert.delivery_status === 'delivered' && 'bg-emerald-100 text-emerald-700',
                          alert.delivery_status === 'sent' && 'bg-blue-100 text-blue-700',
                          alert.delivery_status === 'pending' && 'bg-amber-100 text-amber-700',
                          alert.delivery_status === 'failed' && 'bg-red-100 text-red-700',
                          alert.delivery_status === 'skipped' && 'bg-slate-100 text-slate-600',
                        )}>
                          {alert.delivery_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(alert.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Create Modal */}
      <CreateAlertModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        getAccessToken={getAccessToken}
        userEmail={user?.email || ''}
        onCreated={handleSubscriptionCreated}
      />
    </div>
  );
}
