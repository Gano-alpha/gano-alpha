"use client";

import { useState } from "react";
import { Zap, Shield, BarChart3, Network, AlertTriangle, Calendar, X } from "lucide-react";

interface Signal {
  model: 'OG' | 'Sniper';
  direction: 'long' | 'short' | 'neutral';
  conviction: number;
  headline: string;
  reasoning?: string[];
}

interface Factor {
  name: string;
  beta: number;
  rSquared: number;
}

interface Risk {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface Event {
  type: string;
  date: string;
  description: string;
}

interface TickerDeepDiveBlockProps {
  ticker: string;
  signals?: Signal[];
  factors?: Factor[];
  risks?: Risk[];
  events?: Event[];
  onClose?: () => void;
  className?: string;
}

type TabType = 'signals' | 'factors' | 'structure' | 'risk' | 'events';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'signals', label: 'Signals', icon: <Zap size={14} /> },
  { id: 'factors', label: 'Factors', icon: <BarChart3 size={14} /> },
  { id: 'structure', label: 'Structure', icon: <Network size={14} /> },
  { id: 'risk', label: 'Risk', icon: <AlertTriangle size={14} /> },
  { id: 'events', label: 'Events', icon: <Calendar size={14} /> },
];

/**
 * Ticker Deep Dive Block
 *
 * Purpose: Single-ticker truth surface. Everything relevant, nothing extraneous.
 * Tabs: Signals, Factors, Structure, Risk, Events
 */
export function TickerDeepDiveBlock({
  ticker,
  signals = [],
  factors = [],
  risks = [],
  events = [],
  onClose,
  className = ""
}: TickerDeepDiveBlockProps) {
  const [activeTab, setActiveTab] = useState<TabType>('signals');

  return (
    <div
      className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}
      style={{ animation: 'fade-slide-in 0.3s ease-out forwards' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-background/50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg text-primary font-bold">{ticker}</span>
          <span className="text-xs text-muted">Deep Dive</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-secondary transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent bg-accent/5'
                : 'text-muted hover:text-secondary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Signals Tab */}
        {activeTab === 'signals' && (
          <div className="space-y-3" style={{ animation: 'fade-slide-in 0.2s ease-out forwards' }}>
            {signals.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {signals.map((signal, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      signal.model === 'OG'
                        ? 'border-blue-500/20 bg-blue-500/5'
                        : 'border-purple-500/20 bg-purple-500/5'
                    }`}
                    style={{
                      animationDelay: `${i * 100}ms`,
                      animation: 'fade-slide-in 0.2s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {signal.model === 'OG' ? (
                        <Shield size={14} className="text-blue-400" />
                      ) : (
                        <Zap size={14} className="text-purple-400" />
                      )}
                      <span className={`text-xs font-medium ${
                        signal.model === 'OG' ? 'text-blue-400' : 'text-purple-400'
                      }`}>
                        {signal.model} ({signal.model === 'OG' ? 'Defensive' : 'Aggressive'})
                      </span>
                    </div>
                    <p className="text-sm text-primary font-medium mb-1">
                      {signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)}. Conviction {signal.conviction.toFixed(2)}
                    </p>
                    <p className="text-xs text-secondary">{signal.headline}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-8">No active signals for {ticker}.</p>
            )}
          </div>
        )}

        {/* Factors Tab */}
        {activeTab === 'factors' && (
          <div className="space-y-2" style={{ animation: 'fade-slide-in 0.2s ease-out forwards' }}>
            {factors.length > 0 ? (
              factors.map((factor, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animation: 'fade-slide-in 0.2s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <span className="text-sm text-secondary">{factor.name}</span>
                  <div className="flex items-center gap-4 font-mono text-sm">
                    <span className={factor.beta < 0 ? 'text-teal' : 'text-red-400'}>
                      β {factor.beta.toFixed(2)}
                    </span>
                    <span className="text-muted">r² {factor.rSquared.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted text-center py-8">No factor data available.</p>
            )}
          </div>
        )}

        {/* Structure Tab */}
        {activeTab === 'structure' && (
          <div
            className="text-center py-8"
            style={{ animation: 'fade-slide-in 0.2s ease-out forwards' }}
          >
            <Network size={32} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">Supply chain graph visualization.</p>
            <p className="text-xs text-muted mt-1">Coming from get_ticker_ecosystem.</p>
          </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-2" style={{ animation: 'fade-slide-in 0.2s ease-out forwards' }}>
            {risks.length > 0 ? (
              risks.map((risk, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    risk.severity === 'high' ? 'border-red-500/30 bg-red-500/5' :
                    risk.severity === 'medium' ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-border bg-background/50'
                  }`}
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animation: 'fade-slide-in 0.2s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className={
                      risk.severity === 'high' ? 'text-red-400' :
                      risk.severity === 'medium' ? 'text-amber-400' :
                      'text-muted'
                    } />
                    <span className="text-xs font-medium text-secondary">{risk.type}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      risk.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      risk.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-muted/20 text-muted'
                    }`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{risk.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted text-center py-8">No active risk alerts.</p>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-2" style={{ animation: 'fade-slide-in 0.2s ease-out forwards' }}>
            {events.length > 0 ? (
              events.map((event, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-background/50 rounded-lg"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animation: 'fade-slide-in 0.2s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <Calendar size={14} className="text-muted mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-secondary">{event.type}</span>
                      <span className="text-[10px] text-muted">{event.date}</span>
                    </div>
                    <p className="text-sm text-muted">{event.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted text-center py-8">No upcoming events.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
