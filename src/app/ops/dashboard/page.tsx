'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle, Circle, AlertTriangle, Clock, Database,
  Activity, RefreshCw, Lock, BarChart3, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.gano.ai';

// Types matching backend API
interface PhaseProgress {
  phase: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  completion_percentage: number;
  p0_total: number;
  p0_completed: number;
}

interface DataFreshness {
  table_name: string;
  tier: string;
  last_updated: string;
  row_count: number;
  freshness_hours: number;
  sla_hours: number;
  is_stale: boolean;
}

interface PipelineHealth {
  pipeline_name: string;
  last_run: string;
  status: string;
  success_rate_7d: number;
  avg_duration_minutes: number;
}

interface SystemAlert {
  alert_id: string;
  severity: string;
  message: string;
  source: string;
  created_at: string;
  resolved: boolean;
}

interface DashboardData {
  phases: PhaseProgress[];
  data_freshness: DataFreshness[];
  pipeline_health: PipelineHealth[];
  system_alerts: SystemAlert[];
  last_refresh: string;
}

export default function OpsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/ops/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        setError('Access denied. Admin or developer role required.');
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch dashboard');

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center gap-4">
            <Lock className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const activeAlerts = data.system_alerts.filter(a => !a.resolved);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Ops Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Internal monitoring - Phase progress, data freshness, pipeline health
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(data.last_refresh).toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* System Alerts */}
        {activeAlerts.length > 0 && (
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts ({activeAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeAlerts.map(alert => (
                  <div key={alert.alert_id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant={alert.severity === 'critical' ? 'danger' : 'outline'}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Phase Progress</CardTitle>
            <CardDescription>Alpha → Beta → GA completion tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.phases.map(phase => (
                <PhaseCard key={phase.phase} phase={phase} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Freshness */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Freshness
            </CardTitle>
            <CardDescription>
              SLA: Tier 1 = 24h, Tier 2/3 = 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Table</th>
                    <th className="pb-3 font-medium">Tier</th>
                    <th className="pb-3 font-medium">Rows</th>
                    <th className="pb-3 font-medium">Last Updated</th>
                    <th className="pb-3 font-medium">Freshness</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data_freshness.map(item => (
                    <FreshnessRow key={item.table_name} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Pipeline Health
            </CardTitle>
            <CardDescription>7-day success rates and run times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.pipeline_health.map(pipeline => (
                <PipelineCard key={pipeline.pipeline_name} pipeline={pipeline} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-components

function PhaseCard({ phase }: { phase: PhaseProgress }) {
  const getPhaseColor = (phaseName: string) => {
    switch (phaseName.toLowerCase()) {
      case 'alpha': return 'text-purple-600';
      case 'beta': return 'text-blue-600';
      case 'ga': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (phase.completion_percentage / 100) * circumference;

  return (
    <div className="p-6 rounded-lg border text-center">
      <h3 className={`text-xl font-bold ${getPhaseColor(phase.phase)}`}>
        {phase.phase}
      </h3>

      {/* Circular Progress */}
      <div className="relative w-28 h-28 mx-auto my-4">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="40"
            className="fill-none stroke-muted"
            strokeWidth="8"
          />
          <circle
            cx="56"
            cy="56"
            r="40"
            className="fill-none stroke-primary"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{phase.completion_percentage}%</span>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Completed</span>
          <span className="font-medium">{phase.completed_tasks}/{phase.total_tasks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">In Progress</span>
          <span className="font-medium">{phase.in_progress_tasks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">P0 Tasks</span>
          <span className="font-medium">{phase.p0_completed}/{phase.p0_total}</span>
        </div>
        {phase.blocked_tasks > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Blocked</span>
            <span className="font-medium">{phase.blocked_tasks}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FreshnessRow({ item }: { item: DataFreshness }) {
  const tierColors: Record<string, string> = {
    tier1: 'bg-purple-100 text-purple-800',
    tier2: 'bg-blue-100 text-blue-800',
    tier3: 'bg-gray-100 text-gray-800',
  };

  return (
    <tr className="border-b last:border-0 text-sm">
      <td className="py-3 font-mono">{item.table_name}</td>
      <td className="py-3">
        <Badge className={tierColors[item.tier] || ''} variant="outline">
          {item.tier}
        </Badge>
      </td>
      <td className="py-3">{item.row_count.toLocaleString()}</td>
      <td className="py-3">{new Date(item.last_updated).toLocaleString()}</td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {item.freshness_hours.toFixed(1)}h / {item.sla_hours}h
        </div>
      </td>
      <td className="py-3">
        {item.is_stale ? (
          <Badge variant="danger">STALE</Badge>
        ) : (
          <Badge variant="outline" className="bg-green-100 text-green-800">Fresh</Badge>
        )}
      </td>
    </tr>
  );
}

function PipelineCard({ pipeline }: { pipeline: PipelineHealth }) {
  const isHealthy = pipeline.success_rate_7d >= 90;
  const statusColors: Record<string, string> = {
    success: 'bg-green-500',
    running: 'bg-blue-500 animate-pulse',
    failed: 'bg-red-500',
    pending: 'bg-yellow-500',
  };

  return (
    <Card className={!isHealthy ? 'border-red-500' : ''}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-sm truncate">{pipeline.pipeline_name}</span>
          <div className={`w-3 h-3 rounded-full ${statusColors[pipeline.status] || 'bg-gray-500'}`} />
        </div>

        <div className="text-3xl font-bold mb-1">
          {pipeline.success_rate_7d.toFixed(0)}%
        </div>
        <p className="text-xs text-muted-foreground">7-day success rate</p>

        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Last run</span>
            <span>{new Date(pipeline.last_run).toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg duration</span>
            <span>{pipeline.avg_duration_minutes.toFixed(1)} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
