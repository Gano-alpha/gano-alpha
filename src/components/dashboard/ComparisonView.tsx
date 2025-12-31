"use client";

import { useState, useRef, useEffect, memo } from "react";
import {
  Send, Loader2, Bot, Sparkles, CheckCircle, AlertCircle,
  TrendingDown, TrendingUp, FileText, Target, Shield, Zap, Info
} from "lucide-react";
import type { StructuredResponse, ComparisonResult } from "./types";
import { EXCLUDED_TICKER_WORDS } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.ganoalpha.com';

// Utility: parse impact direction (handles unicode dashes)
function parseImpactValue(impact: string): { value: number; isNegative: boolean } {
  // Normalize unicode dashes (en-dash, em-dash, minus sign) to ASCII minus
  const normalized = impact.replace(/[–—−]/g, '-');
  const cleaned = normalized.replace(/[^0-9.\-]/g, '');
  const value = parseFloat(cleaned) || 0;
  const isNegative = normalized.includes('-') || value < 0;
  return { value: Math.abs(value), isNegative };
}

// Utility: extract ticker from natural language queries
function extractTicker(query: string): string | undefined {
  // 1) Strong signals first: $TICKER or ticker: TICKER
  const dollarMatch = query.match(/\$([A-Z]{1,5})\b/);
  if (dollarMatch) return dollarMatch[1];

  const tickerPrefixMatch = query.match(/ticker[:=\s]+([A-Z]{1,5})\b/i);
  if (tickerPrefixMatch) return tickerPrefixMatch[1].toUpperCase();

  // 2) Common phrasing patterns that imply a focus ticker
  const patterns: RegExp[] = [
    // "what happens to NVDA", "happens to NVDA", "impact NVDA", "affect NVDA"
    /\b(?:what\s+)?(?:happens?|impact|affect|expose|exposure)\s+(?:to\s+)?([A-Z]{2,5})\b/i,

    // "NVDA supply chain", "NVDA risk", "NVDA exposure"
    /\b([A-Z]{2,5})\s+(?:stock|shares|company|exposure|risk|supply\s+chain|suppliers|customers)\b/i,

    // "analyze NVDA", "check NVDA"
    /\b(?:analyze|check|show|get|explain)\s+([A-Z]{2,5})\b/i,
  ];

  for (const re of patterns) {
    const m = query.match(re);
    if (m?.[1]) {
      const t = m[1].toUpperCase();
      if (!EXCLUDED_TICKER_WORDS.includes(t)) return t;
    }
  }

  // 3) Fallback: choose the last all-caps token (often the ticker at end)
  const matches = query.match(/\b([A-Z]{2,5})\b/g) || [];
  const candidates = matches
    .map(s => s.toUpperCase())
    .filter(t => !EXCLUDED_TICKER_WORDS.includes(t));

  if (!candidates.length) return undefined;

  // Heuristic: last token is most often the intended ticker
  return candidates[candidates.length - 1];
}

// =============================================================================
// Main Component
// =============================================================================

