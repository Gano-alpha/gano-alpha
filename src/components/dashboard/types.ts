// =============================================================================
// Shared Types for GANO Dashboard Components
// =============================================================================

// Matches the MCP StructuredResponse contract from api/mcp_server.py

export interface PersonaView {
  signal: 'bullish' | 'bearish' | 'neutral' | 'caution';
  headline: string;
  reasoning: string[];
  actionBias: string;
  keyMetrics: Array<{ label: string; value: string; sentiment: 'positive' | 'negative' | 'neutral' }>;
}

export interface AnalystConsensus {
  og: PersonaView;
  sniper: PersonaView;
  consensus: 'aligned' | 'divergent' | 'conflicted';
  divergenceReason?: string;
  combinedAction: string;
}

export interface ScenarioMeta {
  type: string;
  region?: string;
  trigger?: string;
  entity?: string;
  severity: number;
  rationale: string;
}

export interface ExposureMap {
  topImpacted: Array<{
    ticker: string;
    impact: string;
    path: string;
    confidence: number;
  }>;
  shockPaths: Array<{
    path: string;
    confidence: number;
    evidence?: string;
    source?: 'graph_path' | 'search';
  }>;
  secondOrder?: Array<{
    ticker: string;
    reason: string;
  }>;
}

export interface ActionLayer {
  watchIn72h: string[];
  watchIn2Weeks: string[];
  whatWouldChange: string[];
}

export interface Coverage {
  edgesUsed: number;
  missingData: string[];
  tierBreakdown: string;
}

export interface StructuredResponse {
  // Core content
  narrative: string;
  headline: string;
  confidence: number;
  confidenceStory?: string[];
  evidenceQuality?: number;

  // Impact data
  impactRange?: {
    low: string;
    mid: string;
    high: string;
  };

  // Scenario metadata
  scenario?: ScenarioMeta;

  // Exposure and paths
  exposureMap?: ExposureMap;

  // Actionable insights
  actionLayer?: ActionLayer;

  // Model signals
  analystConsensus?: AnalystConsensus;

  // Data coverage
  coverage?: Coverage;

  // Timestamp (ISO string)
  timestamp?: string;
}

// API response wrapper
export interface AnswerScenarioResponse {
  structured_response: StructuredResponse;
  _debug: {
    detected_region?: string;
    trigger?: string;
    entity?: string;
    scenario_type?: string;
    search_terms_used?: string[];
    total_edges_searched?: number;
    impacted_count?: number;
    simulations_run?: number;
  };
}

// Error types from MCP
export interface GanoErrorResponse {
  error: true;
  errorType: 'NOT_FOUND' | 'INVALID_INPUT' | 'INTERNAL_ERROR' | 'NO_DATA';
  message: string;
  resource?: string;
  identifier?: string;
  field?: string;
  value?: unknown;
  expected?: string;
  operation?: string;
  query?: string;
  reason?: string;
}

// Chat message types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  structuredResponse?: StructuredResponse;
  isLoading?: boolean;
}

export interface ToolCall {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

// Comparison view types
export interface ComparisonResult {
  query: string;
  chatgpt: {
    loading: boolean;
    response?: string;
  };
  gano: {
    loading: boolean;
    structured?: StructuredResponse;
    error?: string;
  };
}

// Common word exclusions for ticker extraction
export const EXCLUDED_TICKER_WORDS = [
  'A', 'I', 'IF', 'THE', 'AND', 'FOR', 'TO', 'IN', 'ON', 'AT', 'BY', 'OR',
  'AN', 'IT', 'IS', 'BE', 'AS', 'SO', 'WE', 'HE', 'DO', 'NO', 'UP', 'MY',
  'GO', 'OF', 'ARE', 'NOT', 'BUT', 'CAN', 'ALL', 'OUT', 'HOW', 'NOW',
  'NEW', 'HAS', 'WHO', 'WHAT', 'WHEN', 'WHERE', 'WHY', 'WILL', 'HAVE',
  'BEEN', 'WOULD', 'COULD', 'SHOULD', 'THAN', 'THEIR', 'THEY', 'THIS',
  'THAT', 'WITH', 'FROM', 'INTO', 'OVER', 'SUCH', 'SOME', 'MANY', 'MORE',
  'MOST', 'MUCH', 'THESE', 'THOSE', 'WHICH', 'WHILE', 'ALSO', 'JUST',
  'LIKE', 'RATE', 'VIX', 'GDP', 'CPI', 'FED', 'SEC', 'USD', 'EUR', 'JPY',
  'GBP', 'CNY', 'OIL', 'GAS', 'WAR', 'RISK', 'CHIP', 'CEO', 'CFO', 'COO'
];

// Utility: Extract ticker from query
export function extractTicker(query: string): string | undefined {
  const matches = query.match(/\b([A-Z]{1,5})\b/g);
  if (!matches) return undefined;

  const ticker = matches.find(t => !EXCLUDED_TICKER_WORDS.includes(t));
  return ticker;
}

// Utility: Format timestamp for display
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
}

// Utility: Parse impact value to determine direction
export function parseImpactValue(impact: string): { value: number; isNegative: boolean } {
  const cleaned = impact.replace(/[^0-9.\-]/g, '');
  const value = parseFloat(cleaned) || 0;
  const isNegative = impact.includes('-') || value < 0;
  return { value: Math.abs(value), isNegative };
}
