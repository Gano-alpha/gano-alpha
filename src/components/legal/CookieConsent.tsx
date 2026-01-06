'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, Settings, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Cookie consent storage key
const CONSENT_KEY = 'gano_cookie_consent';
const CONSENT_VERSION = '1.0'; // Bump to re-prompt users after policy changes

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  version: string;
  timestamp: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
  timestamp: '',
};

/**
 * Cookie Consent Banner (B21)
 *
 * GDPR-compliant cookie consent with:
 * - Accept all / Reject non-essential options
 * - Granular preferences modal
 * - Persisted to localStorage
 * - Re-prompts if consent version changes
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check for existing consent
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        // Check if consent version matches (re-prompt if outdated)
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed);
          return; // Valid consent exists, don't show banner
        }
      } catch {
        // Invalid stored data, show banner
      }
    }
    // No valid consent, show banner after brief delay
    const timer = setTimeout(() => setShowBanner(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const consent: CookiePreferences = {
      ...prefs,
      necessary: true, // Always true
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setPreferences(consent);
    setShowBanner(false);
    setShowPreferences(false);

    // Dispatch event for analytics to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: consent }));
  };

  const handleAcceptAll = () => {
    saveConsent({
      ...DEFAULT_PREFERENCES,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      ...DEFAULT_PREFERENCES,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner && !showPreferences) {
    return null;
  }

  return (
    <>
      {/* Main Banner */}
      {showBanner && !showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon and Text */}
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Cookie size={20} className="text-indigo-600" />
                </div>
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-900 mb-1">We use cookies</p>
                  <p>
                    We use cookies to improve your experience and analyze site usage.
                    You can accept all cookies, reject non-essential ones, or customize your preferences.{' '}
                    <Link href="/cookies" className="text-indigo-600 hover:underline">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  Customize
                </button>
                <button
                  onClick={handleRejectNonEssential}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cookie size={24} className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">Cookie Preferences</h2>
              </div>
              <button
                onClick={() => {
                  setShowPreferences(false);
                  setShowBanner(true);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-sm text-slate-600">
                We use different types of cookies to optimize your experience on our site.
                Click on the categories below to learn more and customize your preferences.
              </p>

              {/* Necessary Cookies */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Necessary Cookies</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    Always Active
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  These cookies are essential for the website to function properly.
                  They enable core functionality such as security, authentication, and accessibility.
                  You cannot disable these cookies.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Analytics Cookies</h3>
                  <button
                    onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      preferences.analytics ? 'bg-indigo-600' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                        preferences.analytics ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>
                <p className="text-sm text-slate-500">
                  These cookies help us understand how visitors interact with our website.
                  We use this data to improve our services and user experience.
                  This includes tools like Vercel Analytics.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Marketing Cookies</h3>
                  <button
                    onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                    className={cn(
                      'relative w-12 h-6 rounded-full transition-colors',
                      preferences.marketing ? 'bg-indigo-600' : 'bg-slate-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                        preferences.marketing ? 'left-7' : 'left-1'
                      )}
                    />
                  </button>
                </div>
                <p className="text-sm text-slate-500">
                  These cookies are used to track visitors across websites.
                  The intention is to display ads that are relevant and engaging.
                  Currently, we do not use marketing cookies, but this may change in the future.
                </p>
              </div>

              <div className="text-sm text-slate-500">
                <Link
                  href="/cookies"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  Read our full Cookie Policy
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Check size={16} />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Hook to get current cookie preferences
 */
export function useCookieConsent(): CookiePreferences | null {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }

    // Listen for consent changes
    const handler = (e: CustomEvent<CookiePreferences>) => {
      setConsent(e.detail);
    };
    window.addEventListener('cookieConsentChanged', handler as EventListener);
    return () => window.removeEventListener('cookieConsentChanged', handler as EventListener);
  }, []);

  return consent;
}

/**
 * Small button to re-open cookie preferences (for footer)
 */
export function CookiePreferencesButton({ className }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);

  const handleOpen = () => {
    // Clear stored consent to force banner/modal to show
    // Actually, we want to just show the preferences modal
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          'text-sm text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1',
          className
        )}
      >
        <Cookie size={14} />
        Cookie Settings
      </button>
      {showModal && (
        <CookiePreferencesModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

/**
 * Standalone preferences modal (for footer link)
 */
function CookiePreferencesModal({ onClose }: { onClose: () => void }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const handleSave = () => {
    const consent: CookiePreferences = {
      ...preferences,
      necessary: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: consent }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cookie size={24} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">Cookie Preferences</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Necessary */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">Necessary Cookies</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                Always Active
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Essential for the website to function properly.
            </p>
          </div>

          {/* Analytics */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">Analytics Cookies</h3>
              <button
                onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  preferences.analytics ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                    preferences.analytics ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Help us understand how visitors interact with our website.
            </p>
          </div>

          {/* Marketing */}
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">Marketing Cookies</h3>
              <button
                onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  preferences.marketing ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow',
                    preferences.marketing ? 'left-7' : 'left-1'
                  )}
                />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Used to display relevant advertisements.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            <Check size={16} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
