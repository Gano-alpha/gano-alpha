/**
 * GANO Render Blocks v1 - TypeScript Types
 * =========================================
 * Matches backend render_blocks.py schema exactly.
 *
 * Block Types:
 * 1. narrative - Always first, brief context setter
 * 2. ranked_list - Default answer shape for lists
 * 3. split_compare - Benefit vs Hurt, Long vs Short
 * 4. evidence - Paths, filings, factor receipts (collapsed by default)
 * 5. deep_dive - Full-focus ticker view with tabs
 * 6. model_trust - Calibration, accuracy, definitions
 *
 * Hardening (v1.1):
 * - schema_version in response
 * - Null-safe display values
 * - PERSON/ENTITY filtering
 * - Size limit constants
 */

// =============================================================================
// Constants (match backend)
// =============================================================================

export const SCHEMA_VERSION = "blocks.v1";
export const MAX_ROWS_PER_LIST = 50;
export const MAX_ROWS_DEFAULT_DISPLAY = 5;
export const MAX_TABS_PER_EVIDENCE = 5;
export const MAX_ITEMS_PER_TAB = 30;
export const MAX_CHIPS_PER_ROW = 4;
export const MAX_ACTIONS_PER_ROW = 3;

// Null display constants
export const NULL_DISPLAY = "—";
export const NULL_NUMERIC_DISPLAY = "n/a";

// =============================================================================
// Enums / Union Types
// =============================================================================

export type BlockType =
  | "narrative"
  | "ranked_list"
  | "split_compare"
  | "evidence"
  | "deep_dive"
  | "model_trust";

export type ChipKind = "sector" | "model" | "factor" | "signal" | "warning" | "geo";

export type ColumnKind =
  | "rank"
  | "ticker"
  | "metric"
  | "confidence"
  | "direction"
  | "text"
  | "date"
  | "percent"
  | "currency";

export type ActionType =
  | "deep_dive"
  | "show_evidence"
  | "compare"
  | "simulate"
  | "add_to_watchlist";

export type EvidenceKind =
  | "factor_beta"
  | "graph_path"
  | "filing_snippet"
  | "model_signal"
  | "news_item";

// =============================================================================
// Shared Types
// =============================================================================

