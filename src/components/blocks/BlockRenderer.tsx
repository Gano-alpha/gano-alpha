"use client";

import { useCallback } from "react";
import {
  type RenderBlock,
  type NarrativeBlock as NarrativeBlockType,
  type RankedListBlock as RankedListBlockType,
  type SplitCompareBlock as SplitCompareBlockType,
  type EvidenceBlock as EvidenceBlockType,
  type DeepDiveBlock as DeepDiveBlockType,
  type ModelTrustBlock as ModelTrustBlockType,
  isNarrativeBlock,
  isRankedListBlock,
  isSplitCompareBlock,
  isEvidenceBlock,
  isDeepDiveBlock,
  isModelTrustBlock,
  formatMetricDisplay,
} from "@/types/render-blocks";
import { NarrativeBlock } from "./NarrativeBlock";
import { RankedListBlock } from "./RankedListBlock";
import { SplitCompareBlock } from "./SplitCompareBlock";
import { EvidenceBlock } from "./EvidenceBlock";
import { TickerDeepDiveBlock } from "./TickerDeepDiveBlock";
import { ModelTrustBlock } from "./ModelTrustBlock";

interface BlockRendererProps {
  blocks: RenderBlock[];
  onTickerClick?: (ticker: string) => void;
  onActionClick?: (action: string, payload: Record<string, unknown>) => void;
  className?: string;
}

/**
 * BlockRenderer - Universal renderer for GANO render blocks
 *
 * Takes server-emitted blocks and dispatches to appropriate components.
 * This is the "dumb renderer" that has no business logic - just rendering.
 */
export function BlockRenderer({
  blocks,
  onTickerClick,
  onActionClick,
  className = "",
}: BlockRendererProps) {
  const handleTickerClick = useCallback(
    (ticker: string) => {
      onTickerClick?.(ticker);
    },
    [onTickerClick]
  );

  const handleActionClick = useCallback(
    (actionType: string, payload: Record<string, unknown>) => {
      if (actionType === "deep_dive" && payload.ticker) {
        onTickerClick?.(String(payload.ticker));
      } else {
        onActionClick?.(actionType, payload);
      }
    },
    [onTickerClick, onActionClick]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block) => (
        <BlockDispatcher
          key={block.id}
          block={block}
          onTickerClick={handleTickerClick}
          onActionClick={handleActionClick}
        />
      ))}
    </div>
  );
}

interface BlockDispatcherProps {
  block: RenderBlock;
  onTickerClick?: (ticker: string) => void;
  onActionClick?: (actionType: string, payload: Record<string, unknown>) => void;
}

function BlockDispatcher({ block, onTickerClick, onActionClick }: BlockDispatcherProps) {
  if (isNarrativeBlock(block)) {
    return <RenderNarrativeBlock block={block} />;
  }

  if (isRankedListBlock(block)) {
    return (
      <RenderRankedListBlock
        block={block}
        onTickerClick={onTickerClick}
        onActionClick={onActionClick}
      />
    );
  }

  if (isSplitCompareBlock(block)) {
    return (
      <RenderSplitCompareBlock
        block={block}
        onTickerClick={onTickerClick}
      />
    );
  }

  if (isEvidenceBlock(block)) {
    return <RenderEvidenceBlock block={block} />;
  }

  if (isDeepDiveBlock(block)) {
    return (
      <RenderDeepDiveBlock
        block={block}
        onTickerClick={onTickerClick}
      />
    );
  }

  if (isModelTrustBlock(block)) {
    return <RenderModelTrustBlock block={block} />;
  }

  // Unknown block type - render nothing
  console.warn("Unknown block type:", block);
  return null;
}

// =============================================================================
// Individual Block Renderers (adapt server schema to component props)
// =============================================================================

function RenderNarrativeBlock({ block }: { block: NarrativeBlockType }) {
  // Parse text into findings (split by newlines or bullet points)
  const lines = block.text.split(/\n+/).filter(Boolean);
  const scenario = lines[0];
  const findings = lines.slice(1).filter((l) => l.trim().length > 0);

  return (
    <NarrativeBlock
      scenario={scenario}
      findings={findings}
      interpretation={block.disclaimer}
    />
  );
}

