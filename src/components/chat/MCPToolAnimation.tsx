"use client";

import { Loader2, Check } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface ToolStep {
  id: string;
  tool: string;
  args?: Record<string, unknown>;
  status: "pending" | "running" | "complete";
  timing_ms?: number;
}

interface MCPToolAnimationProps {
  /** Steps from real server stream - if provided, shows actual tool progress */
  steps?: ToolStep[];
  /** Whether the processing is complete */
  isComplete?: boolean;
  /** Class name for container */
  className?: string;
}

// =============================================================================
// Tool Display Names
// =============================================================================

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  analyze_ticker: "Analyzing ticker",
  get_top_signals: "Fetching signals",
  rank_signals_by_macro_scenario: "Ranking by scenario",
  get_tickers_by_factor: "Screening by factor",
  get_cross_factor_exposure: "Multi-factor analysis",
  simulate_shock: "Simulating shock",
  answer_scenario: "Analyzing scenario",
  get_macro_data: "Loading macro context",
  get_early_warning: "Checking warnings",
  get_factor_sensitivities: "Loading factor data",
  get_ticker_ecosystem: "Loading supply chain",
  search_supply_chain: "Searching graph",
  get_product_info: "Loading info",
};

function getToolDisplayName(tool: string): string {
  return TOOL_DISPLAY_NAMES[tool] || tool.replace(/_/g, " ");
}

// =============================================================================
// Component
// =============================================================================

export function MCPToolAnimation({
  steps,
  isComplete = false,
  className = "",
}: MCPToolAnimationProps) {
  // If no steps provided (no streaming), show simple loading
  if (!steps || steps.length === 0) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Loader2 size={16} className="animate-spin text-accent" />
        <span className="text-sm text-secondary">Processing query...</span>
      </div>
    );
  }

  // With real steps from server stream, show actual progress
  const completedCount = steps.filter((s) => s.status === "complete").length;
  const currentStep = steps.find((s) => s.status === "running") || steps[steps.length - 1];

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {!isComplete ? (
          <Loader2 size={16} className="animate-spin text-accent" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-teal flex items-center justify-center">
            <Check size={10} className="text-background" />
          </div>
        )}
        <span className="text-sm text-secondary">
          {isComplete ? "Query processed" : "Processing query..."}
        </span>
        <span className="text-xs text-muted ml-auto">
          {completedCount}/{steps.length} tools
        </span>
      </div>

      {/* Steps list */}
      <div className="space-y-0 ml-1">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 transition-all duration-300 ${
              step.status === "pending" ? "opacity-40" : "opacity-100"
            }`}
          >
            {/* Connector line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 transition-colors duration-200 ${
                  step.status === "complete"
                    ? "bg-teal"
                    : step.status === "running"
                    ? "bg-accent animate-pulse"
                    : "bg-border"
                }`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`w-px h-5 transition-colors duration-200 ${
                    step.status === "complete" ? "bg-border" : "bg-border/30"
                  }`}
                />
              )}
            </div>

            {/* Step content */}
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    step.status === "complete"
                      ? "text-primary"
                      : step.status === "running"
                      ? "text-primary"
                      : "text-muted"
                  }`}
                >
                  {getToolDisplayName(step.tool)}
                </span>
                {step.status === "running" && (
                  <Loader2 size={12} className="animate-spin text-accent" />
                )}
                {step.status === "complete" && (
                  <Check size={12} className="text-teal" />
                )}
                {step.timing_ms && step.status === "complete" && (
                  <span className="text-xs text-muted">{step.timing_ms}ms</span>
                )}
              </div>
              {step.args && Object.keys(step.args).length > 0 && (
                <p className="text-xs text-muted font-mono mt-0.5 truncate">
                  {Object.entries(step.args)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MCPToolAnimation;
