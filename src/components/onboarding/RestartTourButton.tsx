'use client';

import { HelpCircle } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

/**
 * Button to restart the onboarding tour (B5)
 *
 * Shown in the header for users who want to see the tour again.
 */
export function RestartTourButton() {
  const { resetTour, state } = useOnboarding();

  // Only show if user has completed the tour
  if (!state.hasCompletedTour) return null;

  return (
    <button
      onClick={resetTour}
      className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted hover:text-secondary rounded-lg hover:bg-surface transition-colors"
      title="Restart tour"
    >
      <HelpCircle size={12} />
      <span className="hidden sm:inline">Tour</span>
    </button>
  );
}