function RenderRankedListBlock({
  block,
  onTickerClick,
  onActionClick,
}: {
  block: RankedListBlockType;
  onTickerClick?: (ticker: string) => void;
  onActionClick?: (actionType: string, payload: Record<string, unknown>) => void;
}) {
  // Transform server rows to component format
  const items = block.rows.map((row, i) => {
    // Find primary metric column
    const primaryCol = block.columns.find(
      (c) => c.kind === "metric" || c.key === "primary" || c.key === "conviction"
    );
    const primaryKey = primaryCol?.key || "primary";
    const primaryValue = row[primaryKey];

    return {
      rank: row.rank ?? i + 1,
      ticker: String(row.ticker || ""),
      primaryMetric: {
        label: primaryCol?.label || "Value",
        value: formatMetricDisplay(primaryValue),
      },
      confidence: extractConfidence(row),
      chips: (row.chips || []).map((chip) => ({
        label: chip.label,
        type: mapChipKindToType(chip.kind),
      })),
    };
  });

  const handleViewEvidence = onActionClick
    ? (ticker: string) => onActionClick("show_evidence", { ticker })
    : undefined;

  const handleDeepDive = onActionClick
    ? (ticker: string) => onActionClick("deep_dive", { ticker })
    : undefined;

  return (
    <RankedListBlock
      items={items}
      title={block.title}
      footer={block.subtitle || `${block.pagination.total_rows} items total`}
      initialVisibleCount={block.pagination.default_limit}
      onTickerClick={onTickerClick}
      onViewEvidence={handleViewEvidence}
      onDeepDive={handleDeepDive}
    />
  );
}

function RenderSplitCompareBlock({
  block,
  onTickerClick,
}: {
  block: SplitCompareBlockType;
  onTickerClick?: (ticker: string) => void;
}) {
  // Transform left/right rows
  const transformRows = (rows: typeof block.left.block.rows) =>
    rows.map((row, i) => ({
      rank: row.rank ?? i + 1,
      ticker: String(row.ticker || ""),
      value: formatMetricDisplay(row.primary || row.conviction),
      confidence: extractConfidence(row),
    }));

  return (
    <SplitCompareBlock
      title={block.title}
      subtitle={block.subtitle}
      left={{
        label: block.left.label,
        items: transformRows(block.left.block.rows),
      }}
      right={{
        label: block.right.label,
        items: transformRows(block.right.block.rows),
      }}
      metric="sensitivity"
      onTickerClick={onTickerClick}
    />
  );
}

function RenderEvidenceBlock({ block }: { block: EvidenceBlockType }) {
  // Transform tabs to EvidenceBlock format
  const factorProof = block.tabs.find((t) => t.key === "factors" || t.key === "betas");
  const graphPaths = block.tabs.find((t) => t.key === "paths" || t.key === "supply_chain");
  const sourceFilings = block.tabs.find((t) => t.key === "filings" || t.key === "articles");

  return (
    <EvidenceBlock
      ticker={String(block.meta?.ticker || "Analysis")}
      factorProof={
        factorProof
          ? {
              factors: factorProof.items.map((item) => ({
                name: String(item.factor || item.name || "Factor"),
                beta: Number(item.beta || 0),
                rSquared: Number(item.r_squared || item.rSquared || 0),
                pValue: Number(item.p_value || item.pValue || 0),
                description: String(item.description || ""),
              })),
            }
          : undefined
      }
      graphPaths={
        graphPaths
          ? {
              paths: graphPaths.items.map((item) => {
                const pathStr = typeof item.path === "string" ? item.path : "";
                const pathParts = pathStr.split("→");
                return {
                  from: String(item.from || pathParts[0] || ""),
                  to: String(item.to || pathParts[pathParts.length - 1] || ""),
                  via: item.via ? String(item.via) : undefined,
                  confidence: Number(item.confidence || 0),
                };
              }),
              totalEdges: graphPaths.items.length,
            }
          : undefined
      }
      sourceFilings={
        sourceFilings
          ? {
              filings: sourceFilings.items.map((item) => ({
                source: String(item.source || item.title || ""),
                date: String(item.date || item.published || ""),
                text: String(item.snippet || item.text || item.evidence || ""),
                type: item.type as "10-K" | "10-Q" | "8-K" | "Transcript" | undefined,
              })),
            }
          : undefined
      }
      defaultState={block.default_state}
    />
  );
}

