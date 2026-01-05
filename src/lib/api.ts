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
// Legal API (B19) - Terms of Service & Privacy Policy
// =============================================================================

export type DocumentType = 'terms_of_service' | 'privacy_policy';

export interface LegalDocument {
  document_type: DocumentType;
  version: string;
  effective_date: string;
  title: string;
  content: string;
  last_updated: string;
}

export interface AcceptanceRequest {
  user_id: string;
  tos_version: string;
  privacy_version: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AcceptanceRecord {
  user_id: string;
  tos_version: string;
  tos_accepted_at: string | null;
  privacy_version: string;
  privacy_accepted_at: string | null;
  is_current: boolean;
}

export interface AcceptanceResponse {
  success: boolean;
  user_id: string;
  tos_version: string;
  privacy_version: string;
  accepted_at: string;
  message: string;
}

export interface DocumentVersion {
  document_type: DocumentType;
  version: string;
  effective_date: string;
  is_current: boolean;
}

export interface DataRetentionInfo {
  data_category: string;
  description: string;
  retention_period: string;
  legal_basis: string;
  can_delete: boolean;
}

export interface CurrentVersions {
  tos_version: string;
  privacy_version: string;
  effective_date: string;
}

/**
 * Get Terms of Service (public - no auth required)
 */
export async function getTermsOfService(version?: string): Promise<LegalDocument> {
  const params = version ? `?version=${version}` : '';
  const response = await fetch(`${BACKEND_URL}/api/legal/terms${params}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get Privacy Policy (public - no auth required)
 */
export async function getPrivacyPolicy(version?: string): Promise<LegalDocument> {
  const params = version ? `?version=${version}` : '';
  const response = await fetch(`${BACKEND_URL}/api/legal/privacy${params}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Record user acceptance of ToS and Privacy Policy (public - no auth required)
 * Only requires user_id in the request body
 */
export async function acceptTerms(request: AcceptanceRequest): Promise<AcceptanceResponse> {
  const response = await fetch(`${BACKEND_URL}/api/legal/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get user's acceptance status (public - no auth required)
 * Used to check if user needs to accept updated terms
 */
export async function getAcceptanceStatus(userId: string): Promise<AcceptanceRecord> {
  const response = await fetch(`${BACKEND_URL}/api/legal/acceptance/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get all document versions (public - no auth required)
 */
export async function getDocumentVersions(): Promise<DocumentVersion[]> {
  const response = await fetch(`${BACKEND_URL}/api/legal/versions`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get data retention info (public - no auth required)
 */
export async function getDataRetentionInfo(): Promise<DataRetentionInfo[]> {
  const response = await fetch(`${BACKEND_URL}/api/legal/data-retention`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get current ToS and Privacy Policy versions (public - no auth required)
 */
export async function getCurrentVersions(): Promise<CurrentVersions> {
  const response = await fetch(`${BACKEND_URL}/api/legal/current-versions`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// =============================================================================
// Feedback API (B24) - In-App Feedback + Bug Reporting
// =============================================================================

export type FeedbackType = 'bug' | 'feature_request' | 'usability' | 'data_issue' | 'general' | 'praise';
export type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low' | 'unset';
export type FeedbackStatus = 'new' | 'triaged' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate';

export interface FeedbackAttachment {
  filename: string;
  content_type: string;
  data_base64: string;
  size_bytes?: number;
}

export interface FeedbackSubmission {
  feedback_type: FeedbackType;
  title: string;
  description: string;
  email?: string;
  user_id?: string;
  page_url?: string;
  user_agent?: string;
  attachments?: FeedbackAttachment[];
  metadata?: Record<string, unknown>;
}

export interface FeedbackResponse {
  success: boolean;
  feedback_id: string;
  message: string;
  acknowledgement_sent: boolean;
}

export interface FeedbackItem {
  feedback_id: string;
  feedback_type: FeedbackType;
  title: string;
  description: string;
  email: string | null;
  user_id: string | null;
  page_url: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  created_at: string;
  updated_at: string;
  has_attachments: boolean;
  attachment_count: number;
  metadata: Record<string, unknown> | null;
  assigned_to: string | null;
  resolution_notes: string | null;
}

export interface FeedbackStatusUpdate {
  status: FeedbackStatus;
  priority?: FeedbackPriority;
  assigned_to?: string | null;
  resolution_notes?: string | null;
}

export interface FeedbackStats {
  total_count: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  avg_resolution_hours: number | null;
  unresolved_count: number;
  this_week_count: number;
}

export interface FeedbackTypeInfo {
  type_id: FeedbackType;
  label: string;
  description: string;
  icon: string;
}

export interface FeedbackAttachmentMeta {
  attachment_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  download_url: string;
}

/**
 * Submit user feedback or bug report (public - no auth required)
 */
export async function submitFeedback(submission: FeedbackSubmission): Promise<FeedbackResponse> {
  const response = await fetch(`${BACKEND_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get available feedback types with descriptions (public - no auth required)
 */
export async function getFeedbackTypes(): Promise<FeedbackTypeInfo[]> {
  const response = await fetch(`${BACKEND_URL}/api/feedback/types`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get feedback triage queue (requires admin/PM role)
 */
export async function getFeedbackTriageQueue(
  getAccessToken: () => Promise<string | null>,
  options?: {
    status?: FeedbackStatus;
    feedback_type?: FeedbackType;
    priority?: FeedbackPriority;
    limit?: number;
    offset?: number;
  }
): Promise<FeedbackItem[]> {
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.feedback_type) params.set('feedback_type', options.feedback_type);
  if (options?.priority) params.set('priority', options.priority);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const queryString = params.toString();
  const endpoint = `/api/feedback/triage${queryString ? `?${queryString}` : ''}`;

  return fetchWithAuth<FeedbackItem[]>(endpoint, getAccessToken);
}

/**
 * Get feedback statistics (requires admin/PM role)
 */
export async function getFeedbackStats(
  getAccessToken: () => Promise<string | null>
): Promise<FeedbackStats> {
  return fetchWithAuth<FeedbackStats>('/api/feedback/stats', getAccessToken);
}

/**
 * Get single feedback item (requires admin/PM role)
 */
export async function getFeedbackItem(
  getAccessToken: () => Promise<string | null>,
  feedbackId: string
): Promise<FeedbackItem> {
  return fetchWithAuth<FeedbackItem>(`/api/feedback/${feedbackId}`, getAccessToken);
}

/**
 * Update feedback status (requires admin/PM role)
 */
export async function updateFeedbackStatus(
  getAccessToken: () => Promise<string | null>,
  feedbackId: string,
  update: FeedbackStatusUpdate
): Promise<FeedbackItem> {
  return fetchWithAuth<FeedbackItem>(`/api/feedback/${feedbackId}/status`, getAccessToken, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

/**
 * Get feedback attachments metadata (requires admin/PM role)
 */
export async function getFeedbackAttachments(
  getAccessToken: () => Promise<string | null>,
  feedbackId: string
): Promise<FeedbackAttachmentMeta[]> {
  return fetchWithAuth<FeedbackAttachmentMeta[]>(`/api/feedback/${feedbackId}/attachments`, getAccessToken);
}

/**
 * Download feedback attachment (requires admin/PM role)
 */
export async function downloadFeedbackAttachment(
  getAccessToken: () => Promise<string | null>,
  feedbackId: string,
  attachmentId: string
): Promise<{ filename: string; content_type: string; data_base64: string }> {
  return fetchWithAuth(`/api/feedback/${feedbackId}/attachments/${attachmentId}`, getAccessToken);
}
