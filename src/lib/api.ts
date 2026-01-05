/**
 * API utilities for Gano Alpha
 * Handles authenticated requests to the backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.ganoalpha.com';

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

export interface GraphConfidence {
  total_nodes: number;
  total_edges: number;
  edge_confidence_avg: number;
  high_confidence_edges: number;
  coverage_percent: number;
}

export interface HealthResponse {
  status: string;
  database: string;
  graph_loaded: boolean;
  graph_nodes: number;
  graph_edges: number;
}

export interface WhisperItem {
  ticker: string;
  signal_type: string;
  signal_value: number;
  delta_1d: number | null;
  delta_7d: number | null;
  updated_at: string;
}

export interface WhispersResponse {
  status: string;
  count: number;
  whispers: WhisperItem[];
}

export interface MiniGraphNode {
  id: string;
  label: string;
  type: 'center' | 'supplier' | 'customer';
  sector?: string;
}

export interface MiniGraphEdge {
  source: string;
  target: string;
  relationship: string;
  confidence: number;
}

export interface MiniGraphResponse {
  status: string;
  ticker: string;
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
}

/**
 * Fetch with authentication token
 */
export async function fetchWithAuth<T>(
  endpoint: string,
  getAccessToken: () => Promise<string | null>,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Public API endpoints (no auth required)
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${BACKEND_URL}/health`);
  return response.json();
}

/**
 * Get signals (requires auth)
 */
export async function getSignals(
  getAccessToken: () => Promise<string | null>,
  options?: { tier?: 'SNIPER' | 'SCOUT'; limit?: number; date?: string }
): Promise<SignalsResponse> {
  const params = new URLSearchParams();
  if (options?.tier) params.set('tier', options.tier);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.date) params.set('date', options.date);

  const queryString = params.toString();
  const endpoint = `/v1/signals${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<SignalsResponse>(endpoint, getAccessToken);
}

/**
 * Get graph confidence metrics (requires auth)
 */
export async function getGraphConfidence(
  getAccessToken: () => Promise<string | null>
): Promise<GraphConfidence> {
  return fetchWithAuth<GraphConfidence>('/v1/metrics/graph-confidence', getAccessToken);
}

/**
 * Get whispers/anomalies (requires auth)
 */
export async function getWhispers(
  getAccessToken: () => Promise<string | null>,
  options?: { limit?: number }
): Promise<WhispersResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());

  const queryString = params.toString();
  const endpoint = `/v1/whispers${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<WhispersResponse>(endpoint, getAccessToken);
}

/**
 * Get mini graph for a ticker (requires auth)
 */
export async function getMiniGraph(
  getAccessToken: () => Promise<string | null>,
  ticker: string
): Promise<MiniGraphResponse> {
  return fetchWithAuth<MiniGraphResponse>(`/v1/mini-graph/${ticker}`, getAccessToken);
}

/**
 * Search stocks (requires auth)
 */
export async function searchStocks(
  getAccessToken: () => Promise<string | null>,
  query: string,
  limit: number = 10
): Promise<{ status: string; results: Array<{ ticker: string; name: string; sector: string }> }> {
  return fetchWithAuth(`/v1/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`, getAccessToken);
}

// =============================================================================
// Chat API - Option 3 Structured Response (No ChatGPT Synthesis)
// =============================================================================

export interface ToolResult {
  tool: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatQueryResponse {
  query: string;
  intent: string | null;
  tools_selected: Array<{
    tool: string;
    arguments: Record<string, unknown>;
  }>;
  tool_results: ToolResult[];
  // Legacy field - deprecated
  ui_hint?: 'ranked_list' | 'split_compare' | 'ticker_deep_dive' | 'evidence' | 'model_trust' | 'narrative' | null;
  // Legacy pre-formatted UI response (backward compatible)
  ui_type?: 'narrative' | 'ranked_list' | 'split_compare' | 'ticker_deep_dive' | 'evidence' | 'scenario_impact' | 'model_trust';
  ui_data?: Record<string, unknown>;
  // NEW: Render blocks format (preferred - server emits directly)
  blocks?: import('@/types/render-blocks').RenderBlock[];
  _debug?: {
    tool_trace: Array<{ tool: string; arguments: Record<string, unknown>; timing_ms?: number }>;
    raw_tool_outputs: Record<string, unknown>;
    tool_results?: ToolResult[];
    message_id?: string;
    created_at?: string;
  };
  error?: string;
}

/**
 * Send a natural language query to GANO.
 *
 * Option 3 Architecture:
 * - ChatGPT selects appropriate tools
 * - Tools are executed
 * - RAW structured results returned (no ChatGPT prose synthesis)
 * - Frontend renders structured data as UI cards
 */
export async function sendChatQuery(
  getAccessToken: () => Promise<string | null>,
  query: string
): Promise<ChatQueryResponse> {
  return fetchWithAuth<ChatQueryResponse>('/v1/chat/query', getAccessToken, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// =============================================================================
// Context Panel API - Market Context, Signals, Warnings
// =============================================================================

export interface MacroContext {
  vix: number | null;
  vix_change: number | null;
  vix_regime: 'High' | 'Normal' | 'Low';
  rate_10y: number | null;
  rate_change: number | null;
  credit_spread: number | null;
  credit_regime: string | null;
  spy_change: number | null;
  regime_summary: string[];
  error?: string;
}

export interface ContextSignal {
  ticker: string;
  model: 'OG' | 'Sniper';
  direction: 'long' | 'short';
  score: number;
}

export interface ContextWarning {
  ticker: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Get current macro context (VIX, rates, credit spreads)
 */
export async function getMacroContext(
  getAccessToken: () => Promise<string | null>
): Promise<MacroContext> {
  return fetchWithAuth<MacroContext>('/v1/context/macro', getAccessToken);
}

/**
 * Get top signals for context panel
 */
export async function getContextSignals(
  getAccessToken: () => Promise<string | null>,
  topK: number = 10
): Promise<{ signals: ContextSignal[]; error?: string }> {
  return fetchWithAuth<{ signals: ContextSignal[]; error?: string }>(
    `/v1/context/signals?top_k=${topK}`,
    getAccessToken
  );
}

/**
 * Get early warnings for context panel
 */
export async function getContextWarnings(
  getAccessToken: () => Promise<string | null>,
  topK: number = 5
): Promise<{ warnings: ContextWarning[]; error?: string }> {
  return fetchWithAuth<{ warnings: ContextWarning[]; error?: string }>(
    `/v1/context/warnings?top_k=${topK}`,
    getAccessToken
  );
}

// =============================================================================
// Ticker Deep Dive API
// =============================================================================

export interface TickerAnalysis {
  ticker: string;
  company_name?: string;
  sector?: string;
  supply_chain?: {
    suppliers: Array<{ ticker: string; relationship: string; confidence: number }>;
    customers: Array<{ ticker: string; relationship: string; confidence: number }>;
  };
  factor_sensitivities?: {
    market_beta: number;
    rate_10y_beta: number;
    vix_beta: number;
    dollar_beta: number;
    oil_beta: number;
    r_squared: number;
  };
  model_signals?: {
    og?: { direction: string; conviction: number };
    sniper?: { direction: string; conviction: number };
  };
  early_warnings?: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  error?: string;
}

// =============================================================================
// Streaming Chat API - SSE for real-time tool progress
// =============================================================================

export interface StreamEvent {
  event: 'tool_start' | 'tool_complete' | 'complete' | 'error';
  id?: string;
  tool?: string;
  args?: Record<string, unknown>;
  timing_ms?: number;
  message?: string;
  // Complete event fields
  query?: string;
  intent?: string;
  tools_selected?: Array<{ tool: string; arguments: Record<string, unknown> }>;
  blocks?: import('@/types/render-blocks').RenderBlock[];
  ui_type?: string;
  ui_data?: Record<string, unknown>;
  total_ms?: number;
  _debug?: {
    tool_trace: Array<{ tool: string; arguments: Record<string, unknown>; timing_ms?: number }>;
    message_id?: string;
    created_at?: string;
  };
}

/**
 * History message format for multi-turn conversations
 */
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a chat query with streaming tool progress via SSE.
 *
 * @param getAccessToken - Function to get auth token
 * @param query - The user's query
 * @param history - Optional conversation history for multi-turn context
 * @param onEvent - Callback for each SSE event
 * @returns Promise that resolves when stream completes
 */
export async function sendChatQueryStreaming(
  getAccessToken: () => Promise<string | null>,
  query: string,
  history: HistoryMessage[] | null,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const token = await getAccessToken();

  if (!token) {
    onEvent({ event: 'error', message: 'Not authenticated' });
    return;
  }

  // Build URL with query and optional history
  let url = `${BACKEND_URL}/v1/chat/query/stream?q=${encodeURIComponent(query)}`;
  if (history && history.length > 0) {
    url += `&history=${encodeURIComponent(JSON.stringify(history))}`
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        onEvent({ event: 'error', message: 'Session expired' });
        return;
      }
      onEvent({ event: 'error', message: `API error: ${response.status}` });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onEvent({ event: 'error', message: 'No response body' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data as StreamEvent);
          } catch (e) {
            console.error('Failed to parse SSE event:', line, e);
          }
        }
      }
    }
  } catch (error) {
    onEvent({ event: 'error', message: error instanceof Error ? error.message : 'Stream failed' });
  }
}

// =============================================================================
// Ticker Deep Dive API
// =============================================================================

/**
 * Get comprehensive ticker analysis via MCP tool
 */
export async function analyzeTicker(
  getAccessToken: () => Promise<string | null>,
  ticker: string
): Promise<TickerAnalysis> {
  const response = await fetchWithAuth<{
    tool: string;
    success: boolean;
    result?: TickerAnalysis;
    error?: string;
  }>('/v1/chat/execute', getAccessToken, {
    method: 'POST',
    body: JSON.stringify({
      tool: 'analyze_ticker',
      arguments: { ticker: ticker.toUpperCase() }
    }),
  });

  if (!response.success) {
    return { ticker, error: response.error || 'Analysis failed' };
  }

  return response.result || { ticker, error: 'No data' };
}

// =============================================================================
// Track Record API (B1) - Public Performance Data
// =============================================================================

export interface TierSummary {
  signal_tier: string;
  total_signals: number;
  completed_signals: number;
  winners: number;
  losers: number;
  win_rate: number | null;
  avg_return_pct: number | null;
  median_return_pct: number | null;
  best_return_pct: number | null;
  worst_return_pct: number | null;
}

export interface TrackRecordSummary {
  period_days: number;
  period_start: string;
  period_end: string;
  total_signals: number;
  completed_signals: number;
  overall_win_rate: number | null;
  overall_avg_return_pct: number | null;
  by_tier: TierSummary[];
}

export interface MonthlyPerformance {
  month: string;
  total_signals: number;
  completed: number;
  winners: number;
  win_rate: number | null;
  avg_return_pct: number | null;
}

export interface SignalOutcome {
  signal_date: string;
  ticker: string;
  company_name: string | null;
  sector: string | null;
  signal_tier: string;
  direction: string;
  win_probability: number | null;
  entry_price: number | null;
  exit_price: number | null;
  exit_date: string | null;
  return_pct: number | null;
  outcome: 'WIN' | 'LOSS' | 'PENDING';
  days_held: number | null;
}

export interface BacktestMetrics {
  as_of_date: string;
  horizon: string;
  accuracy_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  alpha_vs_spy_pct: number;
  total_trades: number;
}

export interface MethodologyInfo {
  gano_model_name: string;
  gano_model_version: string;
  strategy_type: string;
  description: string;
  risk_management: {
    stop_loss: string;
    take_profit: string;
    max_positions: number;
    holding_period: string;
  };
  signal_tiers: Record<string, string>;
  data_sources: string[];
  methodology_url: string;
  last_updated: string;
}

export interface TrackRecordQuickStats {
  total_signals: number;
  first_signal_date: string | null;
  last_signal_date: string | null;
  unique_tickers: number;
  enter_win_rate: number | null;
  enter_avg_return: number | null;
  data_months: number;
}

/**
 * Get track record summary (public - no auth required)
 */
export async function getTrackRecordSummary(
  days: number = 365,
  signalTier?: string
): Promise<TrackRecordSummary> {
  const params = new URLSearchParams({ days: days.toString() });
  if (signalTier) params.set('signal_tier', signalTier);

  const response = await fetch(`${BACKEND_URL}/api/track-record?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get monthly performance breakdown (public - no auth required)
 */
