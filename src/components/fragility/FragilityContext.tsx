'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

// Types
export interface FragilityState {
  score: number;
  regime: 'CALM' | 'NORMAL' | 'ELEVATED' | 'STRESSED' | 'CRISIS';
  delta_24h: number;
  delta_7d: number;
  is_accelerating: boolean;
  warning_flags: string[];
  last_updated: string;
}

export interface InjectionDecision {
  should_inject: boolean;
  placement: 'header' | 'sidebar' | 'footnote' | 'inline' | 'none';
  content_type: 'badge_only' | 'badge_with_delta' | 'full_context' | 'warning';
  reason: string;
}

// Context
interface FragilityContextType {
  fragility: FragilityState | null;
  loading: boolean;
  error: string | null;
  evaluateInjection: (queryIntent: string, tickers?: string[]) => InjectionDecision;
}

const FragilityContext = createContext<FragilityContextType | undefined>(undefined);

// Provider
export function FragilityProvider({ children }: { children: ReactNode }) {
  const [fragility, setFragility] = useState<FragilityState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFragility() {
      try {
        const res = await fetch(`${API_BASE}/api/fragility-integration/context`);
        if (res.ok) {
          const data = await res.json();
          setFragility({
            score: data.score,
            regime: data.regime,
            delta_24h: data.delta_24h,
            delta_7d: data.delta_7d,
            is_accelerating: data.delta_24h > 5,
            warning_flags: [],
            last_updated: new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch fragility');
      } finally {
        setLoading(false);
      }
    }

    fetchFragility();
    const interval = setInterval(fetchFragility, 60000);
    return () => clearInterval(interval);
  }, []);

  const evaluateInjection = (queryIntent: string, tickers?: string[]): InjectionDecision => {
    if (!fragility) {
      return { should_inject: false, placement: 'none', content_type: 'badge_only', reason: 'No fragility data' };
    }

    // RULE 1: Always inject for transparency questions
    if (queryIntent === 'transparency') {
      return { should_inject: true, placement: 'inline', content_type: 'full_context', reason: 'Transparency request' };
    }

    // RULE 2: Always inject for general market questions
    if (queryIntent === 'general_market') {
      return { should_inject: true, placement: 'sidebar', content_type: 'full_context', reason: 'Market overview' };
    }

    // RULE 3: Warning injection for stressed/crisis
    if (fragility.regime === 'STRESSED' || fragility.regime === 'CRISIS') {
      return { should_inject: true, placement: 'header', content_type: 'warning', reason: `${fragility.regime} regime` };
    }

    // RULE 4: Inject when accelerating (early warning)
    if (fragility.is_accelerating && fragility.delta_24h > 10) {
      return { should_inject: true, placement: 'footnote', content_type: 'badge_with_delta', reason: 'Accelerating fragility' };
    }

    // RULE 5: Deep dive always gets fragility exposure
    if (queryIntent === 'deep_dive') {
      return { should_inject: true, placement: 'inline', content_type: 'full_context', reason: 'Deep dive context' };
    }

    // RULE 6: Elevated regime + signal questions = footnote
    if (fragility.regime === 'ELEVATED' && ['signal_lookup', 'top_n', 'comparison'].includes(queryIntent)) {
      return { should_inject: true, placement: 'footnote', content_type: 'badge_with_delta', reason: 'Elevated regime warning' };
    }

    // DEFAULT: No injection for calm/normal + basic queries
    return { should_inject: false, placement: 'none', content_type: 'badge_only', reason: 'Default - no injection needed' };
  };

  return (
    <FragilityContext.Provider value={{ fragility, loading, error, evaluateInjection }}>
      {children}
    </FragilityContext.Provider>
  );
}

// Hook
export function useFragility() {
  const context = useContext(FragilityContext);
  if (context === undefined) {
    throw new Error('useFragility must be used within a FragilityProvider');
  }
  return context;
}

// Regime Configuration
const REGIME_CONFIG = {
  CALM: { color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
  NORMAL: { color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
  ELEVATED: { color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-500' },
  STRESSED: { color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-500' },
  CRISIS: { color: 'text-red-900', bgColor: 'bg-red-200', borderColor: 'border-red-700' },
};

// UI Components for injection

/**
 * Regime badge - shows current regime
 */
export function RegimeBadge({ regime, size = 'md' }: { regime: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = REGIME_CONFIG[regime as keyof typeof REGIME_CONFIG] || REGIME_CONFIG.NORMAL;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <Badge className={`${config.bgColor} ${config.color} ${sizeClasses[size]}`}>
      {regime}
    </Badge>
  );
}

/**
 * Delta badge - shows change with direction
 */
export function DeltaBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 1;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
    ? 'text-red-600'
    : 'text-green-600';

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${colorClass}`}>
      <Icon className="h-4 w-4" />
      {isPositive ? '+' : ''}{value.toFixed(1)}
      {label && <span className="text-muted-foreground ml-1">{label}</span>}
    </span>
  );
}

/**
 * Fragility sidebar - full context display
 */
export function FragilitySidebar({ fragility }: { fragility: FragilityState }) {
  const config = REGIME_CONFIG[fragility.regime] || REGIME_CONFIG.NORMAL;

  return (
    <aside className={`p-4 rounded-lg border-l-4 ${config.borderColor} bg-muted/30`}>
      <div className="flex items-center gap-2 mb-2">
        <RegimeBadge regime={fragility.regime} size="sm" />
        <DeltaBadge value={fragility.delta_24h} label="24h" />
      </div>
      <p className="text-sm text-muted-foreground">
        {getRegimeDescription(fragility.regime)}
      </p>
      {fragility.warning_flags.length > 0 && (
        <div className="mt-2 space-y-1">
          {fragility.warning_flags.map((flag, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {flag}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

/**
 * Fragility footnote - minimal context
 */
export function FragilityFootnote({ fragility }: { fragility: FragilityState }) {
  const config = REGIME_CONFIG[fragility.regime] || REGIME_CONFIG.NORMAL;

  return (
    <div className={`flex items-center gap-2 p-2 text-sm rounded ${config.bgColor} ${config.color}`}>
      <Info className="h-4 w-4" />
      <span>
        Market fragility: {fragility.regime} ({fragility.score.toFixed(0)}/100)
        {Math.abs(fragility.delta_24h) >= 5 && (
          <span className="ml-2">
            <DeltaBadge value={fragility.delta_24h} />
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Fragility warning header - for stressed/crisis
 */
export function FragilityWarning({ fragility }: { fragility: FragilityState }) {
  if (fragility.regime !== 'STRESSED' && fragility.regime !== 'CRISIS') {
    return null;
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">
          {fragility.regime === 'CRISIS' ? 'Crisis Alert' : 'Elevated Stress Warning'}
        </p>
        <p className="text-sm mt-1">
          {fragility.regime === 'CRISIS'
            ? 'Crisis-level market fragility detected. Historical correlations may not hold. Exercise extreme caution.'
            : 'Significant market stress detected. Position sizing and timing matter more than usual.'}
        </p>
      </div>
    </div>
  );
}

// Helper functions
function getRegimeDescription(regime: string): string {
  const descriptions: Record<string, string> = {
    CALM: 'Market conditions are relatively stable.',
    NORMAL: 'Market conditions are within normal parameters.',
    ELEVATED: 'Market fragility is elevated—conditions favor caution.',
    STRESSED: 'Significant market stress detected—heightened volatility likely.',
    CRISIS: 'Crisis-level fragility—extreme caution warranted.',
  };
  return descriptions[regime] || descriptions.NORMAL;
}

export default FragilityProvider;
