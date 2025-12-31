/**
 * GANO Render Blocks v1 - Zod Schema
 * ===================================
 * Runtime validation for render blocks from server.
 *
 * Usage:
 *   import { RenderBlocksResponseSchema, parseBlocks } from '@/types/render-blocks.schema';
 *   const validated = parseBlocks(serverResponse);
 */

import { z } from "zod";

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
// Enum Schemas (strict validation with defaults)
// =============================================================================

export const BlockTypeSchema = z.enum([
  "narrative",
  "ranked_list",
  "split_compare",
  "evidence",
  "deep_dive",
  "model_trust",
]);

export const ChipKindSchema = z
  .enum(["sector", "model", "factor", "signal", "warning", "geo"])
  .default("model");

export const ColumnKindSchema = z
  .enum([
    "rank",
    "ticker",
    "metric",
    "confidence",
    "direction",
    "text",
    "date",
    "percent",
    "currency",
  ])
  .default("text");

export const ActionTypeSchema = z
  .enum(["deep_dive", "show_evidence", "compare", "simulate", "add_to_watchlist"])
  .default("deep_dive");

export const EvidenceKindSchema = z
  .enum(["factor_beta", "graph_path", "filing_snippet", "model_signal", "news_item"])
  .default("filing_snippet");

export const ToneSchema = z
  .enum(["analyst", "conversational", "warning"])
  .default("analyst");

export const DefaultStateSchema = z
  .enum(["collapsed", "expanded"])
  .default("collapsed");

// =============================================================================
// Shared Schemas
// =============================================================================

export const MetricValueSchema = z.object({
  value: z.union([z.number(), z.string(), z.null()]),
  format: z.enum(["number", "percent", "currency", "text"]).default("number"),
  display: z.string().optional(),
  suffix: z.string().default(""),
  prefix: z.string().default(""),
  decimals: z.number().default(2),
});

export const ChipSchema = z.object({
  label: z.string(),
  kind: ChipKindSchema,
});

