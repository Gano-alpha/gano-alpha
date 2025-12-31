"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ArrowLeft, Menu } from "lucide-react";
import { ThreadList, type Thread } from "@/components/chat/ThreadList";
import { ContextPanel } from "@/components/chat/ContextPanel";
import { AssistantMessage } from "@/components/chat/AssistantMessage";
import { TickerDeepDiveBlock } from "@/components/blocks";
import { generateThreadTitle, getThreadChips, type ThreadChipType } from "@/lib/block-state";
import { useAuth } from "@/contexts/auth-context";
import {
  sendChatQuery,
  getMacroContext,
  getContextSignals,
  getContextWarnings,
  type MacroContext,
  type ContextSignal,
  type ContextWarning,
  type ToolResult,
  type ChatQueryResponse,
} from "@/lib/api";

// =============================================================================
// Types
// =============================================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isLoading?: boolean;
  structuredResponse?: StructuredResponse;
  toolType?: string;
  processingTime?: number;
}

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

// =============================================================================
// Example Questions - Real investor intent, no emojis
// =============================================================================

const EXAMPLE_QUESTIONS = [
  "What should I buy today?",
  "Fed cuts rates — who benefits?",
  "Any red flags on NVDA?",
  "China invades Taiwan — who's exposed?",
  "Explore NVDA's supply chain",
];

// =============================================================================
// Follow-up placeholder suggestions
// =============================================================================

function getFollowUpPlaceholder(lastQuestion: string): string {
  const q = lastQuestion.toLowerCase();
  if (q.includes("rate") || q.includes("fed")) return "Compare against another scenario...";
  if (q.includes("risk") || q.includes("red flag")) return "Show opportunities instead...";
  if (q.includes("buy") || q.includes("benefit")) return "Show risks instead...";
  return "Ask a follow-up...";
}

// =============================================================================
// Main Chat Page
// =============================================================================

