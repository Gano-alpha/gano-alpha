"use client";

import { useReducer, useCallback, useMemo } from "react";
import {
  blocksReducer,
  type BlockConfig,
  type EvidencePill,
  type MessageBlocks,
} from "@/lib/block-state";
import { NarrativeBlock, RankedListBlock, EvidenceBlock, SplitCompareBlock } from "@/components/blocks";
import { Zap, Shield, AlertTriangle } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface StructuredResponse {
  narrative: string;
  confidence: number;
  impactRange?: {
    low: string;
    mid: string;
    high: string;
  };
  rankedResults?: Array<{
    rank: number;
    ticker: string;
    metric: string;
    value: string;
    confidence: number;
  }>;
  splitCompare?: {
    leftTitle: string;
    rightTitle: string;
    leftItems: Array<{ ticker: string; metric: string; value: string }>;
    rightItems: Array<{ ticker: string; metric: string; value: string }>;
  };
  analystConsensus?: {
    og?: ModelView;
    sniper?: ModelView;
    consensus: string;
    divergenceReason?: string;
  };
  confidenceStory?: string[];
  insufficientData?: boolean;
}

interface ModelView {
  signal: string;
  headline: string;
  actionBias: string;
  reasoning: string[];
  conviction: number;
}

interface AssistantMessageProps {
  messageId: string;
  response: StructuredResponse;
  toolType?: string;
  processingTime?: number;
  onTickerClick?: (ticker: string) => void;
}

// =============================================================================
// Message Header Component
// =============================================================================

