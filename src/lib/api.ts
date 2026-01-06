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
// Product Analytics API (B6)
// =============================================================================

export interface DailyActiveUsers {
  activity_date: string;
  dau: number;
  total_sessions: number;
  total_events: number;
  avg_session_duration_seconds: number;
}

export interface WeeklyActiveUsers {
  week_start: string;
  wau: number;
}

export interface MonthlyActiveUsers {
  month_start: string;
  mau: number;
}

export interface RetentionData {
  days_since_signup: number;
  total_users: number;
  active_users: number;
  retention_rate_pct: number;
}

export interface RetentionBySource {
  source: string;
  days_since_signup: number;
  total_users: number;
  active_users: number;
  retention_rate_pct: number;
}

export interface CohortData {
  cohort_date: string;
  day_0: number | null;
  day_1: number | null;
  day_3: number | null;
  day_7: number | null;
  day_14: number | null;
  day_30: number | null;
}

export interface FunnelStep {
  step_order: number;
  step_key: string;
  step_name: string;
  users_completed: number;
  prev_step_users: number | null;
  step_conversion_pct: number | null;
  avg_time_to_step_seconds: number | null;
}

export interface FeatureUsage {
  feature_key: string;
  total_usage: number;
  unique_users: number;
  avg_duration_seconds: number | null;
}

export interface EngagementScore {
  user_id: string;
  email: string;
  engagement_score: number;
  last_active_at: string;
}

/**
 * Get daily active users (requires analyst role)
 */
export async function getDailyActiveUsers(
  getAccessToken: () => Promise<string | null>,
  options?: { start_date?: string; end_date?: string }
): Promise<DailyActiveUsers[]> {
  const params = new URLSearchParams();
  if (options?.start_date) params.set('start_date', options.start_date);
  if (options?.end_date) params.set('end_date', options.end_date);
  const queryString = params.toString();
  return fetchWithAuth<DailyActiveUsers[]>(
    `/api/analytics/dau${queryString ? `?${queryString}` : ''}`,
    getAccessToken
  );
}

/**
 * Get weekly active users (requires analyst role)
 */
export async function getWeeklyActiveUsers(
  getAccessToken: () => Promise<string | null>,
  weeks: number = 12
): Promise<WeeklyActiveUsers[]> {
  return fetchWithAuth<WeeklyActiveUsers[]>(
    `/api/analytics/wau?weeks=${weeks}`,
    getAccessToken
  );
}

/**
 * Get monthly active users (requires analyst role)
 */
export async function getMonthlyActiveUsers(
  getAccessToken: () => Promise<string | null>,
  months: number = 12
): Promise<MonthlyActiveUsers[]> {
  return fetchWithAuth<MonthlyActiveUsers[]>(
    `/api/analytics/mau?months=${months}`,
    getAccessToken
  );
}

/**
 * Get retention rates (requires analyst role)
 */
export async function getRetentionRates(
  getAccessToken: () => Promise<string | null>
): Promise<RetentionData[]> {
  return fetchWithAuth<RetentionData[]>('/api/analytics/retention', getAccessToken);
}

/**
 * Get retention by acquisition source (requires analyst role)
 */
export async function getRetentionBySource(
  getAccessToken: () => Promise<string | null>,
  days: number[] = [7, 30]
): Promise<RetentionBySource[]> {
  const params = days.map(d => `days=${d}`).join('&');
  return fetchWithAuth<RetentionBySource[]>(
    `/api/analytics/retention/by-source?${params}`,
    getAccessToken
  );
}

/**
 * Get cohort retention matrix (requires analyst role)
 */
export async function getCohortRetention(
  getAccessToken: () => Promise<string | null>,
  options?: { start_date?: string; end_date?: string }
): Promise<CohortData[]> {
  const params = new URLSearchParams();
  if (options?.start_date) params.set('start_date', options.start_date);
  if (options?.end_date) params.set('end_date', options.end_date);
  const queryString = params.toString();
  return fetchWithAuth<CohortData[]>(
    `/api/analytics/cohort${queryString ? `?${queryString}` : ''}`,
    getAccessToken
  );
}

/**
 * Get conversion funnel (requires analyst role)
 */
export async function getConversionFunnel(
  getAccessToken: () => Promise<string | null>
): Promise<FunnelStep[]> {
  return fetchWithAuth<FunnelStep[]>('/api/analytics/funnel', getAccessToken);
}

/**
 * Get feature usage stats (requires analyst role)
 */
export async function getFeatureUsage(
  getAccessToken: () => Promise<string | null>,
  options?: { days?: number; limit?: number }
): Promise<FeatureUsage[]> {
  const params = new URLSearchParams();
  if (options?.days) params.set('days', options.days.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  const queryString = params.toString();
  return fetchWithAuth<FeatureUsage[]>(
    `/api/analytics/features${queryString ? `?${queryString}` : ''}`,
    getAccessToken
  );
}

/**
 * Get engagement scores (requires admin role)
 */
export async function getEngagementScores(
  getAccessToken: () => Promise<string | null>,
  options?: { limit?: number; order?: 'asc' | 'desc' }
): Promise<EngagementScore[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.order) params.set('order', options.order);
  const queryString = params.toString();
  return fetchWithAuth<EngagementScore[]>(
    `/api/analytics/engagement/scores${queryString ? `?${queryString}` : ''}`,
    getAccessToken
  );
}
