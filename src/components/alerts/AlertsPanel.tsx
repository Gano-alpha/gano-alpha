'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, BellOff, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Link2, CreditCard, Zap, CheckCircle, Clock,
  ChevronRight, Loader2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAlertHistory,
  markAlertRead,
  type AlertHistoryItem,
  type AlertSeverity,
  type AlertType,
} from '@/lib/api';

interface AlertsPanelProps {
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean;
  onManageAlerts?: () => void;
}

const ALERT_TYPE_CONFIG: Record<AlertType, { icon: React.ElementType; color: string }> = {
  fragility_spike: { icon: TrendingUp, color: 'text-red-600' },
  fragility_drop: { icon: TrendingDown, color: 'text-emerald-600' },
  regime_change: { icon: Activity, color: 'text-purple-600' },
  regime_upgrade: { icon: TrendingUp, color: 'text-emerald-600' },
  regime_downgrade: { icon: TrendingDown, color: 'text-red-600' },
  acceleration_warning: { icon: Zap, color: 'text-amber-600' },
  supply_chain_event: { icon: Link2, color: 'text-blue-600' },
  credit_stress: { icon: CreditCard, color: 'text-orange-600' },
  all_warnings: { icon: AlertTriangle, color: 'text-amber-600' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { bg: string; border: string; text: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

// Poll interval for background refresh (60 seconds)
const POLL_INTERVAL_MS = 60000;

export function AlertsPanel({ getAccessToken, isAuthenticated, onManageAlerts }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  // Use ref for getAccessToken to avoid stale closure issues
  const getAccessTokenRef = useRef(getAccessToken);
  getAccessTokenRef.current = getAccessToken;

  const unreadCount = alerts.filter(a => !a.read_at).length;

  const loadAlerts = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const history = await getAlertHistory(getAccessTokenRef.current, { limit: 20 });
      setAlerts(history);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
    } else {
      setAlerts([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadAlerts]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAlerts(false); // Don't show loading spinner on open refresh
    }
  }, [isOpen, isAuthenticated, loadAlerts]);

  // Background polling when panel is open
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const interval = setInterval(() => {
      loadAlerts(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, loadAlerts]);

  const handleMarkRead = async (alertId: string) => {
    // Store previous state for rollback
    const previousAlerts = alerts;

    setMarkingRead(alertId);

    // Optimistic update
    setAlerts(prev => prev.map(a =>
      a.alert_id === alertId ? { ...a, read_at: new Date().toISOString() } : a
    ));

    try {
      await markAlertRead(getAccessTokenRef.current, alertId);
      // Success - optimistic update stands
    } catch (err) {
      console.error('Failed to mark alert read:', err);
      // Rollback on error
      setAlerts(previousAlerts);
    } finally {
      setMarkingRead(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen ? 'bg-slate-200' : 'hover:bg-slate-100'
        )}
        aria-label="Alerts"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-indigo-600" />
                <span className="font-semibold text-slate-900">Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-indigo-600" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600 text-sm">
                  {error}
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm">No alerts yet</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Set up alert subscriptions to get notified
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {alerts.map((alert) => {
                    const typeConfig = ALERT_TYPE_CONFIG[alert.alert_type];
                    const severityConfig = SEVERITY_CONFIG[alert.severity];
                    const Icon = typeConfig?.icon || AlertTriangle;
                    const isUnread = !alert.read_at;

                    return (
                      <div
                        key={alert.alert_id}
                        className={cn(
                          'px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer',
                          isUnread && 'bg-indigo-50/50'
                        )}
                        onClick={() => isUnread && handleMarkRead(alert.alert_id)}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            severityConfig?.bg || 'bg-slate-100'
                          )}>
                            <Icon size={16} className={typeConfig?.color || 'text-slate-600'} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className={cn(
                                'text-sm font-medium truncate',
                                isUnread ? 'text-slate-900' : 'text-slate-600'
                              )}>
                                {alert.title}
                              </h4>
                              {isUnread && (
                                <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded',
                                severityConfig?.bg,
                                severityConfig?.text
                              )}>
                                {alert.severity}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatTime(alert.created_at)}
                              </span>
                              {alert.ticker && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {alert.ticker}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex-shrink-0">
                            {markingRead === alert.alert_id ? (
                              <Loader2 size={14} className="animate-spin text-slate-400" />
                            ) : alert.read_at ? (
                              <CheckCircle size={14} className="text-slate-300" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onManageAlerts?.();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Manage Alert Settings
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