function MessageHeader({
  toolType = "Scenario Analysis",
  processingTime,
}: {
  toolType?: string;
  processingTime?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted mb-4">
      <span className="font-medium text-secondary">GANO</span>
      <span>•</span>
      <span>{toolType}</span>
      {processingTime && (
        <>
          <span>•</span>
          <span className="tabular-nums">{processingTime}s</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Low Confidence Warning
// =============================================================================

function LowConfidenceWarning() {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
      <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-amber-200">
        Low confidence — receipts are thin. Treat as directional, not decisive.
      </p>
    </div>
  );
}

// =============================================================================
// Model Perspectives Component
// =============================================================================

function ModelPerspectives({
  og,
  sniper,
}: {
  og?: ModelView;
  sniper?: ModelView;
}) {
  if (!og && !sniper) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {og && (
        <div
          className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5"
          style={{
            animation: "fade-slide-in 0.2s ease-out forwards",
            animationDelay: "100ms",
            opacity: 0,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-400">OG (Defensive)</span>
          </div>
          <p className="text-sm text-primary font-medium mb-1">
            {og.signal}. Conviction {og.conviction?.toFixed(2) || "0.72"}
          </p>
          <p className="text-xs text-secondary">{og.headline}</p>
          {og.reasoning && og.reasoning.length > 0 && (
            <ul className="mt-2 space-y-1">
              {og.reasoning.slice(0, 2).map((reason, i) => (
                <li key={i} className="text-xs text-muted">• {reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sniper && (
        <div
          className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5"
          style={{
            animation: "fade-slide-in 0.2s ease-out forwards",
            animationDelay: "150ms",
            opacity: 0,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Sniper (Aggressive)</span>
          </div>
          <p className="text-sm text-primary font-medium mb-1">
            {sniper.signal}. Conviction {sniper.conviction?.toFixed(2) || "0.85"}
          </p>
          <p className="text-xs text-secondary">{sniper.headline}</p>
          {sniper.reasoning && sniper.reasoning.length > 0 && (
            <ul className="mt-2 space-y-1">
              {sniper.reasoning.slice(0, 2).map((reason, i) => (
                <li key={i} className="text-xs text-muted">• {reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Assistant Message Component
// =============================================================================

export function AssistantMessage({
  messageId,
  response,
  toolType,
  processingTime,
  onTickerClick,
}: AssistantMessageProps) {
  // Initialize block state
  const initialBlocks = useMemo(() => {
    const blocks: Omit<BlockConfig, "state" | "reason">[] = [];

    // Always add narrative
    blocks.push({ id: `${messageId}-narrative`, type: "narrative" });

    // Add ranked list or split compare
    if (response.splitCompare) {
      blocks.push({
        id: `${messageId}-split`,
        type: "split_compare",
        rowCount: Math.max(
          response.splitCompare.leftItems.length,
          response.splitCompare.rightItems.length
        ),
      });
    } else if (response.rankedResults && response.rankedResults.length > 0) {
      blocks.push({
        id: `${messageId}-ranked`,
        type: "ranked_list",
        rowCount: response.rankedResults.length,
      });
    }

    // Add evidence if we have supporting data
    if (response.confidenceStory || response.rankedResults) {
      blocks.push({ id: `${messageId}-evidence`, type: "evidence" });
    }

    return blocks;
  }, [messageId, response]);

  const [blockStates, dispatch] = useReducer(blocksReducer, {}, () => {
    const initial: Record<string, MessageBlocks> = {};
    return blocksReducer(initial, {
      type: "SYSTEM_NEW_RESPONSE",
      messageId,
      blocks: initialBlocks,
      confidence: response.confidence,
    });
  });

  const messageState = blockStates[messageId];
  const showLowConfidenceWarning = messageState?.showLowConfidenceWarning;

  // Get block state helper
  const getBlockState = useCallback(
    (blockId: string) => {
      return messageState?.blocks.find((b) => b.id === blockId);
    },
    [messageState]
  );

  // Handlers
  const handleEvidencePillClick = useCallback(
    (pill: EvidencePill) => {
      dispatch({
        type: "USER_CLICK_EVIDENCE_PILL",
        messageId,
        pill,
      });
    },
    [messageId]
  );

  const handleShowMore = useCallback(
    (blockId: string) => {
      dispatch({
        type: "USER_CLICK_SHOW_MORE",
        messageId,
        blockId,
      });
    },
    [messageId]
  );

  const handleShowLess = useCallback(
    (blockId: string) => {
      dispatch({
        type: "USER_CLICK_SHOW_LESS",
        messageId,
        blockId,
      });
    },
    [messageId]
  );

  // Insufficient data state
  if (response.insufficientData) {
    return (
      <div className="space-y-0">
        <MessageHeader toolType={toolType} processingTime={processingTime} />
        <div className="p-6 bg-surface border border-border rounded-xl text-center">
          <p className="text-secondary mb-2">Not enough data to support a conclusion.</p>
          <p className="text-xs text-muted">We&apos;d rather say &quot;unknown&quot; than guess.</p>
        </div>
      </div>
    );
  }

  // Transform data for blocks
  const rankedItems = response.rankedResults?.map((item) => ({
    rank: item.rank,
    ticker: item.ticker,
    primaryMetric: {
      label: item.metric,
      value: item.value,
    },
    confidence: item.confidence,
    chips: [] as Array<{ label: string; type: "model" | "sector" | "risk" | "event" }>,
  })) || [];

  const evidenceData = {
    factorProof: response.confidenceStory
      ? {
          factors: response.confidenceStory.map((story, i) => ({
            name: `Factor ${i + 1}`,
            beta: 0,
            rSquared: 0,
            pValue: 0,
            description: story,
          })),
        }
      : undefined,
    graphPaths: undefined,
    sourceFilings: undefined,
  };

  const rankedBlockState = getBlockState(`${messageId}-ranked`);
  const evidenceBlockState = getBlockState(`${messageId}-evidence`);
  const isPeek = rankedBlockState?.state === "peek";
  const visibleCount = isPeek ? 5 : rankedItems.length;

  return (
    <div className="space-y-0">
      {/* Message Header */}
      <MessageHeader toolType={toolType} processingTime={processingTime} />

      {/* Low Confidence Warning */}
      {showLowConfidenceWarning && <LowConfidenceWarning />}

      {/* Narrative - Always first, full-width, no box */}
      {response.narrative && (
        <div className="mb-6">
          <p className="text-secondary leading-relaxed text-[15px]">
            {response.narrative}
          </p>
          {response.impactRange && (
            <p className="text-xs text-muted mt-2">
              Impact range: {response.impactRange.low} to {response.impactRange.high}
            </p>
          )}
        </div>
      )}

      {/* Split Compare Block */}
      {response.splitCompare && (
        <SplitCompareBlock
          title="Scenario Analysis"
          subtitle="Stocks ranked by factor sensitivity and model conviction"
          left={{
            label: response.splitCompare.leftTitle,
            items: response.splitCompare.leftItems.map((item, i) => ({
              rank: i + 1,
              ticker: item.ticker,
              value: item.value,
              confidence: 0.75,
            })),
          }}
          right={{
            label: response.splitCompare.rightTitle,
            items: response.splitCompare.rightItems.map((item, i) => ({
              rank: i + 1,
              ticker: item.ticker,
              value: item.value,
              confidence: 0.75,
            })),
          }}
          metric="factor sensitivity"
          onTickerClick={onTickerClick}
        />
      )}

      {/* Ranked List Block */}
      {rankedItems.length > 0 && !response.splitCompare && (
        <div className="mb-4">
          <RankedListBlock
            items={rankedItems.slice(0, visibleCount)}
            footer="Ranked by sensitivity, confidence, and data quality."
            onTickerClick={onTickerClick}
          />
          {rankedItems.length > 5 && (
            <button
              onClick={() =>
                isPeek
                  ? handleShowMore(`${messageId}-ranked`)
                  : handleShowLess(`${messageId}-ranked`)
              }
              className="w-full mt-2 px-4 py-2 text-xs text-muted hover:text-secondary transition-colors"
            >
              {isPeek ? `Show ${rankedItems.length - 5} more` : "Show less"}
            </button>
          )}
        </div>
      )}

      {/* Evidence Block */}
      {(response.confidenceStory || response.rankedResults) && (
        <EvidenceBlock
          ticker={rankedItems[0]?.ticker || "Analysis"}
          factorProof={evidenceData.factorProof}
          graphPaths={evidenceData.graphPaths}
          sourceFilings={evidenceData.sourceFilings}
          defaultState={evidenceBlockState?.state || "collapsed"}
          activePill={evidenceBlockState?.activePill}
          onPillClick={handleEvidencePillClick}
        />
      )}

      {/* Model Perspectives */}
      <ModelPerspectives
        og={response.analystConsensus?.og}
        sniper={response.analystConsensus?.sniper}
      />

      {/* Confidence Footer */}
      {response.confidence > 0 && !showLowConfidenceWarning && (
        <div
          className="flex items-center justify-between text-xs text-muted pt-4 mt-4 border-t border-border"
          style={{
            animation: "fade-in 0.3s ease-out forwards",
            animationDelay: "200ms",
            opacity: 0,
          }}
        >
          <span>Confidence: {(response.confidence * 100).toFixed(0)}%</span>
          <span>Multiple models consulted</span>
        </div>
      )}
    </div>
  );
}