export interface MetricValue {
  value: number | string | null;
  format: "number" | "percent" | "currency" | "text";
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export interface Chip {
  label: string;
  kind: ChipKind;
}

export interface Action {
  type: ActionType;
  label: string;
  payload?: Record<string, unknown>;
}

export interface Column {
  key: string;
  label: string;
  kind: ColumnKind;
  width?: string;
}

export interface Pagination {
  default_limit: number;
  total_rows: number;
  current_page?: number;
}

// =============================================================================
// Row Types (for ranked_list and split_compare)
// =============================================================================

export interface RankedRow {
  key: string;
  rank?: number;
  ticker?: string;
  company?: string;
  // Metrics can be MetricValue or plain values
  [key: string]: unknown;
  chips?: Chip[];
  actions?: Action[];
}

// =============================================================================
// Block Types
// =============================================================================

export interface NarrativeBlock {
  type: "narrative";
  id: string;
  title: string;
  text: string;
  tone?: "analyst" | "conversational" | "warning";
  disclaimer?: string;
  meta?: Record<string, unknown>;
}

export interface RankedListBlock {
  type: "ranked_list";
  id: string;
  title: string;
  subtitle?: string;
  columns: Column[];
  rows: RankedRow[];
  pagination: Pagination;
  meta?: Record<string, unknown>;
}

export interface SplitCompareBlock {
  type: "split_compare";
  id: string;
  title: string;
  subtitle?: string;
  left: {
    label: string;
    block: RankedListBlock;
  };
  right: {
    label: string;
    block: RankedListBlock;
  };
  meta?: Record<string, unknown>;
}

export interface EvidenceItem {
  kind: EvidenceKind | string;
  [key: string]: unknown;
}

export interface EvidenceTab {
  key: string;
  label: string;
  items: EvidenceItem[];
}

export interface EvidenceBlock {
  type: "evidence";
  id: string;
  title: string;
  default_state: "collapsed" | "expanded";
  tabs: EvidenceTab[];
  meta?: Record<string, unknown>;
}

export interface DeepDiveTab {
  key: string;
  label: string;
  blocks: RenderBlock[];
}

export interface DeepDiveBlock {
  type: "deep_dive";
  id: string;
  ticker: string;
  header: {
    title: string;
    subtitle: string;
    badges?: Chip[];
  };
  default_tab: string;
  tabs: DeepDiveTab[];
  meta?: Record<string, unknown>;
}

export interface ModelTrustSection {
  key: string;
  label: string;
  items: Record<string, unknown>[];
}

export interface ModelTrustBlock {
  type: "model_trust";
  id: string;
  title: string;
  default_state: "collapsed" | "expanded";
  summary: {
    period: string;
    overall_hit_rate: number;
    avg_return_5d_bp?: number;
    [key: string]: unknown;
  };
  sections: ModelTrustSection[];
  meta?: Record<string, unknown>;
}

// Union type for all blocks
export type RenderBlock =
  | NarrativeBlock
  | RankedListBlock
  | SplitCompareBlock
  | EvidenceBlock
  | DeepDiveBlock
  | ModelTrustBlock;

// =============================================================================
// Response Envelope
// =============================================================================

export interface DebugInfo {
  tool_trace: Array<{
    tool: string;
    arguments: Record<string, unknown>;
    timing_ms?: number;
  }>;
  raw_tool_outputs: Record<string, unknown>;
  tool_results?: unknown[];
  message_id?: string;
  created_at?: string;
}

export interface RenderBlocksResponse {
  schema_version: string;  // "blocks.v1"
  message_id: string;
  created_at: string;
  blocks: RenderBlock[];
  _debug: DebugInfo;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isNarrativeBlock(block: RenderBlock): block is NarrativeBlock {
  return block.type === "narrative";
}

export function isRankedListBlock(block: RenderBlock): block is RankedListBlock {
  return block.type === "ranked_list";
}

export function isSplitCompareBlock(block: RenderBlock): block is SplitCompareBlock {
  return block.type === "split_compare";
}

export function isEvidenceBlock(block: RenderBlock): block is EvidenceBlock {
  return block.type === "evidence";
}

export function isDeepDiveBlock(block: RenderBlock): block is DeepDiveBlock {
  return block.type === "deep_dive";
}

export function isModelTrustBlock(block: RenderBlock): block is ModelTrustBlock {
  return block.type === "model_trust";
}

// =============================================================================
// Null-Safe Formatting Utilities
// =============================================================================

/**
 * Format metric value for display. Null-safe with proper display constants.
 */
export function formatMetricDisplay(metric: MetricValue | unknown): string {
  if (metric === null || metric === undefined) return NULL_NUMERIC_DISPLAY;

  if (typeof metric === "object" && metric !== null && "value" in metric) {
    const m = metric as MetricValue & { display?: string };

    // Prefer pre-computed display string from server
    if (m.display && typeof m.display === "string") {
      return m.display;
    }

    if (m.value === null || m.value === undefined) return NULL_NUMERIC_DISPLAY;

    const prefix = m.prefix || "";
    const suffix = m.suffix || "";
    let valueStr: string;

    if (typeof m.value === "number") {
      valueStr = m.decimals !== undefined
        ? m.value.toFixed(m.decimals)
        : m.value.toString();
    } else {
      valueStr = String(m.value);
    }

    return `${prefix}${valueStr}${suffix}`;
  }

  // Plain value
  if (typeof metric === "number") {
    return metric.toFixed(2);
  }

  return String(metric);
}

/**
 * Check if a string matches filtered entity patterns (PERSON:*, ENTITY:*).
 * UI-side security guardrail.
 */
export function isFilteredEntity(text: string): boolean {
  if (!text) return false;
  return /^(PERSON|ENTITY|person|entity):/.test(text);
}

/**
 * Filter out PERSON:/ENTITY: items from an array.
 */
export function filterEntities<T extends Record<string, unknown>>(
  items: T[],
  key: string = "ticker"
): T[] {
  return items.filter((item) => !isFilteredEntity(String(item[key] || "")));
}

/**
 * Safe string display - returns NULL_DISPLAY for null/undefined/empty.
 */
export function safeStringDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return NULL_DISPLAY;
  }
  return String(value);
}
