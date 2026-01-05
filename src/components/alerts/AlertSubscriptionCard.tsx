'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Zap, Link2, CreditCard,
  AlertTriangle, Bell, Trash2, Loader2, ToggleLeft, ToggleRight,
  Clock, Edit2, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  updateAlertSubscription,
  deleteAlertSubscription,
  type AlertSubscription,
  type AlertType,
  type AlertFrequency,
} from '@/lib/api';

interface AlertSubscriptionCardProps {
  subscription: AlertSubscription;
  getAccessToken: () => Promise<string | null>;
  onUpdate: (updated: AlertSubscription) => void;
  onDelete: (subscriptionId: string) => void;
}

const ALERT_TYPE_CONFIG: Record<AlertType, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}> = {
  fragility_spike: {
    icon: TrendingUp,
    label: 'Fragility Spike',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  fragility_drop: {
    icon: TrendingDown,
    label: 'Fragility Drop',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  regime_change: {
    icon: Activity,
    label: 'Regime Change',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  regime_upgrade: {
    icon: TrendingUp,
    label: 'Regime Upgrade',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  regime_downgrade: {
    icon: TrendingDown,
    label: 'Regime Downgrade',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  acceleration_warning: {
    icon: Zap,
    label: 'Acceleration Warning',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  supply_chain_event: {
    icon: Link2,
    label: 'Supply Chain Event',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  credit_stress: {
    icon: CreditCard,
    label: 'Credit Stress',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  all_warnings: {
    icon: AlertTriangle,
    label: 'All Warnings',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
};

const FREQUENCY_LABELS: Record<AlertFrequency, string> = {
  immediate: 'Immediate',
  daily_digest: 'Daily Digest',
  weekly_digest: 'Weekly Digest',
};

export function AlertSubscriptionCard({
  subscription,
  getAccessToken,
  onUpdate,
  onDelete,
}: AlertSubscriptionCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(
    subscription.threshold_value?.toString() || ''
  );

  const config = ALERT_TYPE_CONFIG[subscription.alert_type];
  const Icon = config?.icon || Bell;

  const handleToggleEnabled = async () => {
    setIsUpdating(true);
    try {
      const updated = await updateAlertSubscription(
        getAccessToken,
        subscription.subscription_id,
        { enabled: !subscription.enabled }
      );
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to toggle subscription:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrequencyChange = async (frequency: AlertFrequency) => {
    setIsUpdating(true);
    try {
      const updated = await updateAlertSubscription(
        getAccessToken,
        subscription.subscription_id,
        { frequency }
      );
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update frequency:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleThresholdSave = async () => {
    const value = parseFloat(thresholdValue);
    if (isNaN(value) || value < 0 || value > 1) {
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateAlertSubscription(
        getAccessToken,
        subscription.subscription_id,
        { threshold_value: value }
      );
      onUpdate(updated);
      setEditingThreshold(false);
    } catch (err) {
      console.error('Failed to update threshold:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAlertSubscription(getAccessToken, subscription.subscription_id);
      onDelete(subscription.subscription_id);
    } catch (err) {
      console.error('Failed to delete subscription:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn(
      'bg-white border rounded-xl p-4 transition-all',
      subscription.enabled
        ? 'border-slate-200 shadow-sm'
        : 'border-slate-100 bg-slate-50 opacity-75'
    )}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
          config?.bgColor || 'bg-slate-100'
        )}>
          <Icon size={24} className={config?.color || 'text-slate-600'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">
              {config?.label || subscription.alert_type}
            </h3>
            {subscription.ticker && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {subscription.ticker}
              </span>
            )}
            {!subscription.enabled && (
              <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                Paused
              </span>
            )}
          </div>

          {/* Threshold */}
          {subscription.threshold_value !== null && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-500">Threshold:</span>
              {editingThreshold ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-20 text-sm border border-slate-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={handleThresholdSave}
                    disabled={isUpdating}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingThreshold(false);
                      setThresholdValue(subscription.threshold_value?.toString() || '');
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingThreshold(true)}
                  className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-2 py-0.5 rounded"
                >
                  {(subscription.threshold_value * 100).toFixed(0)}%
                  <Edit2 size={12} />
                </button>
              )}
              {subscription.threshold_direction && (
                <span className="text-xs text-slate-400">
                  ({subscription.threshold_direction})
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Bell size={12} />
              {subscription.trigger_count} triggered
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Last: {formatDate(subscription.last_triggered_at)}
            </span>
          </div>

          {/* Frequency */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Frequency:</span>
            <div className="flex gap-1">
              {(['immediate', 'daily_digest', 'weekly_digest'] as AlertFrequency[]).map((freq) => (
                <button
                  key={freq}
                  onClick={() => handleFrequencyChange(freq)}
                  disabled={isUpdating}
                  className={cn(
                    'text-xs px-2 py-1 rounded-full transition-colors',
                    subscription.frequency === freq
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {FREQUENCY_LABELS[freq]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={handleToggleEnabled}
            disabled={isUpdating}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              subscription.enabled
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-slate-400 hover:bg-slate-100'
            )}
            title={subscription.enabled ? 'Pause alerts' : 'Resume alerts'}
          >
            {isUpdating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : subscription.enabled ? (
              <ToggleRight size={20} />
            ) : (
              <ToggleLeft size={20} />
            )}
          </button>

          {/* Delete */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete subscription"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