export default function ChatPage() {
  const { getAccessToken } = useAuth();

  // Thread state - start with a new empty conversation
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: "1",
      title: "New conversation",
      lastMessage: "",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string>("1");

  // Message store - keyed by thread ID
  const [messageStore, setMessageStore] = useState<Record<string, Message[]>>({});

  // Current thread messages (derived from store)
  const messages = messageStore[activeThreadId] || [];
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    setMessageStore((store) => {
      const currentMessages = store[activeThreadId] || [];
      const newMessages = typeof updater === "function" ? updater(currentMessages) : updater;
      return { ...store, [activeThreadId]: newMessages };
    });
  }, [activeThreadId]);

  // Input state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Deep dive modal state
  const [deepDiveTicker, setDeepDiveTicker] = useState<string | null>(null);

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Context panel data - fetched from real API
  const [macroContext, setMacroContext] = useState({
    vix: 0,
    vixChange: 0,
    vixRegime: "Normal" as const,
    rate10y: 0,
    rateChange: 0,
    creditSpread: "Loading...",
    spyChange: 0,
  });

  const [signals, setSignals] = useState<Array<{
    ticker: string;
    model: "OG" | "Sniper";
    direction: "long" | "short";
    score: number;
  }>>([]);

  const [warnings, setWarnings] = useState<Array<{
    ticker: string;
    type: string;
    severity: "high" | "medium" | "low";
  }>>([]);

  const [modelHealth, setModelHealth] = useState({
    status: "loading" as "healthy" | "degraded" | "offline" | "loading",
    lastUpdate: "...",
  });

  const [contextLoading, setContextLoading] = useState(true);

  // Fetch context panel data on mount
  useEffect(() => {
    const fetchContext = async () => {
      setContextLoading(true);
      try {
        // Fetch all context data in parallel
        const [macroRes, signalsRes, warningsRes] = await Promise.allSettled([
          getMacroContext(getAccessToken),
          getContextSignals(getAccessToken, 10),
          getContextWarnings(getAccessToken, 5),
        ]);

        // Process macro context
        if (macroRes.status === "fulfilled" && !macroRes.value.error) {
          const m = macroRes.value;
          setMacroContext({
            vix: m.vix || 0,
            vixChange: m.vix_change || 0,
            vixRegime: m.vix_regime || "Normal",
            rate10y: m.rate_10y || 0,
            rateChange: m.rate_change || 0,
            creditSpread: m.credit_regime || "N/A",
            spyChange: m.spy_change || 0,
          });
        }

        // Process signals
        if (signalsRes.status === "fulfilled" && signalsRes.value.signals) {
          setSignals(signalsRes.value.signals.map((s: ContextSignal) => ({
            ticker: s.ticker,
            model: s.model as "OG" | "Sniper",
            direction: s.direction as "long" | "short",
            score: s.score,
          })));
        }

        // Process warnings
        if (warningsRes.status === "fulfilled" && warningsRes.value.warnings) {
          setWarnings(warningsRes.value.warnings.map((w: ContextWarning) => ({
            ticker: w.ticker,
            type: w.type,
            severity: w.severity as "high" | "medium" | "low",
          })));
        }

        // Update model health based on data availability
        setModelHealth({
          status: "healthy",
          lastUpdate: "just now",
        });
      } catch (err) {
        console.error("Failed to fetch context:", err);
        setModelHealth({
          status: "degraded",
          lastUpdate: "error",
        });
      } finally {
        setContextLoading(false);
      }
    };

    fetchContext();
    // Refresh every 5 minutes
    const interval = setInterval(fetchContext, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getAccessToken]);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_QUESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handlers
  const handleNewThread = useCallback(() => {
    const newThread: Thread = {
      id: Date.now().toString(),
      title: "New conversation",
      lastMessage: "",
      timestamp: new Date().toISOString(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setMessages([]);
    setShowMobileSidebar(false);
    inputRef.current?.focus();
  }, []);

  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
    // Messages are derived from messageStore[activeThreadId]
    setShowMobileSidebar(false);
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        const remaining = threads.filter((t) => t.id !== threadId);
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id);
        } else {
          handleNewThread();
        }
      }
    },
    [activeThreadId, threads, handleNewThread]
  );

  const handleRenameThread = useCallback((threadId: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, title: newTitle } : t))
    );
  }, []);

  const handleTickerClick = useCallback((ticker: string) => {
    setDeepDiveTicker(ticker);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const startTime = Date.now();
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
          isLoading: true,
        },
      ]);

      try {
        // Option 3: ChatGPT selects tools, we get RAW structured results
        const data = await sendChatQuery(getAccessToken, userMessage.content);
        const processingTime = Math.round((Date.now() - startTime) / 1000);

        // Determine tool type from tools selected
        const toolsCalled = data.tools_selected?.map((tc) => tc.tool) || [];
        const primaryTool = toolsCalled[0] || "analysis";
        const toolTypeMap: Record<string, string> = {
          get_top_signals: "Signal Discovery",
          rank_signals_by_macro_scenario: "Scenario Analysis",
          analyze_ticker: "Ticker Analysis",
          get_tickers_by_factor: "Factor Screening",
          simulate_shock: "Shock Simulation",
          get_macro_data: "Market Context",
          answer_scenario: "Scenario Analysis",
          get_cross_factor_exposure: "Multi-Factor Screen",
        };
        const toolType = toolTypeMap[primaryTool] || "Analysis";

        // Update thread title if first message
        if (messages.length === 0) {
          const title = generateThreadTitle({ toolsCalled }, input);
          const chips = getThreadChips({ toolsCalled });
          setThreads((prev) =>
            prev.map((t) =>
              t.id === activeThreadId
                ? { ...t, title, lastMessage: input, chips }
                : t
            )
          );
        }

        if (!data.error && data.tool_results?.length > 0) {
          // Option 3: Transform raw tool results into structured UI response
          const structuredResponse = transformToolResultsToUI(
            data.tool_results,
            data.ui_hint,
            data.intent
          );

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isLoading: false,
                    structuredResponse,
                    toolType,
                    processingTime,
                  }
                : m
            )
          );

          // Update thread confidence
          setThreads((prev) =>
            prev.map((t) =>
              t.id === activeThreadId
                ? { ...t, confidence: structuredResponse.confidence }
                : t
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isLoading: false,
                    content: data.error || "No tools were able to process this query.",
                  }
                : m
            )
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isLoading: false,
                    content:
                      err.message === "Not authenticated"
                        ? "Please log in to continue."
                        : "Failed to connect. Please try again.",
                  }
                : m
            )
          );
        }
      }

      setIsLoading(false);
    },
    [input, isLoading, messages.length, activeThreadId, getAccessToken]
  );

  // =============================================================================
  // Option 3: Transform raw tool results into UI-ready structured response
  // =============================================================================
  function transformToolResultsToUI(
    toolResults: ToolResult[],
    uiHint: string | null,
    intent: string | null
  ): StructuredResponse {
    if (!toolResults?.length) {
      return {
        narrative: "No data available for this query.",
        confidence: 0,
        insufficientData: true,
      };
    }

    const primaryResult = toolResults[0];
    const result = primaryResult.result as Record<string, unknown>;
    const tool = primaryResult.tool;

    // Default response structure
    const response: StructuredResponse = {
      narrative: intent || `Results from ${tool}`,
      confidence: 0.75,
    };

    // Handle split_compare (rank_signals_by_macro_scenario, get_tickers_by_factor with both)
    if (uiHint === "split_compare" || tool === "rank_signals_by_macro_scenario") {
      const benefit = (result.benefit || result.beneficiaries || result.aligned_signals || []) as Array<Record<string, unknown>>;
      const hurt = (result.hurt || result.losers || []) as Array<Record<string, unknown>>;
      const scenario = (primaryResult.arguments as Record<string, unknown>).macro_event as string || "scenario";

      // Check if we have any data
      if (benefit.length === 0 && hurt.length === 0) {
        // No data - show informative message instead of empty split
        response.narrative = `No active signals found for the ${scenario.replace("_", " ")} scenario. This could mean:\n• No stocks currently meet the conviction threshold\n• Factor sensitivities are being recalculated\n\nTry asking for "top signals" or "analyze [ticker]" instead.`;
        response.confidence = 0.5;
        response.insufficientData = true;
        return response;
      }

      response.splitCompare = {
        leftTitle: "Benefit",
        rightTitle: "Hurt",
        leftItems: benefit.slice(0, 10).map((s) => ({
          ticker: String(s.ticker || ""),
          metric: formatFactorMetric(s),
          value: formatFactorValue(s),
        })),
        rightItems: hurt.slice(0, 10).map((s) => ({
          ticker: String(s.ticker || ""),
          metric: formatFactorMetric(s),
          value: formatFactorValue(s),
        })),
      };

      // Add narrative summary
      const benefitCount = benefit.length;
      const hurtCount = hurt.length;
      response.narrative = `${benefitCount} stocks benefit from ${scenario.replace("_", " ")}, ${hurtCount} get hurt. Ranked by factor sensitivity and model conviction.`;
      response.confidence = 0.82;

      // Also add as ranked results for alternate view
      if (benefit.length > 0) {
        response.rankedResults = benefit.slice(0, 10).map((s, i) => ({
          rank: i + 1,
          ticker: String(s.ticker || ""),
          metric: formatFactorMetric(s),
          value: formatFactorValue(s),
          confidence: Number(s.conviction || s.composite_score || 0.7),
        }));
      }

      return response;
    }

    // Handle ranked_list (get_top_signals, get_tickers_by_factor)
    if (uiHint === "ranked_list" || tool === "get_top_signals" || tool === "get_tickers_by_factor") {
      const signals = (result.signals || result.tickers || result.results || []) as Array<Record<string, unknown>>;

      if (signals.length === 0) {
        // No signals found
        const direction = (primaryResult.arguments as Record<string, unknown>).direction as string || "long";
        response.narrative = `No ${direction} signals found meeting the criteria. This could mean:\n• Models haven't generated fresh signals today\n• Conviction thresholds aren't being met\n\nTry "analyze [ticker]" for specific stock analysis.`;
        response.confidence = 0.5;
        response.insufficientData = true;
        return response;
      }

      response.rankedResults = signals.slice(0, 15).map((s, i) => ({
        rank: i + 1,
        ticker: String(s.ticker || ""),
        metric: s.model ? String(s.model).toUpperCase() : formatFactorMetric(s),
        value: formatSignalValue(s),
        confidence: Number(s.conviction || s.composite_score || s.score || 0.7),
      }));

      const direction = (primaryResult.arguments as Record<string, unknown>).direction as string || "long";
      response.narrative = `Top ${signals.length} ${direction} signals from GANO models. Ranked by conviction score.`;
      response.confidence = 0.78;

      return response;
    }

    // Handle ticker_deep_dive (analyze_ticker)
    if (uiHint === "ticker_deep_dive" || tool === "analyze_ticker") {
      const ticker = String(result.ticker || "");
      const supplyChain = result.supply_chain as Record<string, unknown> | undefined;
      const factors = result.factor_sensitivities as Record<string, number> | undefined;
      const modelSignals = result.model_signals as Record<string, Record<string, unknown>> | undefined;
      const warnings = result.early_warnings as Array<Record<string, unknown>> | undefined;

      // Build narrative from available data
      const narrativeParts: string[] = [];
      if (supplyChain) {
        const suppliers = (supplyChain.suppliers as Array<unknown>)?.length || 0;
        const customers = (supplyChain.customers as Array<unknown>)?.length || 0;
        narrativeParts.push(`${suppliers} suppliers, ${customers} customers in supply chain.`);
      }
      if (modelSignals?.og || modelSignals?.sniper) {
        const og = modelSignals.og;
        const sniper = modelSignals.sniper;
        if (og) narrativeParts.push(`OG model: ${og.direction} (${((og.conviction as number) * 100).toFixed(0)}% conviction)`);
        if (sniper) narrativeParts.push(`Sniper model: ${sniper.direction} (${((sniper.conviction as number) * 100).toFixed(0)}% conviction)`);
      }
      if (warnings?.length) {
        narrativeParts.push(`${warnings.length} early warning signals active.`);
      }

      response.narrative = narrativeParts.length > 0
        ? `${ticker}: ${narrativeParts.join(" ")}`
        : `Analysis for ${ticker}`;
      response.confidence = 0.85;

      // Add model perspectives if available
      if (modelSignals) {
        response.analystConsensus = {
          og: modelSignals.og ? {
            signal: String(modelSignals.og.direction || "neutral"),
            headline: `${String(modelSignals.og.direction || "neutral").toUpperCase()}`,
            actionBias: String(modelSignals.og.direction || "hold"),
            reasoning: [],
            conviction: Number(modelSignals.og.conviction || 0.5),
          } : undefined,
          sniper: modelSignals.sniper ? {
            signal: String(modelSignals.sniper.direction || "neutral"),
            headline: `${String(modelSignals.sniper.direction || "neutral").toUpperCase()}`,
            actionBias: String(modelSignals.sniper.direction || "hold"),
            reasoning: [],
            conviction: Number(modelSignals.sniper.conviction || 0.5),
          } : undefined,
          consensus: modelSignals.og?.direction === modelSignals.sniper?.direction
            ? "Models aligned"
            : "Models diverge",
        };
      }

      // Add factor sensitivities as evidence
      if (factors) {
        response.confidenceStory = [
          `Market beta: ${(factors.market_beta || 0).toFixed(2)}`,
          `Rate sensitivity: ${(factors.rate_10y_beta || 0).toFixed(2)}`,
          `VIX sensitivity: ${(factors.vix_beta || 0).toFixed(2)}`,
          `R²: ${((factors.r_squared || 0) * 100).toFixed(0)}%`,
        ];
      }

      return response;
    }

    // Handle conversational/product info responses
    if (tool === "get_product_info" || tool === "system_info" || tool === "system_response" || uiHint === "narrative") {
      const info = result as {
        name?: string;
        tagline?: string;
        description?: string;
        response?: string;
        capabilities?: Array<{ name: string; description: string }>;
        capabilities_summary?: string[];
        example_questions?: string[];
        suggested_questions?: string[];
      };

      response.narrative = info.description || info.response || "How can I help you with market research?";
      response.confidence = 1.0;

      // Add capabilities as confidence story
      if (info.capabilities_summary) {
        response.confidenceStory = info.capabilities_summary.map(c => `• ${c}`);
      } else if (info.capabilities) {
        response.confidenceStory = info.capabilities.map(c =>
          typeof c === "string" ? `• ${c}` : `• ${c.name}: ${c.description}`
        );
      }

      return response;
    }

    // Default: Try to extract any ranked data
    const anyList = Object.values(result).find(v => Array.isArray(v) && v.length > 0) as Array<Record<string, unknown>> | undefined;
    if (anyList) {
      response.rankedResults = anyList.slice(0, 10).map((s, i) => ({
        rank: i + 1,
        ticker: String(s.ticker || s.symbol || "N/A"),
        metric: "Score",
        value: formatSignalValue(s),
        confidence: 0.6,
      }));
    }

    return response;
  }

  // Helper formatters for transformToolResultsToUI
  function formatFactorMetric(s: Record<string, unknown>): string {
    if (s.factor) return String(s.factor).replace("_", " ");
    if (s.model) return String(s.model).toUpperCase();
    if (s.signal_tier) return String(s.signal_tier);
    return "Score";
  }

  function formatFactorValue(s: Record<string, unknown>): string {
    if (s.composite_score !== undefined) return String((Number(s.composite_score)).toFixed(2));
    if (s.beta !== undefined) return `β ${(Number(s.beta)).toFixed(2)}`;
    if (s.conviction !== undefined) return `${(Number(s.conviction) * 100).toFixed(0)}%`;
    if (s.sensitivity !== undefined) return String((Number(s.sensitivity)).toFixed(2));
    return "";
  }

  function formatSignalValue(s: Record<string, unknown>): string {
    if (s.conviction !== undefined) return `${(Number(s.conviction) * 100).toFixed(0)}%`;
    if (s.model_score !== undefined) return `${(Number(s.model_score) * 100).toFixed(0)}%`;
    if (s.score !== undefined) return `${(Number(s.score) * 100).toFixed(0)}%`;
    if (s.composite_score !== undefined) return String((Number(s.composite_score)).toFixed(2));
    return "";
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  // Get last user question for follow-up placeholder
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  const followUpPlaceholder = lastUserMessage
    ? getFollowUpPlaceholder(lastUserMessage.content)
    : "Ask a follow-up...";

  return (
    <div className="h-full flex relative">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* LEFT: Thread List */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 flex-shrink-0 transform transition-transform duration-200
          ${showMobileSidebar ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <ThreadList
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
        />
      </div>

      {/* CENTER: Conversation Canvas */}
      <div className="flex-1 flex flex-col min-w-0 border-x border-border">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-1 text-muted hover:text-secondary"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm text-secondary truncate">
            {threads.find((t) => t.id === activeThreadId)?.title || "New conversation"}
          </span>
        </div>

        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <p className="text-xs text-muted uppercase tracking-wider mb-4">
              Ask a market question
            </p>
            <h1 className="text-2xl font-medium text-primary mb-8 text-center">
              What do you want to understand today?
            </h1>

            <form onSubmit={handleSubmit} className="w-full max-w-2xl">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={EXAMPLE_QUESTIONS[placeholderIndex]}
                  className="w-full px-5 py-4 bg-surface border border-border rounded-xl text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-lg"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-background rounded-lg hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-muted text-center mt-3">
                Ranked answers. Evidence attached. Powered by GANO's proprietary models.
              </p>
            </form>

            <div className="mt-12 text-center">
              <p className="text-secondary text-sm mb-4">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-xl">
                {EXAMPLE_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickQuestion(q)}
                    className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-secondary hover:text-primary hover:border-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Conversation */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-3xl mx-auto space-y-8">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === "user" ? (
                      /* User Message - Large, prominent */
                      <div className="mb-6">
                        <p className="text-xl text-primary font-medium">{msg.content}</p>
                      </div>
                    ) : msg.isLoading ? (
                      /* Loading State */
                      <div className="flex items-center gap-3 py-4">
                        <Loader2 size={18} className="animate-spin text-accent" />
                        <span className="text-sm text-secondary">Analyzing...</span>
                      </div>
                    ) : msg.structuredResponse ? (
                      /* Assistant Response - Using AssistantMessage component */
                      <AssistantMessage
                        messageId={msg.id}
                        response={msg.structuredResponse}
                        toolType={msg.toolType}
                        processingTime={msg.processingTime}
                        onTickerClick={handleTickerClick}
                      />
                    ) : msg.content ? (
                      /* Fallback plain text */
                      <div className="py-4">
                        <p className="text-secondary">{msg.content}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Follow-up Input - Fixed at bottom */}
            <div className="border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={followUpPlaceholder}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-background rounded-lg hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* RIGHT: Context Panel */}
      <div className="w-72 flex-shrink-0 hidden lg:block">
        <ContextPanel
          macroContext={macroContext}
          signals={signals}
          warnings={warnings}
          modelHealth={modelHealth}
          onTickerClick={handleTickerClick}
          onRefresh={() => console.log("Refresh context")}
        />
      </div>

      {/* Deep Dive Modal - Focus mode, stays in thread */}
      {deepDiveTicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-xl shadow-2xl m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeepDiveTicker(null)}
                  className="p-1 text-muted hover:text-secondary transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-medium text-primary font-mono">
                  {deepDiveTicker}
                </h2>
              </div>
              <button
                onClick={() => setDeepDiveTicker(null)}
                className="px-3 py-1 text-xs text-muted hover:text-secondary border border-border rounded-lg hover:bg-surface transition-colors"
              >
                Back to conversation
              </button>
            </div>
            <div className="p-6">
              <TickerDeepDiveBlock
                ticker={deepDiveTicker}
                signals={{
                  ogSignal: { direction: "long", conviction: 0.72 },
                  sniperSignal: { direction: "long", conviction: 0.85 },
                  consensus: "Both models bullish",
                }}
                onClose={() => setDeepDiveTicker(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
