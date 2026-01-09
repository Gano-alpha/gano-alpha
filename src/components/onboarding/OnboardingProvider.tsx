'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// ============================================================================
// Types
// ============================================================================

interface OnboardingState {
  hasCompletedTour: boolean;
  hasSeenWelcome: boolean;
  tourStep: number;
  // Future: ToS acceptance for B19
  hasAcceptedToS: boolean;
  tosAcceptedAt: string | null;
}

interface OnboardingContextValue {
  state: OnboardingState;
  startTour: () => void;
  skipTour: () => void;
  resetTour: () => void;
  showWelcome: boolean;
  dismissWelcome: () => void;
  // Future: ToS acceptance for B19
  acceptToS: () => void;
}

const STORAGE_KEY = 'gano_onboarding';
const _ONBOARDING_VERSION = '1.0'; // Reserved for future schema migrations (prefixed to suppress unused warning)

const defaultState: OnboardingState = {
  hasCompletedTour: false,
  hasSeenWelcome: false,
  tourStep: 0,
  hasAcceptedToS: false,
  tosAcceptedAt: null,
};

// ============================================================================
// Tour Steps Configuration
// ============================================================================

const TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="chat-input"]',
    popover: {
      title: 'Ask Anything',
      description: 'Type natural language questions about stocks, market scenarios, or risk analysis. Try "What should I buy today?" or "Fed cuts rates - who benefits?"',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="example-questions"]',
    popover: {
      title: 'Quick Start Questions',
      description: 'Click any of these pre-built questions to instantly explore GANO\'s capabilities. Great for getting started.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="thread-list"]',
    popover: {
      title: 'Conversation Threads',
      description: 'Your conversations are saved here. Start new threads to explore different topics, or continue previous analyses.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="context-panel"]',
    popover: {
      title: 'Live Market Context',
      description: 'Real-time VIX, rates, and top signals. This panel shows the current market regime and active model signals.',
      side: 'left',
      align: 'start',
    },
  },
];

// ============================================================================
// Context
// ============================================================================

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [showWelcome, setShowWelcome] = useState(false);
  const [mounted, setMounted] = useState(false);
  const driverRef = useRef<Driver | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
        // Show welcome if user hasn't seen it yet
        if (!parsed.hasSeenWelcome && !parsed.hasCompletedTour) {
          setShowWelcome(true);
        }
      } else {
        // First time user - show welcome
        setShowWelcome(true);
      }
    } catch (e) {
      console.error('Failed to load onboarding state:', e);
      setShowWelcome(true);
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: OnboardingState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
  }, []);

  // Initialize driver.js
  const initDriver = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    driverRef.current = driver({
      showProgress: true,
      steps: TOUR_STEPS,
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Get Started',
      progressText: '{{current}} of {{total}}',
      popoverClass: 'gano-tour-popover',
      onDestroyed: () => {
        saveState({
          ...state,
          hasCompletedTour: true,
          hasSeenWelcome: true,
        });
      },
      onDestroyStarted: () => {
        // User manually closed the tour
        if (driverRef.current && !driverRef.current.hasNextStep()) {
          // Completed all steps
          saveState({
            ...state,
            hasCompletedTour: true,
            hasSeenWelcome: true,
          });
        }
      },
    });

    return driverRef.current;
  }, [state, saveState]);

  // Start the tour
  const startTour = useCallback(() => {
    setShowWelcome(false);
    saveState({ ...state, hasSeenWelcome: true });

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const d = initDriver();
      d.drive();
    }, 100);
  }, [state, saveState, initDriver]);

  // Skip the tour
  const skipTour = useCallback(() => {
    setShowWelcome(false);
    saveState({
      ...state,
      hasSeenWelcome: true,
      hasCompletedTour: true,
    });
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  }, [state, saveState]);

  // Reset tour (for testing/re-onboarding)
  const resetTour = useCallback(() => {
    saveState(defaultState);
    setShowWelcome(true);
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  }, [saveState]);

  // Dismiss welcome modal
  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    saveState({ ...state, hasSeenWelcome: true });
  }, [state, saveState]);

  // Future: ToS acceptance for B19
  const acceptToS = useCallback(() => {
    saveState({
      ...state,
      hasAcceptedToS: true,
      tosAcceptedAt: new Date().toISOString(),
    });
  }, [state, saveState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startTour,
        skipTour,
        resetTour,
        showWelcome,
        dismissWelcome,
        acceptToS,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
