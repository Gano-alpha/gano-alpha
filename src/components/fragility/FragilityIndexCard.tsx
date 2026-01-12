'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

interface FragilityData {
  score: number;
  regime: string;
  delta_24h: number;
  delta_7d: number;
  warning_flags: { flag: string; description: string; severity: string }[];
  components: { name: string; value: number; weight: number }[];
  last_updated: string;
}

// Regime configuration
const REGIME_CONFIG: Record<string, { color: string; bgColor: string; description: string }> = {
  CALM: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Market conditions are relatively stable.',
  },
  NORMAL: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Market conditions are within normal parameters.',
  },
  ELEVATED: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Market fragility is elevated—conditions favor caution.',
  },
  STRESSED: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Significant market stress detected—heightened volatility likely.',
  },
  CRISIS: {
    color: 'text-red-900',
    bgColor: 'bg-red-200',
    description: 'Crisis-level fragility—extreme caution warranted.',
  },
};

interface FragilityIndexCardProps {
  compact?: boolean;
  showComponents?: boolean;
  showWarnings?: boolean;
  className?: string;
}

export function FragilityIndexCard({
  compact = false,
  showComponents = true,
  showWarnings = true,
  className = '',
}: FragilityIndexCardProps) {
  const [data, setData] = useState<FragilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFragility() {
      try {
        const res = await fetch(`${API_BASE}/api/fragility-dashboard/hero`);
        if (!res.ok) throw new Error('Failed to fetch fragility');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchFragility();

    // Refresh every 60 seconds
    const interval = setInterval(fetchFragility, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Unable to load fragility index</p>
        </CardContent>
      </Card>
    );
  }

  const regime = data.regime || 'NORMAL';
  const config = REGIME_CONFIG[regime] || REGIME_CONFIG.NORMAL;

  if (compact) {
    return <CompactCard data={data} config={config} className={className} />;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">GANO Fragility Index</CardTitle>
            <CardDescription>Real-time market fragility measure</CardDescription>
          </div>
          <Badge className={`${config.bgColor} ${config.color}`}>
            {regime}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="flex items-baseline gap-4">
          <span className="text-5xl font-bold tabular-nums">{data.score.toFixed(0)}</span>
          <div className="space-y-1">
            <DeltaIndicator label="24h" value={data.delta_24h} />
            <DeltaIndicator label="7d" value={data.delta_7d} />
          </div>
        </div>

        {/* Regime Description */}
        <p className="text-sm text-muted-foreground">{config.description}</p>

        {/* Warning Flags */}
        {showWarnings && data.warning_flags.length > 0 && (
          <div className="space-y-2">
            {data.warning_flags.map((flag, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-sm p-2 rounded ${
                  flag.severity === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                {flag.description}
              </div>
            ))}
          </div>
        )}

        {/* Component Breakdown */}
        {showComponents && data.components && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-sm font-medium">Component Breakdown</h4>
            {data.components.map(comp => (
              <div key={comp.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize">{comp.name}</span>
                  <span className="text-muted-foreground">
                    {(comp.value * 100).toFixed(0)}% × {(comp.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${comp.value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Higher values = elevated stress</span>
          </div>
          <span>Updated: {new Date(data.last_updated).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CompactCard({
  data,
  config,
  className,
}: {
  data: FragilityData;
  config: { color: string; bgColor: string };
  className: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold tabular-nums">{data.score.toFixed(0)}</div>
            <div>
              <Badge className={`${config.bgColor} ${config.color} text-xs`}>
                {data.regime}
              </Badge>
              <DeltaIndicator label="" value={data.delta_24h} inline />
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <div>Fragility</div>
            <div>Index</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaIndicator({
  label,
  value,
  inline = false,
}: {
  label: string;
  value: number;
  inline?: boolean;
}) {
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 1;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
    ? 'text-red-600'
    : 'text-green-600';

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="h-3 w-3" />
        {isPositive ? '+' : ''}{value.toFixed(1)}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <Icon className="h-4 w-4" />
      <span>
        {isPositive ? '+' : ''}{value.toFixed(1)} {label}
      </span>
    </div>
  );
}

export default FragilityIndexCard;
