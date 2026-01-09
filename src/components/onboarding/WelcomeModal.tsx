'use client';

import { useOnboarding } from './OnboardingProvider';
import { Sparkles, ArrowRight, X } from 'lucide-react';

/**
 * Welcome Modal (B5 Onboarding)
 *
 * Shown to first-time users to introduce GANO and offer a guided tour.
 * Designed to minimize time-to-first-insight (< 5 min target).
 */
export function WelcomeModal() {
  const { showWelcome, startTour, skipTour } = useOnboarding();

  if (!showWelcome) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className="w-full max-w-lg mx-4 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-accent/10 via-transparent to-transparent">
          <button
            onClick={skipTour}
            className="absolute top-4 right-4 p-1.5 text-muted hover:text-secondary rounded-lg hover:bg-background/50 transition-colors"
            aria-label="Close welcome dialog"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center" aria-hidden="true">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 id="welcome-modal-title" className="text-xl font-semibold text-primary">Welcome to GANO</h2>
              <p className="text-sm text-muted">Structural Alpha Engine</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          <p className="text-secondary leading-relaxed">
            GANO helps you understand market fragility through a 207,000-edge knowledge graph.
            Ask natural language questions to explore signals, scenarios, and supply chain risks.
          </p>

          {/* Key Features */}
          <div className="space-y-3">
            <FeatureItem
              title="Ask market questions"
              description="Natural language queries about stocks, scenarios, and risks"
            />
            <FeatureItem
              title="Explore signals"
              description="Model-generated signals with conviction scores and evidence"
            />
            <FeatureItem
              title="Simulate shocks"
              description="See how supply chain disruptions propagate through the graph"
            />
          </div>

          {/* Free tier note - placeholder for B3 */}
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="text-xs text-muted">
              <span className="font-medium text-secondary">Free tier:</span>{' '}
              Explore up to 3 tickers with full analysis. Upgrade for unlimited access.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={skipTour}
            className="flex-1 px-4 py-3 text-sm font-medium text-secondary border border-border rounded-lg hover:bg-background transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={startTour}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            Take a quick tour
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-1.5 h-1.5 mt-2 bg-accent rounded-full flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}
