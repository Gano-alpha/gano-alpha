'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Info,
  Activity, Search, ChevronRight, Shield, Zap, BarChart3, Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '/backend';

// Types matching v3.0 backend API
interface FragilityComponent {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  raw_value: number | null;
  description: string;
}

interface MarketFragility {
  date: string;
  median_score: number;
  mean_score: number;
  p90_score: number;
  p99_score: number;
  regime: string;
  tickers_scored: number;
  regime_distribution: Record<string, number>;
  config_hash: string;
}

interface HistoryPoint {
  date: string;
  median_score: number;
  mean_score: number;
  p90_score: number;
  tickers_scored: number;
  regime: string;
}

interface TickerFragilityResult {
  ticker: string;
  date: string;
  fragility_score: number;
  regime: string;
  components: FragilityComponent[];
  components_available: number;
}

interface TopTicker {
  ticker: string;
  fragility_score: number;
  regime: string;
  dtd_score: number | null;
  vol_ratio_score: number | null;
  drawdown_score: number | null;
  sc_degree_score: number | null;
}

interface AccelerationData {
  is_accelerating: boolean;
  severity: string;
  delta_5d: number | null;
  delta_20d: number | null;
  current_score: number | null;
  message: string;
}

interface HealthData {
  last_computed_date: string;
  hours_since_last_update: number | null;
  is_stale: boolean;
  tickers_scored: number;
  model_version: string;
  component_coverage: Record<string, number>;
}

// Regime colors
const REGIME_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  calm: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', bar: 'bg-green-500' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500', bar: 'bg-blue-500' },
  elevated: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500', bar: 'bg-amber-500' },
  stressed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500', bar: 'bg-red-500' },
  crisis: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-700', bar: 'bg-red-700' },
};

const COMPONENT_ICONS: Record<string, React.ReactNode> = {
  dtd: <Shield className="h-4 w-4" />,
  vol_ratio: <Zap className="h-4 w-4" />,
  drawdown: <BarChart3 className="h-4 w-4" />,
  sc_degree: <Network className="h-4 w-4" />,
};

const COMPONENT_LABELS: Record<string, string> = {
  dtd: 'Distance to Default',
  vol_ratio: 'Volatility Ratio',
  drawdown: 'Drawdown',
  sc_degree: 'Supply Chain',
};

