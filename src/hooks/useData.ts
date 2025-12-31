import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://18.117.82.161:8000';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching authenticated API data
 * Automatically handles auth tokens and error states
 */
export function useData<T>(endpoint: string): UseDataResult<T> {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 503) {
          setError('Data pipeline processing. Check back shortly.');
        } else if (response.status === 401) {
          setError('Session expired');
        } else {
          setError(`API error: ${response.status}`);
        }
        setLoading(false);
        return;
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}:`, err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [endpoint, getAccessToken, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for public endpoints (no auth required)
 */
export function usePublicData<T>(endpoint: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}${endpoint}`);

      if (!response.ok) {
        setError(`API error: ${response.status}`);
        setLoading(false);
        return;
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}:`, err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Type definitions for API responses
export interface MarketStatus {
  regime: 'AGGRESSIVE' | 'SELECTIVE' | 'DEFENSIVE' | 'CRISIS';
  stress_index: number;
  message: string;
  graph_nodes: number;
  graph_edges: number;
  avg_merton_pd: number;
  high_risk_count: number;
  updated_at: string;
}

export interface Signal {
  ticker: string;
  signal_date: string;
  signal_tier: 'SNIPER' | 'SCOUT';
  direction: 'LONG' | 'SHORT';
  model_score: number;
  confidence: number;
  centrality_flow: number;
  centrality_degree: number;
  merton_pd_1y: number | null;
  altman_z: number | null;
  cds_proxy_score: number | null;
  sharpe_21d: number | null;
  max_drawdown: number | null;
  supplier_count: number;
  customer_count: number;
  sector: string | null;
  context: string | null;
}

export interface SignalsResponse {
  status: string;
  count: number;
  signals: Signal[];
  asOfDate: string;
}

export interface PerformanceMetrics {
  model_version: string;
  validation_period: string;
  sharpe_ratio: number;
  alpha_oos: number;
  win_rate: number;
  crisis_alpha: number;
  max_drawdown: number;
  information_coefficient: number;
  last_updated: string;
}

export interface CaseStudyPoint {
  date: string;
  price: number;
  pd: number;
}

export interface CaseStudyResponse {
  isIllustrative: boolean;
  data: CaseStudyPoint[];
}

export interface HealthStatus {
  status: string;
  database: string;
  graph_loaded: boolean;
  graph_nodes: number;
  graph_edges: number;
}

export interface GraphNode {
  id: string;
  name: string;
  sector: string;
  val: number;
  group: 'Operational' | 'Social' | 'Flow' | 'Environmental' | 'Other';
  metrics: {
    centrality: number;
    merton_pd: string;
    edge_count: number;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  layer: 'Operational' | 'Social' | 'Flow' | 'Environmental' | 'Other';
  confidence: number;
  evidence: number;
}

export interface GraphTopology {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    source_table: string;
    generated_at: string;
  };
}