export default function ComparisonView() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleCompare = async () => {
    if (!query.trim() || isLoading) return;

    // Abort any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setResult({
      query,
      chatgpt: { loading: true },
      gano: { loading: true }
    });

    // Simulate ChatGPT response (this is an EXAMPLE, not real ChatGPT)
    setTimeout(() => {
      if (!abortControllerRef.current?.signal.aborted) {
        setResult(prev => prev ? {
          ...prev,
          chatgpt: {
            loading: false,
            response: getChatGPTResponse(query)
          }
        } : null);
      }
    }, 1000);

    // Call GANO API - single answer_scenario call does all orchestration
    try {
      // Extract ticker if user mentioned one explicitly (use improved extraction)
      const ticker = extractTicker(query);

      // Single API call - MCP does all orchestration
      const response = await fetch(`${BACKEND_URL}/v1/chat/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'answer_scenario',
          arguments: {
            question: query,
            ticker: ticker || undefined,
            severity: 0.5,
            top_k: 5
          }
        }),
        signal: abortControllerRef.current.signal
      });

      if (abortControllerRef.current?.signal.aborted) return;

      const data = await response.json() as { success: boolean; result?: { structured_response: StructuredResponse }; error?: string };

      if (data.success && data.result?.structured_response) {
        setResult(prev => prev ? {
          ...prev,
          gano: {
            loading: false,
            structured: data.result!.structured_response
          }
        } : null);
      } else {
        setResult(prev => prev ? {
          ...prev,
          gano: {
            loading: false,
            error: data.error || 'No structured response returned'
          }
        } : null);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setResult(prev => prev ? {
        ...prev,
        gano: {
          loading: false,
          error: String(err)
        }
      } : null);
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-lg font-mono text-white mb-1">
          Same Question. <span className="text-emerald-400">Different Depth.</span>
        </h2>
        <p className="text-xs text-gray-500">ChatGPT gives great context. GANO adds specific data from our graph.</p>
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0d0d0d] rounded-xl border border-[#1a1a1a]">
        <form onSubmit={(e) => { e.preventDefault(); handleCompare(); }} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question to compare responses..."
            className="flex-1 px-4 py-3 bg-[#111] border border-[#222] rounded-lg font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-emerald-500 text-black font-mono text-sm font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Compare
          </button>
        </form>
        <div className="flex gap-2 mt-3">
          {[
            'What if China invades Taiwan?',
            'Earthquake in Japan impact',
            'NVDA supply chain risk',
          ].map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-[10px] text-gray-500 hover:text-white transition-colors font-mono truncate"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Results */}
      {result && (
        <div className="grid grid-cols-2 gap-4">
          {/* ChatGPT Side - EXAMPLE TEMPLATE (not real ChatGPT) */}
          <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] overflow-hidden">
            <div className="p-3 border-b border-[#1a1a1a] flex items-center gap-2">
              <Bot size={16} className="text-gray-400" />
              <span className="font-mono text-sm text-gray-400">Generic LLM</span>
              <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                Example
              </span>
            </div>
            <div className="p-4">
              {result.chatgpt.loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                  <span className="text-xs text-gray-500">Simulating...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded">
                    <Info size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-amber-400/80">
                      This is a representative example of generic LLM output, not a real API call.
                    </p>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {result.chatgpt.response}
                  </p>

                  {/* What generic LLMs do well */}
                  <div className="pt-3 border-t border-[#222]">
                    <p className="text-[10px] text-gray-500 uppercase mb-2">Typical strengths</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle size={10} className="text-emerald-500" />
                        Macro context & frameworks
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle size={10} className="text-emerald-500" />
                        General research & analysis
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase mt-3 mb-2">Limitations</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <AlertCircle size={10} className="text-gray-600" />
                        No proprietary data
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <AlertCircle size={10} className="text-gray-600" />
                        No specific confidence scores
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GANO Side */}
          <div className="bg-[#0d0d0d] rounded-xl border border-emerald-500/30 overflow-hidden">
            <div className="p-3 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="font-mono text-sm text-emerald-400">GANO Reasoner</span>
              <span className="ml-auto text-[10px] text-emerald-600">+ Graph Data</span>
            </div>
            <div className="p-4">
              {result.gano.loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-emerald-400" />
                  <span className="text-xs text-gray-500">Analyzing scenario...</span>
                </div>
              ) : result.gano.error ? (
                <p className="text-sm text-red-400">{result.gano.error}</p>
              ) : result.gano.structured ? (
                <GanoStructuredDisplay response={result.gano.structured} />
              ) : (
                <p className="text-sm text-gray-500">No data returned</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!result && (
        <div className="bg-[#0d0d0d] rounded-xl border border-[#1a1a1a] p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <Bot size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-mono text-sm">ChatGPT</p>
              <p className="text-gray-600 text-xs mt-2">Great frameworks</p>
              <p className="text-gray-600 text-xs">Good context</p>
            </div>
            <div className="text-center border-l border-emerald-500/20 pl-8">
              <Sparkles size={48} className="text-emerald-500/50 mx-auto mb-4" />
              <p className="text-emerald-400 font-mono text-sm">GANO Reasoner</p>
              <p className="text-emerald-600 text-xs mt-2">+ Specific tickers</p>
              <p className="text-emerald-600 text-xs">+ Confidence scores</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Structured Result Display - renders the StructuredResponse from MCP (Memoized)
// =============================================================================

const GanoStructuredDisplay = memo(function GanoStructuredDisplay({ response }: { response: StructuredResponse }) {
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'text-emerald-400 bg-emerald-500/20';
      case 'bearish': return 'text-red-400 bg-red-500/20';
      case 'caution': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Determine impact direction
  const impactParsed = response.impactRange
    ? parseImpactValue(response.impactRange.mid)
    : null;
  const ImpactIcon = impactParsed?.isNegative ? TrendingDown : TrendingUp;
  const impactColor = impactParsed?.isNegative ? 'text-red-400' : 'text-emerald-400';

  return (
    <div className="space-y-3">
      {/* Headline + Impact */}
      <div>
        <p className="font-mono text-sm font-bold text-white mb-1">{response.headline}</p>
        {response.impactRange && (
          <div className="flex items-center gap-2">
            <ImpactIcon size={14} className={impactColor} />
            <span className={`text-lg font-bold ${impactColor}`}>{response.impactRange.mid}</span>
            <span className="text-[10px] text-gray-500">
              ({response.impactRange.low} to {response.impactRange.high})
            </span>
          </div>
        )}
      </div>

      {/* Narrative (truncated for comparison view) */}
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
        {response.narrative}
      </p>

      {/* Top Impacted */}
      {response.exposureMap?.topImpacted && response.exposureMap.topImpacted.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase mb-2 flex items-center gap-1">
            <Target size={10} />
            Most Exposed (from graph)
          </p>
          <div className="space-y-1">
            {response.exposureMap.topImpacted.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-[#111] rounded border border-[#222]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-white font-bold">{item.ticker}</span>
                  <span className="text-[10px] text-gray-600 truncate max-w-[120px]">
                    {item.path}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-red-400 font-bold">{item.impact}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    item.confidence >= 0.7 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Personas (compact) */}
      {response.analystConsensus && (
        <div className="grid grid-cols-2 gap-2">
          {/* OG */}
          <div className="p-2 rounded border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-1 mb-1">
              <Shield size={10} className="text-blue-400" />
              <span className="text-[10px] text-blue-400">Defensive</span>
              <span className={`ml-auto text-[9px] px-1 py-0.5 rounded ${getSignalColor(response.analystConsensus.og.signal)}`}>
                {response.analystConsensus.og.signal}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 line-clamp-2">{response.analystConsensus.og.headline}</p>
          </div>
          {/* Sniper */}
          <div className="p-2 rounded border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center gap-1 mb-1">
              <Zap size={10} className="text-purple-400" />
              <span className="text-[10px] text-purple-400">Aggressive</span>
              <span className={`ml-auto text-[9px] px-1 py-0.5 rounded ${getSignalColor(response.analystConsensus.sniper.signal)}`}>
                {response.analystConsensus.sniper.signal}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 line-clamp-2">{response.analystConsensus.sniper.headline}</p>
          </div>
        </div>
      )}

      {/* Confidence + Source */}
      <div className="flex items-center justify-between pt-2 border-t border-[#222]">
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <FileText size={10} />
          <span>{response.coverage?.edgesUsed || 0} edges • {response.coverage?.tierBreakdown || 'Supply chain data'}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          response.confidence >= 0.7 ? 'bg-emerald-500/20 text-emerald-400' :
          response.confidence >= 0.4 ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {(response.confidence * 100).toFixed(0)}% conf
        </span>
      </div>
    </div>
  );
});

// =============================================================================
// ChatGPT Response (honest simulation - example template, not real API)
// =============================================================================

function getChatGPTResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('nvda') || q.includes('nvidia')) {
    return `NVIDIA's supply chain has notable concentration risks:

• **Foundry**: TSMC manufactures virtually all NVIDIA GPUs
• **Packaging**: Advanced packaging (CoWoS) is Taiwan-centric
• **Memory**: HBM suppliers are concentrated

A disruption could impact AI GPU deliveries to hyperscaler customers.`;
  }

  if (q.includes('aapl') || q.includes('apple')) {
    return `Apple's supply chain spans globally:

• **Assembly**: Foxconn, Pegatron (primarily China)
• **Chips**: TSMC for A/M-series, plus various component suppliers
• **Display**: Samsung, LG, BOE

They've been diversifying to India and Vietnam for assembly.`;
  }

  if (q.includes('tsm') || q.includes('taiwan')) {
    return `TSMC is the world's largest semiconductor foundry:

• Manufactures chips for Apple, NVIDIA, AMD, Qualcomm
• ~54% global foundry market share
• Leading-edge nodes (3nm, 5nm) are Taiwan-exclusive

Key risk: Geographic concentration in Taiwan.`;
  }

  return `I'd analyze this by looking at:

• Supply chain relationships and dependencies
• Geographic concentration risks
• Historical patterns and factor sensitivities

What specific aspect would you like me to focus on?`;
}