export default function FragilityDashboardPage() {
  const [market, setMarket] = useState<MarketFragility | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [topFragile, setTopFragile] = useState<TopTicker[]>([]);
  const [topSafe, setTopSafe] = useState<TopTicker[]>([]);
  const [acceleration, setAcceleration] = useState<AccelerationData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickerSearch, setTickerSearch] = useState('');
  const [tickerResult, setTickerResult] = useState<TickerFragilityResult | null>(null);
  const [tickerError, setTickerError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [marketRes, historyRes, topRes, safeRes, accelRes, healthRes] = await Promise.all([
          fetch(`${API_BASE}/api/fragility/market/current`),
          fetch(`${API_BASE}/api/fragility/market/history?days=30`),
          fetch(`${API_BASE}/api/fragility/top?n=10&direction=most`),
          fetch(`${API_BASE}/api/fragility/top?n=10&direction=least`),
          fetch(`${API_BASE}/api/fragility/acceleration`),
          fetch(`${API_BASE}/api/fragility/health`),
        ]);

        if (marketRes.ok) setMarket(await marketRes.json());
        if (historyRes.ok) {
          const h = await historyRes.json();
          setHistory(h.data || []);
        }
        if (topRes.ok) setTopFragile(await topRes.json());
        if (safeRes.ok) setTopSafe(await safeRes.json());
        if (accelRes.ok) setAcceleration(await accelRes.json());
        if (healthRes.ok) setHealth(await healthRes.json());
      } catch (err) {
        console.error('Failed to fetch fragility data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const searchTicker = async () => {
    if (!tickerSearch) return;
    setTickerError('');
    setTickerResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/fragility/ticker/${tickerSearch.toUpperCase()}`);
      if (res.ok) {
        setTickerResult(await res.json());
      } else if (res.status === 404) {
        setTickerError(`No fragility data for ${tickerSearch.toUpperCase()}`);
      } else if (res.status === 401) {
        setTickerError('Login required for ticker lookup');
      } else {
        setTickerError('Search failed');
      }
    } catch (err) {
      setTickerError('Connection error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const regime = market?.regime || 'normal';
  const regimeColor = REGIME_COLORS[regime] || REGIME_COLORS.normal;
  const score = market?.median_score ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">GANO Fragility Index</h1>
              <p className="text-muted-foreground mt-1">
                Real-time systemic fragility measurement across {market?.tickers_scored?.toLocaleString() || '12,000+'} tickers
              </p>
            </div>
            {health && (
              <div className="text-right text-sm text-muted-foreground">
                <div>v{health.model_version}</div>
                <div>{health.is_stale ? '⚠ Stale' : '● Live'} · {health.last_computed_date}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Card */}
        {market && (
          <Card className={`${regimeColor.border} border-2`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Score */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <Badge className={`${regimeColor.bg} ${regimeColor.text} text-lg px-4 py-1`}>
                      {regime.toUpperCase()}
                    </Badge>
                    <Activity className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-7xl font-bold tabular-nums">
                    {(score * 100).toFixed(0)}
                  </div>
                  <p className="text-muted-foreground mt-2">Market Median (0-100)</p>
                  <p className="text-xs text-muted-foreground mt-1">{market.date}</p>
                </div>

                {/* Key Stats */}
                <div className="flex flex-col justify-center space-y-3">
                  <StatRow label="Mean" value={`${(market.mean_score * 100).toFixed(1)}`} />
                  <StatRow label="P90" value={`${(market.p90_score * 100).toFixed(1)}`} suffix="(tail risk)" />
                  <StatRow label="P99" value={`${(market.p99_score * 100).toFixed(1)}`} suffix="(extreme)" />
                  <StatRow label="Coverage" value={market.tickers_scored.toLocaleString()} suffix="tickers" />
                </div>

                {/* Regime Distribution + Acceleration */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Regime Distribution</h4>
                    <div className="space-y-1.5">
                      {Object.entries(market.regime_distribution).map(([r, count]) => {
                        const pct = (count / market.tickers_scored) * 100;
                        const rc = REGIME_COLORS[r] || REGIME_COLORS.normal;
                        return (
                          <div key={r} className="flex items-center gap-2 text-sm">
                            <span className="w-16 capitalize">{r}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${rc.bar} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-16 text-right text-muted-foreground">{count.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {acceleration && (
                    <div className={`p-3 rounded-lg border text-sm ${
                      acceleration.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      acceleration.severity === 'warning' ? 'border-amber-500 bg-amber-50' :
                      'border-muted bg-muted/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        {acceleration.is_accelerating ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Info className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{acceleration.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historical Chart */}
        <Card>
          <CardHeader>
            <CardTitle>30-Day History</CardTitle>
            <CardDescription>Market median fragility with regime thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              {/* Regime threshold lines */}
              <div className="absolute inset-0 flex flex-col text-xs text-muted-foreground pointer-events-none">
                <div className="border-b border-red-300/50 border-dashed" style={{ height: '20%' }}>
                  <span className="pl-2 pt-0.5 block">Crisis (80+)</span>
                </div>
                <div className="border-b border-orange-300/50 border-dashed" style={{ height: '20%' }}>
                  <span className="pl-2 pt-0.5 block">Stressed (60-80)</span>
                </div>
                <div className="border-b border-amber-300/50 border-dashed" style={{ height: '20%' }}>
                  <span className="pl-2 pt-0.5 block">Elevated (40-60)</span>
                </div>
                <div className="border-b border-blue-300/50 border-dashed" style={{ height: '20%' }}>
                  <span className="pl-2 pt-0.5 block">Normal (20-40)</span>
                </div>
                <div style={{ height: '20%' }}>
                  <span className="pl-2 pt-0.5 block">Calm (0-20)</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="absolute inset-0 flex items-end justify-around px-4 pt-2">
                {history.map((point, idx) => {
                  const rc = REGIME_COLORS[point.regime] || REGIME_COLORS.normal;
                  return (
                    <div key={idx} className="flex flex-col items-center group relative">
                      <div
                        className={`w-3 ${rc.bar} rounded-t transition-all opacity-80 hover:opacity-100`}
                        style={{ height: `${point.median_score * 100}%` }}
                      />
                      <div className="hidden group-hover:block absolute -top-12 bg-popover border rounded px-2 py-1 text-xs shadow-md whitespace-nowrap z-10">
                        {point.date}: {(point.median_score * 100).toFixed(1)} ({point.regime})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticker Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>Ticker Fragility Lookup</CardTitle>
            <CardDescription>
              &ldquo;What&apos;s the GANO on TSLA?&rdquo; — Check any ticker&apos;s fragility score and component breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={tickerSearch}
                onChange={(e) => setTickerSearch(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && searchTicker()}
                placeholder="Enter ticker (e.g., AAPL, TSLA, NVDA)"
                className="flex-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={searchTicker}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {tickerError && (
              <div className="text-sm text-red-600 mb-4">{tickerError}</div>
            )}

            {tickerResult && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono">{tickerResult.ticker}</span>
                    <Badge className={`${REGIME_COLORS[tickerResult.regime]?.bg || ''} ${REGIME_COLORS[tickerResult.regime]?.text || ''}`}>
                      {tickerResult.regime.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold tabular-nums">
                      {(tickerResult.fragility_score * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tickerResult.components_available}/4 signals · {tickerResult.date}
                    </div>
                  </div>
                </div>

                {/* Component breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tickerResult.components.map(comp => (
                    <div key={comp.name} className="p-3 rounded border text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        {COMPONENT_ICONS[comp.name]}
                        <span className="text-sm font-medium">{COMPONENT_LABELS[comp.name] || comp.name}</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums">{(comp.score * 100).toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">{(comp.weight * 100)}% weight</div>
                      {comp.raw_value !== null && (
                        <div className="text-xs text-muted-foreground mt-1">raw: {comp.raw_value.toFixed(2)}</div>
                      )}
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${comp.score * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watchlist — Most Fragile & Least Fragile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TrendingUp className="h-5 w-5" />
                Most Fragile
              </CardTitle>
              <CardDescription>Highest systemic risk scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topFragile.map(item => (
                  <TopTickerRow key={item.ticker} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Shield className="h-5 w-5" />
                Most Resilient
              </CardTitle>
              <CardDescription>Lowest systemic risk scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSafe.map(item => (
                  <TopTickerRow key={item.ticker} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Coverage */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle>Signal Coverage</CardTitle>
              <CardDescription>Percentage of tickers with each signal available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(health.component_coverage).map(([key, pct]) => (
                  <div key={key} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {COMPONENT_ICONS[key]}
                      <span className="text-sm font-medium">{COMPONENT_LABELS[key] || key}</span>
                    </div>
                    <div className="text-2xl font-bold">{(pct * 100).toFixed(0)}%</div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Methodology */}
        <Card>
          <CardHeader>
            <CardTitle>Methodology</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>
                The GANO Fragility Index (GFI) measures systemic fragility at the firm level using four empirically validated signals:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 not-prose">
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Shield className="h-4 w-4" /> Distance-to-Default (30%)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Merton (1974) structural credit model. Lower DTD = closer to default barrier.
                  </p>
                </div>
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Zap className="h-4 w-4" /> Volatility Ratio (25%)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    20-day vs 252-day realized vol. Ratio &gt; 1 signals stress building.
                  </p>
                </div>
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <BarChart3 className="h-4 w-4" /> Drawdown (25%)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Distance from 52-week high. Deeper drawdown = more stressed.
                  </p>
                </div>
                <div className="p-3 rounded border">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Network className="h-4 w-4" /> Supply Chain Degree (20%)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Network connections from 208K-edge supply chain graph. More edges = more propagation risk.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs">
                Validated against COVID-19 (max=0.991) and SVB crisis (max=0.992).
                Monotonic Q1-Q5 spread of -3.51%. Week-over-week stability rho=0.900.
                Independent of market beta (R&sup2;=0.019).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground border-t pt-6">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              The GANO Fragility Index measures systemic market stress across four validated signals.
              Higher values indicate elevated fragility. This is a risk measurement, not a trading signal.
              Always do your own research before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function StatRow({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium tabular-nums">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function TopTickerRow({ item }: { item: TopTicker }) {
  const rc = REGIME_COLORS[item.regime] || REGIME_COLORS.normal;

  return (
    <div className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <span className="font-mono font-medium w-12">{item.ticker}</span>
        <Badge variant="outline" className={`${rc.bg} ${rc.text} text-xs`}>
          {item.regime}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${rc.bar} rounded-full`} style={{ width: `${item.fragility_score * 100}%` }} />
        </div>
        <span className="font-mono text-sm w-8 text-right">{(item.fragility_score * 100).toFixed(0)}</span>
      </div>
    </div>
  );
}
