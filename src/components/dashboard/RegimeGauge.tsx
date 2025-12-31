"use client";

import { useData, usePublicData, MarketStatus, HealthStatus } from "@/hooks/useData";

type RegimeStatus = "SELECTIVE" | "AGGRESSIVE" | "DEFENSIVE" | "CRISIS" | "NEUTRAL";

const statusColors: Record<RegimeStatus, { bg: string; text: string; dot: string }> = {
  SELECTIVE: { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400" },
  AGGRESSIVE: { bg: "bg-green-500/20", text: "text-accent", dot: "bg-accent" },
  DEFENSIVE: { bg: "bg-orange-500/20", text: "text-orange-400", dot: "bg-orange-400" },
  CRISIS: { bg: "bg-red-500/20", text: "text-danger", dot: "bg-danger" },
  NEUTRAL: { bg: "bg-gray-500/20", text: "text-muted", dot: "bg-muted" },
};

export default function RegimeGauge() {
  // Use authenticated endpoint for market status
  const { data: marketStatus, loading: statusLoading } = useData<MarketStatus>('/v1/market-status');
  // Use public health endpoint as fallback for graph stats
  const { data: health } = usePublicData<HealthStatus>('/health');

  const isLive = health?.status === 'healthy' && health?.graph_loaded;

  // Default values while loading
  const regime: RegimeStatus = (marketStatus?.regime as RegimeStatus) || "SELECTIVE";
  const graphNodes = marketStatus?.graph_nodes || health?.graph_nodes || 0;
  const graphEdges = marketStatus?.graph_edges || health?.graph_edges || 0;
  const colors = statusColors[regime];

  if (statusLoading && !health) {
    return (
      <div className="border border-border bg-surface/50 rounded-lg p-4">
        <div className="h-8 bg-surface animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface/50 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} font-mono text-sm`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "animate-pulse" : ""} ${colors.dot}`} />
            STATUS: {regime}
          </div>
          <span className="text-xs text-muted font-mono hidden md:inline">
            {isLive ? "SYSTEM ONLINE" : "CONNECTING..."}
          </span>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted">NODES:</span>
            <span className="text-primary tabular-nums">{graphNodes.toLocaleString()}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-muted">EDGES:</span>
            <span className="text-primary tabular-nums">{graphEdges.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted">ALPHA:</span>
            <span className="text-accent tabular-nums">+14.69%</span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-accent animate-pulse" : "bg-danger"}`} />
          {isLive ? "LIVE" : "OFFLINE"}
        </div>
      </div>
    </div>
  );
}
