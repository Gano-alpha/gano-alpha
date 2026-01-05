'use client';

import { useState, useEffect } from 'react';
import {
  X, TrendingUp, TrendingDown, Activity, Zap, Link2, CreditCard,
  AlertTriangle, Loader2, CheckCircle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAlertTypes,
  createAlertSubscription,
  type AlertTypeInfo,
  type AlertType,
  type AlertFrequency,
  type ThresholdDirection,
  type AlertSubscription,
} from '@/lib/api';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  getAccessToken: () => Promise<string | null>;
  userEmail: string;
  onCreated: (subscription: AlertSubscription) => void;
}

const ALERT_TYPE_ICONS: Record<AlertType, React.ElementType> = {
  fragility_spike: TrendingUp,
  fragility_drop: TrendingDown,
  regime_change: Activity,
  regime_upgrade: TrendingUp,
  regime_downgrade: TrendingDown,
  acceleration_warning: Zap,
  supply_chain_event: Link2,
  credit_stress: CreditCard,
  all_warnings: AlertTriangle,
};

const ALERT_TYPE_COLORS: Record<AlertType, string> = {
  fragility_spike: 'text-red-600 bg-red-100',
  fragility_drop: 'text-emerald-600 bg-emerald-100',
  regime_change: 'text-purple-600 bg-purple-100',
  regime_upgrade: 'text-emerald-600 bg-emerald-100',
  regime_downgrade: 'text-red-600 bg-red-100',
  acceleration_warning: 'text-amber-600 bg-amber-100',
  supply_chain_event: 'text-blue-600 bg-blue-100',
  credit_stress: 'text-orange-600 bg-orange-100',
  all_warnings: 'text-amber-600 bg-amber-100',
};

export function CreateAlertModal({
  isOpen,
  onClose,
  getAccessToken,
  userEmail,
  onCreated,
}: CreateAlertModalProps) {
  const [alertTypes, setAlertTypes] = useState<AlertTypeInfo[]>([]);
  const [selectedType, setSelectedType] = useState<AlertType | null>(null);
  const [threshold, setThreshold] = useState<string>('');
  const [thresholdDirection, setThresholdDirection] = useState<ThresholdDirection>('above');
  const [ticker, setTicker] = useState('');
  const [frequency, setFrequency] = useState<AlertFrequency>('immediate');
  const [email, setEmail] = useState(userEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedTypeInfo = alertTypes.find(t => t.alert_type === selectedType);

  useEffect(() => {
    if (isOpen) {
      loadAlertTypes();
      setEmail(userEmail);
    }
  }, [isOpen, userEmail]);

  useEffect(() => {
    // Reset form when closing
    if (!isOpen) {
      setTimeout(() => {
        setSelectedType(null);
        setThreshold('');
        setThresholdDirection('above');
        setTicker('');
        setFrequency('immediate');
        setError(null);
        setSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    // Set default threshold when type changes
    if (selectedTypeInfo?.default_threshold !== null && selectedTypeInfo?.default_threshold !== undefined) {
      setThreshold((selectedTypeInfo.default_threshold * 100).toString());
    } else {
      setThreshold('');
    }
  }, [selectedType]);

  const loadAlertTypes = async () => {
    setIsLoading(true);
    try {
      const types = await getAlertTypes();
      setAlertTypes(types);
    } catch (err) {
      console.error('Failed to load alert types:', err);
      setError('Failed to load alert types');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !email) {
      setError('Please select an alert type and provide an email');
      return;
    }

    if (selectedTypeInfo?.requires_threshold && !threshold) {
      setError('Please set a threshold value');
      return;
    }

    if (selectedTypeInfo?.requires_ticker && !ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const subscription = await createAlertSubscription(getAccessToken, {
        alert_type: selectedType,
        email,
        threshold_value: selectedTypeInfo?.requires_threshold
          ? parseFloat(threshold) / 100
          : undefined,
        threshold_direction: selectedTypeInfo?.requires_threshold
          ? thresholdDirection
          : undefined,
        ticker: selectedTypeInfo?.requires_ticker
          ? ticker.toUpperCase().trim()
          : undefined,
        frequency,
      });

      setSuccess(true);
      onCreated(subscription);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to create subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create Alert Subscription</h2>
            <p className="text-sm text-slate-500">Get notified when market conditions change</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Alert Created!</h3>
            <p className="text-slate-600">You will receive notifications at {email}</p>
          </div>
        ) : (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                </div>
              ) : (
                <>
                  {/* Alert Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Select Alert Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {alertTypes.map((type) => {
                        const Icon = ALERT_TYPE_ICONS[type.alert_type];
                        const colorClass = ALERT_TYPE_COLORS[type.alert_type];
                        const isSelected = selectedType === type.alert_type;

                        return (
                          <button
                            key={type.alert_type}
                            onClick={() => setSelectedType(type.alert_type)}
                            className={cn(
                              'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                              colorClass.split(' ')[1]
                            )}>
                              <Icon size={20} className={colorClass.split(' ')[0]} />
                            </div>
                            <div className="min-w-0">
                              <h4 className={cn(
                                'font-medium',
                                isSelected ? 'text-indigo-900' : 'text-slate-900'
                              )}>
                                {type.label}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {type.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Configuration */}
                  {selectedType && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      {/* Threshold */}
                      {selectedTypeInfo?.requires_threshold && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Threshold (%)
                          </label>
                          <div className="flex items-center gap-3">
                            <select
                              value={thresholdDirection}
                              onChange={(e) => setThresholdDirection(e.target.value as ThresholdDirection)}
                              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="above">Above</option>
                              <option value="below">Below</option>
                              <option value="any">Any crossing</option>
                            </select>
                            <input
                              type="number"
                              value={threshold}
                              onChange={(e) => setThreshold(e.target.value)}
                              min="0"
                              max="100"
                              step="1"
                              placeholder="50"
                              className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-slate-500">%</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Info size={12} />
                            Alert when fragility {thresholdDirection === 'any' ? 'crosses' : `goes ${thresholdDirection}`} {threshold || '50'}%
                          </p>
                        </div>
                      )}

                      {/* Ticker */}
                      {selectedTypeInfo?.requires_ticker && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Ticker Symbol
                          </label>
                          <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            placeholder="AAPL"
                            maxLength={10}
                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 uppercase"
                          />
                        </div>
                      )}

                      {/* Frequency */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Notification Frequency
                        </label>
                        <div className="flex gap-2">
                          {[
                            { value: 'immediate', label: 'Immediate', desc: 'Get notified right away' },
                            { value: 'daily_digest', label: 'Daily Digest', desc: 'Once per day summary' },
                            { value: 'weekly_digest', label: 'Weekly Digest', desc: 'Once per week summary' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setFrequency(option.value as AlertFrequency)}
                              className={cn(
                                'flex-1 p-3 rounded-lg border-2 text-left transition-all',
                                frequency === option.value
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              )}
                            >
                              <span className={cn(
                                'text-sm font-medium block',
                                frequency === option.value ? 'text-indigo-900' : 'text-slate-900'
                              )}>
                                {option.label}
                              </span>
                              <span className="text-xs text-slate-500">{option.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedType}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
                  isSubmitting || !selectedType
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                )}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Alert'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
