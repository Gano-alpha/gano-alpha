// =============================================================================
// Block State Machine for GANO Chat Messages
// =============================================================================

// Block state types
export type BlockState = "collapsed" | "expanded" | "peek";

export type BlockExpansionReason =
  | "default"
  | "user_clicked"
  | "user_asked_why"
  | "user_asked_show_proof"
  | "followup_context"
  | "system_safety"
  | "low_confidence";

export type BlockType =
  | "narrative"
  | "ranked_list"
  | "split_compare"
  | "evidence"
  | "deep_dive"
  | "trust";

export type EvidencePill = "factor" | "paths" | "filings";

// Block configuration
export interface BlockConfig {
  id: string;
  type: BlockType;
  state: BlockState;
  reason: BlockExpansionReason;
  activePill?: EvidencePill; // For evidence block
  rowCount?: number; // For ranked list peek logic
}

// Message artifact structure
export interface MessageBlocks {
  messageId: string;
  blocks: BlockConfig[];
  confidence?: number;
  showLowConfidenceWarning?: boolean;
}

// UI Events
export type UIEvent =
  | { type: "USER_CLICK_BLOCK_TOGGLE"; messageId: string; blockId: string }
  | { type: "USER_CLICK_EVIDENCE_PILL"; messageId: string; pill: EvidencePill }
  | { type: "USER_CLICK_ROW"; messageId: string; rowKey: string; action: "deep_dive" | "evidence" }
  | { type: "USER_ASKED_WHY"; messageId: string }
  | { type: "USER_CLICK_SHOW_MORE"; messageId: string; blockId: string }
  | { type: "USER_CLICK_SHOW_LESS"; messageId: string; blockId: string }
  | { type: "SYSTEM_NEW_RESPONSE"; messageId: string; blocks: Omit<BlockConfig, "state" | "reason">[]; confidence?: number };

// Default states per block type
export const DEFAULT_BLOCK_STATES: Record<BlockType, BlockState> = {
  narrative: "expanded",
  ranked_list: "peek", // Will be expanded if <= 5 rows
  split_compare: "expanded",
  evidence: "collapsed",
  deep_dive: "expanded",
  trust: "collapsed",
};

// =============================================================================
// Reducer Functions
// =============================================================================

function initializeBlocksWithDefaults(
  state: Record<string, MessageBlocks>,
  event: Extract<UIEvent, { type: "SYSTEM_NEW_RESPONSE" }>
): Record<string, MessageBlocks> {
  const blocks: BlockConfig[] = event.blocks.map((block) => {
    let defaultState = DEFAULT_BLOCK_STATES[block.type];

    // Special case: ranked_list with <= 5 rows is expanded
    if (block.type === "ranked_list" && block.rowCount && block.rowCount <= 5) {
      defaultState = "expanded";
    }

    return {
      ...block,
      state: defaultState,
      reason: "default" as const,
    };
  });

  const showLowConfidenceWarning = event.confidence !== undefined && event.confidence < 0.4;

  return {
    ...state,
    [event.messageId]: {
      messageId: event.messageId,
      blocks,
      confidence: event.confidence,
      showLowConfidenceWarning,
    },
  };
}

function toggleEvidencePill(
  state: Record<string, MessageBlocks>,
  event: Extract<UIEvent, { type: "USER_CLICK_EVIDENCE_PILL" }>
): Record<string, MessageBlocks> {
  const message = state[event.messageId];
  if (!message) return state;

  const updatedBlocks = message.blocks.map((block) => {
    if (block.type !== "evidence") return block;

    // If collapsed -> expand with this pill
    if (block.state === "collapsed") {
      return {
        ...block,
        state: "expanded" as const,
        reason: "user_clicked" as const,
        activePill: event.pill,
      };
    }

    // If expanded and same pill -> collapse
    if (block.activePill === event.pill) {
      return {
        ...block,
        state: "collapsed" as const,
        reason: "user_clicked" as const,
        activePill: undefined,
      };
    }

    // If expanded and different pill -> switch tab
    return {
      ...block,
      activePill: event.pill,
    };
  });

  return {
    ...state,
    [event.messageId]: {
      ...message,
      blocks: updatedBlocks,
    },
  };
}

function toggleBlock(
  state: Record<string, MessageBlocks>,
  event: Extract<UIEvent, { type: "USER_CLICK_BLOCK_TOGGLE" }>
): Record<string, MessageBlocks> {
  const message = state[event.messageId];
  if (!message) return state;

  const updatedBlocks = message.blocks.map((block) => {
    if (block.id !== event.blockId) return block;

    const newState = block.state === "expanded" ? "collapsed" : "expanded";
    return {
      ...block,
      state: newState as BlockState,
      reason: "user_clicked" as const,
    };
  });

  return {
    ...state,
    [event.messageId]: {
      ...message,
      blocks: updatedBlocks,
    },
  };
}