export const ActionSchema = z.object({
  type: ActionTypeSchema,
  label: z.string(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const ColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: ColumnKindSchema,
  width: z.string().optional(),
});

export const PaginationSchema = z.object({
  default_limit: z.number().default(MAX_ROWS_DEFAULT_DISPLAY),
  total_rows: z.number().default(0),
  current_page: z.number().default(1),
});

// =============================================================================
// Row Schema (for ranked_list and split_compare)
// =============================================================================

export const RankedRowSchema = z
  .object({
    key: z.string(),
    rank: z.number().optional(),
    ticker: z.string().optional(),
    company: z.string().optional(),
    chips: z.array(ChipSchema).default([]),
    actions: z.array(ActionSchema).default([]),
  })
  .passthrough(); // Allow additional metric fields

// =============================================================================
// Block Schemas
// =============================================================================

export const NarrativeBlockSchema = z.object({
  type: z.literal("narrative"),
  id: z.string(),
  title: z.string().default("Answer"),
  text: z.string(),
  tone: ToneSchema,
  disclaimer: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const RankedListBlockSchema = z.object({
  type: z.literal("ranked_list"),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  columns: z.array(ColumnSchema),
  rows: z.array(RankedRowSchema),
  pagination: PaginationSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const SplitCompareBlockSchema = z.object({
  type: z.literal("split_compare"),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  left: z.object({
    label: z.string(),
    block: RankedListBlockSchema,
  }),
  right: z.object({
    label: z.string(),
    block: RankedListBlockSchema,
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const EvidenceItemSchema = z
  .object({
    kind: EvidenceKindSchema,
  })
  .passthrough();

export const EvidenceTabSchema = z.object({
  key: z.string(),
  label: z.string(),
  items: z.array(EvidenceItemSchema),
});

export const EvidenceBlockSchema = z.object({
  type: z.literal("evidence"),
  id: z.string(),
  title: z.string().default("Receipts"),
  default_state: DefaultStateSchema,
  tabs: z.array(EvidenceTabSchema),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// Lazy evaluation for recursive DeepDiveBlock
export const DeepDiveTabSchema: z.ZodType<{
  key: string;
  label: string;
  blocks: unknown[];
}> = z.lazy(() =>
  z.object({
    key: z.string(),
    label: z.string(),
    blocks: z.array(RenderBlockSchema),
  })
);

export const DeepDiveBlockSchema = z.object({
  type: z.literal("deep_dive"),
  id: z.string(),
  ticker: z.string(),
  header: z.object({
    title: z.string(),
    subtitle: z.string(),
    badges: z.array(ChipSchema).default([]),
  }),
  default_tab: z.string().default("signals"),
  tabs: z.array(DeepDiveTabSchema),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const ModelTrustSectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  items: z.array(z.record(z.string(), z.unknown())),
});

export const ModelTrustBlockSchema = z.object({
  type: z.literal("model_trust"),
  id: z.string(),
  title: z.string().default("Model trust"),
  default_state: DefaultStateSchema,
  summary: z
    .object({
      period: z.string(),
      overall_hit_rate: z.number(),
      avg_return_5d_bp: z.number().optional(),
    })
    .passthrough(),
  sections: z.array(ModelTrustSectionSchema),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// Union Schema for All Blocks
// =============================================================================

export const RenderBlockSchema = z.discriminatedUnion("type", [
  NarrativeBlockSchema,
  RankedListBlockSchema,
  SplitCompareBlockSchema,
  EvidenceBlockSchema,
  DeepDiveBlockSchema,
  ModelTrustBlockSchema,
]);

// =============================================================================
// Response Envelope Schema
// =============================================================================

export const DebugInfoSchema = z.object({
  tool_trace: z.array(
    z.object({
      tool: z.string(),
      arguments: z.record(z.string(), z.unknown()),
      timing_ms: z.number().optional(),
    })
  ),
  raw_tool_outputs: z.record(z.string(), z.unknown()),
  tool_results: z.array(z.unknown()).optional(),
  message_id: z.string().optional(),
  created_at: z.string().optional(),
});

export const RenderBlocksResponseSchema = z.object({
  schema_version: z.string().default(SCHEMA_VERSION),
  message_id: z.string(),
  created_at: z.string(),
  blocks: z.array(RenderBlockSchema),
  _debug: DebugInfoSchema.optional(),
});

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type BlockType = z.infer<typeof BlockTypeSchema>;
export type ChipKind = z.infer<typeof ChipKindSchema>;
export type ColumnKind = z.infer<typeof ColumnKindSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type EvidenceKind = z.infer<typeof EvidenceKindSchema>;

export type MetricValue = z.infer<typeof MetricValueSchema>;
export type Chip = z.infer<typeof ChipSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type RankedRow = z.infer<typeof RankedRowSchema>;

export type NarrativeBlock = z.infer<typeof NarrativeBlockSchema>;
export type RankedListBlock = z.infer<typeof RankedListBlockSchema>;
export type SplitCompareBlock = z.infer<typeof SplitCompareBlockSchema>;
export type EvidenceBlock = z.infer<typeof EvidenceBlockSchema>;
export type DeepDiveBlock = z.infer<typeof DeepDiveBlockSchema>;
export type ModelTrustBlock = z.infer<typeof ModelTrustBlockSchema>;
export type RenderBlock = z.infer<typeof RenderBlockSchema>;

export type RenderBlocksResponse = z.infer<typeof RenderBlocksResponseSchema>;

// =============================================================================
// Parsing Utilities
// =============================================================================

/**
 * Parse and validate blocks from server response.
 * Returns validated blocks or throws ZodError.
 */
export function parseBlocks(data: unknown): RenderBlock[] {
  const result = z.array(RenderBlockSchema).safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("Block validation failed:", result.error.issues);
  return []; // Return empty on failure, don't crash
}

/**
 * Parse full response envelope.
 */
export function parseResponse(data: unknown): RenderBlocksResponse | null {
  const result = RenderBlocksResponseSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error("Response validation failed:", result.error.issues);
  return null;
}

/**
 * Safe metric display - handles null/undefined gracefully.
 */
export function safeMetricDisplay(metric: unknown): string {
  if (metric === null || metric === undefined) {
    return NULL_NUMERIC_DISPLAY;
  }

  if (typeof metric === "object" && metric !== null) {
    const m = metric as Record<string, unknown>;
    if ("display" in m && typeof m.display === "string") {
      return m.display;
    }
    if ("value" in m) {
      if (m.value === null || m.value === undefined) {
        return NULL_NUMERIC_DISPLAY;
      }
      const prefix = typeof m.prefix === "string" ? m.prefix : "";
      const suffix = typeof m.suffix === "string" ? m.suffix : "";
      return `${prefix}${m.value}${suffix}`;
    }
  }

  if (typeof metric === "number") {
    return metric.toFixed(2);
  }

  return String(metric);
}

/**
 * Check if a string matches filtered entity patterns (PERSON:*, ENTITY:*).
 * UI-side guardrail.
 */
export function isFilteredEntity(text: string): boolean {
  if (!text) return false;
  return /^(PERSON|ENTITY|person|entity):/.test(text);
}

/**
 * Filter entities from an array of items.
 */
export function filterEntities<T extends Record<string, unknown>>(
  items: T[],
  key: string = "ticker"
): T[] {
  return items.filter((item) => !isFilteredEntity(String(item[key] || "")));
}
