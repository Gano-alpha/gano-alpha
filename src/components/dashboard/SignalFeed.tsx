"use client";

import { ArrowUpRight, AlertCircle } from "lucide-react";
import { useData } from "@/hooks/useData";

// API response types matching backend SignalResponse
interface Signal {
  ticker: string;
  name: string | null;
  tier: 'SNIPER' | 'SCOUT';
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  solvency: number;
  centrality: number;
  mertonPd: number | null;
  altmanZ: number | null;
  drawdown: number;
  upstreamCount: number;
  downstreamCount: number;
  sharpe: number | null;
  lastUpdated: string;
}

interface SignalsResponse {
  status: string;
  count: number;
  signals: Signal[];
  asOfDate: string;
}

// Fallback data for when API is unavailable
const FALLBACK_SIGNALS: Signal[] = [
  { ticker: "ONTO", name: "Onto Innovation", tier: "SNIPER", signal: "BUY", confidence: 0.89, solvency: 0.8, centrality: 0.87, mertonPd: 2.0, altmanZ: 3.2, drawdown: -8.2, upstreamCount: 12, downstreamCount: 8, sharpe: 2.1, lastUpdated: "2024-12-29" },
  { ticker: "AEHR", name: "Aehr Test Systems", tier: "SNIPER", signal: "BUY", confidence: 0.82, solvency: 0.7, centrality: 0.77, mertonPd: 3.0, altmanZ: 2.8, drawdown: -10.1, upstreamCount: 8, downstreamCount: 5, sharpe: 1.9, lastUpdated: "2024-12-29" },
  { ticker: "ASML", name: "ASML Holding", tier: "SNIPER", signal: "BUY", confidence: 0.91, solvency: 0.9, centrality: 0.94, mertonPd: 1.0, altmanZ: 4.1, drawdown: -6.3, upstreamCount: 45, downstreamCount: 23, sharpe: 2.5, lastUpdated: "2024-12-28" },
  { ticker: "KLAC", name: "KLA Corporation", tier: "SCOUT", signal: "BUY", confidence: 0.78, solvency: 0.65, centrality: 0.72, mertonPd: 4.0, altmanZ: 2.5, drawdown: -12.4, upstreamCount: 15, downstreamCount: 9, sharpe: 1.7, lastUpdated: "2024-12-28" },
];

export default function SignalFeed() {
  const { data: apiData, loading, error } = useData<SignalsResponse>('/v1/signals?limit=8');

  // Use API data or fallback
  const signals = apiData?.signals || FALLBACK_SIGNALS;

  if (loading) {
    return (
      <div className="p-4 text-xs font-mono text-muted animate-pulse">
        Awaiting Signal Feed...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-danger/10 border-b border-danger/20 flex items-center gap-2">
          <AlertCircle size={12} className="text-danger" />
          <span className="text-[10px] font-mono text-danger">{error} - showing cached data</span>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-surface text-[10px] font-mono text-muted uppercase tracking-wider">
        <div className="col-span-2">Ticker</div>
        <div className="col-span-3 text-right">Confidence</div>
        <div className="col-span-3 text-right">Flow Centrality</div>
        <div className="col-span-4 text-right">Structure</div>
      </div>

      {/* Table Body */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {signals.map((signal, i) => {
          const confPct = (signal.confidence * 100);
          const isSniperTier = signal.tier === 'SNIPER';

          return (
            <div
              key={`${signal.ticker}-${i}`}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 hover:bg-white/5 transition-colors group cursor-pointer"
            >
              {/* Ticker */}
              <div className="col-span-2 font-mono font-bold text-white flex items-center gap-1">
                {signal.ticker}
                {isSniperTier && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>}
              </div>

              {/* Confidence Bar */}
              <div className="col-span-3 flex flex-col justify-center items-end">
                <span className="font-mono text-xs text-accent">{confPct.toFixed(1)}%</span>
                <div className="w-full h-1 bg-border rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${confPct}%` }}
                  />
                </div>
              </div>

              {/* Centrality Score */}
              <div className="col-span-3 text-right font-mono text-xs text-primary">
                {((signal.centrality ?? 0) * 100).toFixed(1)}
              </div>

              {/* Company Name or Signal Type */}
              <div className="col-span-4 text-right flex justify-end items-center gap-1 text-[10px] text-muted">
                <span className="truncate max-w-[100px]">{signal.name || signal.signal}</span>
                <ArrowUpRight size={10} className="text-gray-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          );
        })}

        {/* Empty state when no signals */}
        {signals.length === 0 && (
          <div className="p-6 text-center text-muted font-mono text-xs">
            No signals available for today.
          </div>
        )}
      </div>
    </div>
  );
}