export async function getMonthlyPerformance(
  months: number = 12
): Promise<MonthlyPerformance[]> {
  const response = await fetch(`${BACKEND_URL}/api/track-record/monthly?months=${months}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get individual signal outcomes (public - no auth required)
 */
export async function getSignalOutcomes(
  days: number = 180,
  signalTier?: string,
  outcome?: string,
  limit: number = 100,
  offset: number = 0
): Promise<SignalOutcome[]> {
  const params = new URLSearchParams({
    days: days.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (signalTier) params.set('signal_tier', signalTier);
  if (outcome) params.set('outcome', outcome);

  const response = await fetch(`${BACKEND_URL}/api/track-record/signals?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get backtest metrics (public - no auth required)
 */
export async function getBacktestMetrics(): Promise<BacktestMetrics[]> {
  const response = await fetch(`${BACKEND_URL}/api/track-record/metrics`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get methodology info (public - no auth required)
 */
export async function getMethodologyInfo(): Promise<MethodologyInfo> {
  const response = await fetch(`${BACKEND_URL}/api/track-record/methodology`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get quick stats for header (public - no auth required)
 */
export async function getTrackRecordQuickStats(): Promise<TrackRecordQuickStats> {
  const response = await fetch(`${BACKEND_URL}/api/track-record/stats`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