function handleShowMore(
  state: Record<string, MessageBlocks>,
  event: Extract<UIEvent, { type: "USER_CLICK_SHOW_MORE" }>
): Record<string, MessageBlocks> {
  const message = state[event.messageId];
  if (!message) return state;

  const updatedBlocks = message.blocks.map((block) => {
    if (block.id !== event.blockId) return block;
    return {
      ...block,
      state: "expanded" as const,
      reason: "user_clicked" as const,
    };
  });

  return {
    ...state,
    [event.messageId]: {
      ...message,
      blocks: updatedBlocks,
    },
  };
}

function handleShowLess(
  state: Record<string, MessageBlocks>,
  event: Extract<UIEvent, { type: "USER_CLICK_SHOW_LESS" }>
): Record<string, MessageBlocks> {
  const message = state[event.messageId];
  if (!message) return state;

  const updatedBlocks = message.blocks.map((block) => {
    if (block.id !== event.blockId) return block;
    return {
      ...block,
      state: "peek" as const,
      reason: "user_clicked" as const,
    };
  });

  return {
    ...state,
    [event.messageId]: {
      ...message,
      blocks: updatedBlocks,
    },
  };
}

// Main reducer
export function blocksReducer(
  state: Record<string, MessageBlocks>,
  event: UIEvent
): Record<string, MessageBlocks> {
  switch (event.type) {
    case "SYSTEM_NEW_RESPONSE":
      return initializeBlocksWithDefaults(state, event);
    case "USER_CLICK_EVIDENCE_PILL":
      return toggleEvidencePill(state, event);
    case "USER_CLICK_BLOCK_TOGGLE":
      return toggleBlock(state, event);
    case "USER_CLICK_SHOW_MORE":
      return handleShowMore(state, event);
    case "USER_CLICK_SHOW_LESS":
      return handleShowLess(state, event);
    default:
      return state;
  }
}

// =============================================================================
// Thread Title Generation (Rule-based, deterministic)
// =============================================================================

export interface ThreadContext {
  toolsCalled?: string[];
  scenarioType?: string;
  topTicker?: string;
  macroEvent?: string;
  region?: string;
  asOfDate?: string;
}

export function generateThreadTitle(context: ThreadContext, question: string): string {
  const { toolsCalled = [], scenarioType, topTicker, macroEvent, region, asOfDate } = context;

  // Priority 1: Scenario with region/ticker
  if (scenarioType && (region || topTicker)) {
    if (region) {
      return `${region} shock — ${topTicker || "exposure"}`;
    }
    return `${scenarioType} — ${topTicker || "analysis"}`;
  }

  // Priority 2: Factor/macro event
  if (toolsCalled.includes("screen_by_factor") || macroEvent) {
    const event = macroEvent || extractMacroEvent(question);
    return `${event} — winners/losers`;
  }

  // Priority 3: Top signals
  if (toolsCalled.includes("get_top_signals")) {
    return `Top signals — ${asOfDate || "today"}`;
  }

  // Priority 4: Analyze ticker
  if (toolsCalled.includes("analyze_ticker") && topTicker) {
    return `${topTicker} — deep dive`;
  }

  // Priority 5: Early warning / risk
  if (toolsCalled.includes("get_early_warning") && topTicker) {
    return `${topTicker} — risk check`;
  }

  // Fallback: First 40 chars of question
  return question.slice(0, 40) + (question.length > 40 ? "..." : "");
}

function extractMacroEvent(question: string): string {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes("rate cut") || lowerQ.includes("fed cut")) return "Rate cuts";
  if (lowerQ.includes("rate hike") || lowerQ.includes("fed hike")) return "Rate hikes";
  if (lowerQ.includes("inflation")) return "Inflation";
  if (lowerQ.includes("recession")) return "Recession";
  if (lowerQ.includes("china") || lowerQ.includes("taiwan")) return "Geopolitical";
  if (lowerQ.includes("tariff")) return "Tariffs";
  if (lowerQ.includes("oil") || lowerQ.includes("energy")) return "Energy shock";

  return "Macro scenario";
}

// =============================================================================
// Thread metadata chip types
// =============================================================================

export type ThreadChipType = "macro" | "scenario" | "signals" | "risk" | "ticker";

export function getThreadChips(context: ThreadContext): ThreadChipType[] {
  const chips: ThreadChipType[] = [];
  const { toolsCalled = [] } = context;

  if (toolsCalled.includes("answer_scenario") || toolsCalled.includes("screen_by_factor")) {
    chips.push("scenario");
  }
  if (toolsCalled.includes("get_macro_regime")) {
    chips.push("macro");
  }
  if (toolsCalled.includes("get_top_signals")) {
    chips.push("signals");
  }
  if (toolsCalled.includes("get_early_warning")) {
    chips.push("risk");
  }
  if (toolsCalled.includes("analyze_ticker")) {
    chips.push("ticker");
  }

  return chips.slice(0, 2); // Max 2 chips
}
