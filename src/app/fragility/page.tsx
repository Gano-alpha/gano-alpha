'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Info,
  Activity, Search, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

// Types matching backend API
interface FragilityComponent {
  name: string;
  value: number;
  weight: number;
  contribution: number;
  trend: string;
}

interface WarningFlag {
  flag: string;
  description: string;
  severity: string;
}

interface HeroData {
  score: number;
  regime: string;
  delta_24h: number;
  delta_7d: number;
  warning_flags: WarningFlag[];
  last_updated: string;
}

interface ChartDataPoint {
  date: string;
  score: number;
  regime: string;
}

interface TickerFragility {
  ticker: string;
  exposure: number;
  sensitivity: string;
  sector: string;
}

interface WatchlistItem {
  ticker: string;
  exposure: number;
  change_7d: number;
  category: string;
}

// Regime colors
const REGIME_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CALM: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  NORMAL: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  ELEVATED: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500' },
  STRESSED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
  CRISIS: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-700' },
};

export default function FragilityDashboardPage() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [components, setComponents] = useState<FragilityComponent[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerSearch, setTickerSearch] = useState('');
  const [tickerResult, setTickerResult] = useState<TickerFragility | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [heroRes, componentsRes, chartRes, watchlistRes] = await Promise.all([
          fetch(`${API_BASE}/api/fragility-dashboard/hero`),
          fetch(`${API_BASE}/api/fragility-dashboard/components`),
          fetch(`${API_BASE}/api/fragility-dashboard/chart?days=30`),
          fetch(`${API_BASE}/api/fragility-dashboard/watchlist`),
        ]);

        if (heroRes.ok) setHero(await heroRes.json());
        if (componentsRes.ok) setComponents((await componentsRes.json()).components);
        if (chartRes.ok) setChartData((await chartRes.json()).data);
        if (watchlistRes.ok) {
          const wl = await watchlistRes.json();
          setWatchlist([...wl.most_fragile, ...wl.most_improved]);
        }
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
    try {
      const res = await fetch(`${API_BASE}/api/fragility-dashboard/ticker/${tickerSearch.toUpperCase()}`);
      if (res.ok) {
        setTickerResult(await res.json());
      } else {
        setTickerResult(null);
      }
    } catch (err) {
      console.error('Ticker search failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const regime = hero?.regime || 'NORMAL';
  const regimeColor = REGIME_COLORS[regime] || REGIME_COLORS.NORMAL;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto py-6">
          <h1 className="text-3xl font-bold tracking-tight">Fragility Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time market fragility monitoring and analysis
          </p>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Hero Card */}
        {hero && (
          <Card className={`${regimeColor.border} border-2`}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Score */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <Badge className={`${regimeColor.bg} ${regimeColor.text} text-lg px-4 py-1`}>
                      {regime}
                    </Badge>
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-7xl font-bold tabular-nums">
                    {hero.score.toFixed(0)}
                  </div>
                  <p className="text-muted-foreground mt-2">Fragility Index (0-100)</p>
                </div>

                {/* Deltas */}
                <div className="flex flex-col justify-center space-y-4">
                  <DeltaBadge label="24h Change" value={hero.delta_24h} />
                  <DeltaBadge label="7d Change" value={hero.delta_7d} />
                </div>

                {/* Warning Flags */}
                <div>
                  {hero.warning_flags.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Active Warnings
                      </h4>
                      {hero.warning_flags.map((flag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={flag.severity === 'critical' ? 'border-red-500 text-red-700' : ''}
                        >
                          {flag.description}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      No active warnings
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date(hero.last_updated).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Component Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Component Breakdown</CardTitle>
            <CardDescription>Five components at 20% weight each</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {components.map(comp => (
                <ComponentCard key={comp.name} component={comp} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historical Chart */}
        <Card>
          <CardHeader>
            <CardTitle>30-Day History</CardTitle>
            <CardDescription>Historical fragility with regime thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              {/* Regime threshold lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none">
                <div className="border-b border-red-300 border-dashed h-[30%] flex items-end pb-1 pl-2">
                  CRISIS (70+)
                </div>
                <div className="border-b border-orange-300 border-dashed h-[20%] flex items-end pb-1 pl-2">
                  STRESSED (50-70)
                </div>
                <div className="border-b border-amber-300 border-dashed h-[20%] flex items-end pb-1 pl-2">
                  ELEVATED (30-50)
                </div>
                <div className="border-b border-blue-300 border-dashed h-[15%] flex items-end pb-1 pl-2">
                  NORMAL (15-30)
                </div>
                <div className="h-[15%] flex items-end pb-1 pl-2">
                  CALM (0-15)
                </div>
              </div>

              {/* Simple bar chart */}
              <div className="absolute inset-0 flex items-end justify-around pt-8 px-4">
                {chartData.slice(-15).map((point, idx) => (
                  <div
                    key={idx}
                    className="w-4 bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{ height: `${point.score}%` }}
                    title={`${point.date}: ${point.score.toFixed(1)}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticker Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>Ticker Fragility Lookup</CardTitle>
            <CardDescription>Check individual ticker exposure to market fragility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={tickerSearch}
                  onChange={(e) => setTickerSearch(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchTicker()}
                  placeholder="Enter ticker (e.g., AAPL)"
                  className="flex-1 px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={searchTicker}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {tickerResult && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold font-mono">{tickerResult.ticker}</span>
                    <Badge variant="outline" className="ml-2">{tickerResult.sector}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{(tickerResult.exposure * 100).toFixed(0)}%</div>
                    <div className="text-sm text-muted-foreground">Fragility Exposure</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sensitivity Level</span>
                    <Badge variant={
                      tickerResult.sensitivity === 'HIGH' ? 'danger' :
                      tickerResult.sensitivity === 'MEDIUM' ? 'warning' : 'secondary'
                    }>
                      {tickerResult.sensitivity}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${tickerResult.exposure * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watchlist */}
        <Card>
          <CardHeader>
            <CardTitle>Fragility Watchlist</CardTitle>
            <CardDescription>Top fragile and most improved tickers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Fragile */}
              <div>
                <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Most Fragile
                </h4>
                <div className="space-y-2">
                  {watchlist.filter(w => w.category === 'most_fragile').slice(0, 5).map(item => (
                    <WatchlistRow key={item.ticker} item={item} />
                  ))}
                </div>
              </div>

              {/* Most Improved */}
              <div>
                <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Most Improved
                </h4>
                <div className="space-y-2">
                  {watchlist.filter(w => w.category === 'most_improved').slice(0, 5).map(item => (
                    <WatchlistRow key={item.ticker} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground border-t pt-6">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              The GANO Fragility Index measures systemic market stress across five components.
              Higher values indicate elevated uncertainty. This is market context, not a trading signal.
              Always do your own research before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function DeltaBadge({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 1;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={`flex items-center gap-1 font-medium ${
        isNeutral ? 'text-muted-foreground' :
        isPositive ? 'text-red-600' : 'text-green-600'
      }`}>
        {isNeutral ? <Minus className="h-4 w-4" /> :
         isPositive ? <TrendingUp className="h-4 w-4" /> :
         <TrendingDown className="h-4 w-4" />}
        {isPositive ? '+' : ''}{value.toFixed(1)} pts
      </div>
    </div>
  );
}

function ComponentCard({ component }: { component: FragilityComponent }) {
  const trendIcon = component.trend === 'up' ? (
    <TrendingUp className="h-4 w-4 text-red-500" />
  ) : component.trend === 'down' ? (
    <TrendingDown className="h-4 w-4 text-green-500" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground" />
  );

  return (
    <div className="p-4 rounded-lg border text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="font-medium capitalize">{component.name}</span>
        {trendIcon}
      </div>
      <div className="text-3xl font-bold">{(component.value * 100).toFixed(0)}</div>
      <div className="text-xs text-muted-foreground mt-1">
        {(component.weight * 100).toFixed(0)}% weight
      </div>
      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary"
          style={{ width: `${component.value * 100}%` }}
        />
      </div>
    </div>
  );
}

function WatchlistRow({ item }: { item: WatchlistItem }) {
  const isNegative = item.change_7d < 0;

  return (
    <div className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium">{item.ticker}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm">{(item.exposure * 100).toFixed(0)}%</span>
        <Badge variant="outline" className={isNegative ? 'text-green-600' : 'text-red-600'}>
          {isNegative ? '' : '+'}{item.change_7d.toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}
