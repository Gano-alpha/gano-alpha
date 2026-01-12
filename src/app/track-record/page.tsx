'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, Target, Shield, BarChart3, Info } from 'lucide-react';

// Types matching backend API
interface TierSummary {
  tier: string;
  total_signals: number;
  avg_return: number;
  win_rate: number;
  avg_holding_days: number;
}

interface MonthlyPerformance {
  month: string;
  enter_count: number;
  watch_count: number;
  avoid_count: number;
  avg_return: number;
  cumulative_return: number;
}

interface SignalOutcome {
  date: string;
  ticker: string;
  signal_tier: string;
  predicted_return: number;
  realized_return: number | null;
  holding_days: number;
  status: string;
}

interface TrackRecordData {
  summary: {
    total_signals: number;
    months_of_history: number;
    overall_edge: number;
    win_rate: number;
    avg_holding_period: number;
    last_updated: string;
  };
  tier_breakdown: TierSummary[];
  monthly_performance: MonthlyPerformance[];
  recent_signals: SignalOutcome[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

export default function TrackRecordPage() {
  const [data, setData] = useState<TrackRecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrackRecord() {
      try {
        const res = await fetch(`${API_BASE}/api/track-record`);
        if (!res.ok) throw new Error('Failed to fetch track record');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTrackRecord();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading track record: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, tier_breakdown, monthly_performance, recent_signals } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto py-8">
          <h1 className="text-4xl font-bold tracking-tight">GANO Track Record</h1>
          <p className="text-muted-foreground mt-2">
            {summary.months_of_history}+ months of verified signal history with realized performance
          </p>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Overall Edge"
            value={`${summary.overall_edge > 0 ? '+' : ''}${summary.overall_edge.toFixed(1)}%`}
            subtitle="Annualized alpha"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={summary.overall_edge > 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="Total Signals"
            value={summary.total_signals.toLocaleString()}
            subtitle={`${summary.months_of_history} months`}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <MetricCard
            title="Win Rate"
            value={`${summary.win_rate.toFixed(0)}%`}
            subtitle="Positive returns"
            icon={<Target className="h-5 w-5" />}
            trend={summary.win_rate > 50 ? 'up' : 'down'}
          />
          <MetricCard
            title="Avg Hold Period"
            value={`${summary.avg_holding_period} days`}
            subtitle="Signal duration"
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        {/* Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Signal Tier</CardTitle>
            <CardDescription>
              Historical returns segmented by ENTER, WATCH, and AVOID signals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tier_breakdown.map((tier) => (
                <TierCard key={tier.tier} tier={tier} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>
              Cumulative returns and signal distribution over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthly_performance.slice(-12).map((month) => (
                <MonthRow key={month.month} data={month} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signal Outcomes</CardTitle>
            <CardDescription>
              All signals shown - no cherry-picking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Ticker</th>
                    <th className="pb-3 font-medium">Signal</th>
                    <th className="pb-3 font-medium text-right">Predicted</th>
                    <th className="pb-3 font-medium text-right">Realized</th>
                    <th className="pb-3 font-medium text-right">Days</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_signals.map((signal, idx) => (
                    <SignalRow key={`${signal.date}-${signal.ticker}-${idx}`} signal={signal} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Methodology Link */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Methodology & Transparency</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how GANO generates signals using our three-layer architecture:
                  Sensing Layer, Learning Layer, and Index Layer.
                </p>
                <a
                  href="/methodology"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Read our methodology →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground border-t pt-6">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Past performance does not guarantee future results. All signals shown are historical
              and include both winners and losers. GANO provides market intelligence, not investment
              advice. Always do your own research before making investment decisions.
            </p>
          </div>
          <p className="mt-2">Last updated: {new Date(summary.last_updated).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground">{icon}</div>
          {trend && (
            <Badge variant={trend === 'up' ? 'success' : 'danger'} className="text-xs">
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TierCard({ tier }: { tier: TierSummary }) {
  const tierColors: Record<string, string> = {
    ENTER: 'bg-green-500',
    WATCH: 'bg-yellow-500',
    AVOID: 'bg-red-500',
  };

  return (
    <div className="p-4 rounded-lg border">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${tierColors[tier.tier] || 'bg-gray-500'}`} />
        <span className="font-semibold">{tier.tier}</span>
        <Badge variant="outline" className="ml-auto">
          {tier.total_signals} signals
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Return</span>
          <span className={tier.avg_return > 0 ? 'text-green-600' : 'text-red-600'}>
            {tier.avg_return > 0 ? '+' : ''}{tier.avg_return.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Win Rate</span>
          <span>{tier.win_rate.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Hold</span>
          <span>{tier.avg_holding_days} days</span>
        </div>
      </div>
    </div>
  );
}

function MonthRow({ data }: { data: MonthlyPerformance }) {
  const maxReturn = 20; // Scale for visualization
  const barWidth = Math.min(Math.abs(data.avg_return) / maxReturn * 100, 100);

  return (
    <div className="flex items-center gap-4 py-2 border-b last:border-0">
      <div className="w-24 text-sm font-medium">{data.month}</div>
      <div className="flex-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${data.avg_return >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <div className="w-20 text-right">
        <span className={data.avg_return >= 0 ? 'text-green-600' : 'text-red-600'}>
          {data.avg_return >= 0 ? '+' : ''}{data.avg_return.toFixed(1)}%
        </span>
      </div>
      <div className="w-24 text-right text-sm text-muted-foreground">
        {data.enter_count + data.watch_count + data.avoid_count} signals
      </div>
    </div>
  );
}

function SignalRow({ signal }: { signal: SignalOutcome }) {
  const tierColors: Record<string, string> = {
    ENTER: 'bg-green-100 text-green-800',
    WATCH: 'bg-yellow-100 text-yellow-800',
    AVOID: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<string, string> = {
    realized: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800',
    expired: 'bg-purple-100 text-purple-800',
  };

  return (
    <tr className="border-b last:border-0 text-sm">
      <td className="py-3">{new Date(signal.date).toLocaleDateString()}</td>
      <td className="py-3 font-mono font-medium">{signal.ticker}</td>
      <td className="py-3">
        <Badge className={tierColors[signal.signal_tier] || ''} variant="outline">
          {signal.signal_tier}
        </Badge>
      </td>
      <td className="py-3 text-right">
        {signal.predicted_return >= 0 ? '+' : ''}{signal.predicted_return.toFixed(1)}%
      </td>
      <td className="py-3 text-right">
        {signal.realized_return !== null ? (
          <span className={signal.realized_return >= 0 ? 'text-green-600' : 'text-red-600'}>
            {signal.realized_return >= 0 ? '+' : ''}{signal.realized_return.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-3 text-right">{signal.holding_days}</td>
      <td className="py-3">
        <Badge className={statusColors[signal.status] || ''} variant="outline">
          {signal.status}
        </Badge>
      </td>
    </tr>
  );
}