function RenderDeepDiveBlock({
  block,
  onTickerClick,
}: {
  block: DeepDiveBlockType;
  onTickerClick?: (ticker: string) => void;
}) {
  // Extract signals from tabs
  const signalsTab = block.tabs.find((t) => t.key === "signals");
  const signals: Array<{
    model: "OG" | "Sniper";
    direction: "long" | "short" | "neutral";
    conviction: number;
    headline: string;
    reasoning?: string[];
  }> = [];

  if (signalsTab?.blocks?.[0]) {
    const signalBlock = signalsTab.blocks[0];
    if (isRankedListBlock(signalBlock)) {
      signalBlock.rows.forEach((row) => {
        const direction = String(row.direction || "neutral").toLowerCase();
        const conviction = extractConfidence(row);
        signals.push({
          model: "OG",
          direction: direction as "long" | "short" | "neutral",
          conviction,
          headline: `${block.ticker} ${direction} signal`,
        });
      });
    }
  }

  // Extract factors from tabs
  const factorsTab = block.tabs.find((t) => t.key === "factors");
  const factors: Array<{ name: string; beta: number; rSquared: number }> = [];

  if (factorsTab?.blocks?.[0]) {
    const factorBlock = factorsTab.blocks[0];
    if (isEvidenceBlock(factorBlock)) {
      factorBlock.tabs.forEach((tab) => {
        tab.items.forEach((item) => {
          if (item.kind === "factor_beta") {
            factors.push({
              name: String(item.factor || ""),
              beta: Number(item.beta || 0),
              rSquared: Number(item.r_squared || 0),
            });
          }
        });
      });
    }
  }

  return (
    <TickerDeepDiveBlock
      ticker={block.ticker}
      signals={signals}
      factors={factors}
      onClose={() => onTickerClick?.(block.ticker)}
    />
  );
}

function RenderModelTrustBlock({ block }: { block: ModelTrustBlockType }) {
  // Transform server data to ModelTrustBlock props format
  const byTierSection = block.sections.find((s) => s.key === "by_tier");
  const definitionsSection = block.sections.find((s) => s.key === "definitions");

  // Build models array from by_tier section
  const models: Array<{
    model: "OG" | "Sniper";
    hitRate: number;
    avgReturn: { high: number; medium: number; low: number };
    sampleSize: number;
  }> = [];

  if (byTierSection?.items) {
    // Group by model if present, otherwise create a single "OG" entry
    const ogItem = byTierSection.items.find((i) => String(i.tier).includes("OG") || String(i.model) === "OG");
    const sniperItem = byTierSection.items.find((i) => String(i.tier).includes("SNIPER") || String(i.model) === "Sniper");

    if (ogItem || block.summary) {
      models.push({
        model: "OG",
        hitRate: block.summary.overall_hit_rate || Number(ogItem?.hit_rate_5d || 0) / 100,
        avgReturn: {
          high: Number(ogItem?.avg_return_5d_bp || block.summary.avg_return_5d_bp || 0),
          medium: Number(block.summary.avg_return_5d_bp || 0) * 0.7,
          low: Number(block.summary.avg_return_5d_bp || 0) * 0.3,
        },
        sampleSize: Number(ogItem?.sample_size || 100),
      });
    }

    if (sniperItem) {
      models.push({
        model: "Sniper",
        hitRate: Number(sniperItem.hit_rate_5d || 0) / 100,
        avgReturn: {
          high: Number(sniperItem.avg_return_5d_bp || 0),
          medium: Number(sniperItem.avg_return_5d_bp || 0) * 0.7,
          low: Number(sniperItem.avg_return_5d_bp || 0) * 0.3,
        },
        sampleSize: Number(sniperItem.sample_size || 100),
      });
    }
  } else {
    // Fallback: create from summary
    models.push({
      model: "OG",
      hitRate: block.summary.overall_hit_rate || 0.68,
      avgReturn: {
        high: Number(block.summary.avg_return_5d_bp || 0),
        medium: Number(block.summary.avg_return_5d_bp || 0) * 0.7,
        low: Number(block.summary.avg_return_5d_bp || 0) * 0.3,
      },
      sampleSize: 100,
    });
  }

  // Build definitions
  const definitions = definitionsSection?.items.map((item) => ({
    term: String(item.term || ""),
    explanation: String(item.definition || ""),
  })) || [];

  return (
    <ModelTrustBlock
      models={models}
      definitions={definitions}
      defaultExpanded={block.default_state === "expanded"}
    />
  );
}

// =============================================================================
// Helpers
// =============================================================================

function extractConfidence(row: Record<string, unknown>): number {
  // Try different confidence field names
  const confValue =
    row.confidence ?? row.conviction ?? row.score ?? row.r_squared ?? 0.5;

  if (typeof confValue === "object" && confValue !== null && "value" in confValue) {
    return Number((confValue as { value: unknown }).value) || 0.5;
  }

  return Number(confValue) || 0.5;
}

function mapChipKindToType(kind: string): "model" | "sector" | "risk" | "event" {
  switch (kind) {
    case "model":
    case "signal":
      return "model";
    case "sector":
    case "geo":
      return "sector";
    case "warning":
      return "risk";
    case "factor":
    default:
      return "event";
  }
}

export default BlockRenderer;
