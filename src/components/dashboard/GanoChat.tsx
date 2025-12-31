"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Send, Loader2, User, Sparkles,
  TrendingDown, TrendingUp, ChevronDown, ChevronRight,
  Zap, Shield, Eye, Clock, FileText, Target,
  Info, ArrowRight, Tag
} from "lucide-react";
import type { Message, StructuredResponse } from "./types";
import { EXCLUDED_TICKER_WORDS } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.ganoalpha.com';

// =============================================================================
// Utility functions
// =============================================================================

function parseImpactValueLocal(impact: string): { value: number; isNegative: boolean } {
  // Normalize unicode dashes (en-dash, em-dash) to ASCII minus
  const normalized = impact.replace(/[–—−]/g, '-');
  const cleaned = normalized.replace(/[^0-9.\-]/g, '');
  const value = parseFloat(cleaned) || 0;
  const isNegative = normalized.includes('-') || value < 0;
  return { value: Math.abs(value), isNegative };
}

function extractTickerLocal(query: string): string | undefined {
  // 1) Strong signals first: $TICKER or ticker: TICKER
  const dollarMatch = query.match(/\$([A-Z]{1,5})\b/);
  if (dollarMatch) return dollarMatch[1];

  const tickerPrefixMatch = query.match(/ticker[:=\s]+([A-Z]{1,5})\b/i);
  if (tickerPrefixMatch) return tickerPrefixMatch[1].toUpperCase();

  // 2) Common phrasing patterns that imply a focus ticker
  // Capture group always returns the ticker in group(1)
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
  // Don't require EXACTLY one match; filter denylist and pick best.
  const matches = query.match(/\b([A-Z]{2,5})\b/g) || [];
  const candidates = matches
    .map(s => s.toUpperCase())
    .filter(t => !EXCLUDED_TICKER_WORDS.includes(t));

  if (!candidates.length) return undefined;

  // Heuristic: last token is most often the intended ticker ("... to NVDA?")
  return candidates[candidates.length - 1];
}

function getSignalStyle(signal: string) {
  switch (signal) {
    case 'bullish': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    case 'bearish': return 'text-red-400 bg-red-500/20 border-red-500/30';
    case 'caution': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
}

function getScenarioBadgeStyle(type: string) {
  switch (type) {
    case 'geopolitical': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'macro': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'supply_chain': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

// =============================================================================
// Decision Card - Chat-first, Evidence-second (Memoized)
// =============================================================================

const DecisionCard = memo(function DecisionCard({ response }: { response: StructuredResponse }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const og = response.analystConsensus?.og;
  const sniper = response.analystConsensus?.sniper;

  // Determine impact direction from the mid value
  const impactParsed = response.impactRange
    ? parseImpactValueLocal(response.impactRange.mid)
    : null;
  const ImpactIcon = impactParsed?.isNegative ? TrendingDown : TrendingUp;
  const impactColor = impactParsed?.isNegative ? 'text-red-400' : 'text-emerald-400';

  return (
    <div className="space-y-4 max-w-2xl">
      {/* ═══════════════════════════════════════════════════════════════════════
          LAYER 1: NARRATIVE ANSWER (Natural Language First)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 bg-[#111] rounded-xl border border-[#222]">
        {/* Scenario Badge */}
        {response.scenario && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getScenarioBadgeStyle(response.scenario.type)}`}>
              <Tag size={10} className="inline mr-1" />
              {response.scenario.type.replace('_', ' ')}
            </span>
            {response.scenario.region && (
              <span className="text-[10px] text-gray-500">{response.scenario.region}</span>
            )}
          </div>
        )}

        <p className="text-[15px] text-gray-200 leading-relaxed whitespace-pre-line">
          {response.narrative}
        </p>

        {/* Quick Stats Row */}
        {response.impactRange && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#222]">
            <div className="flex items-center gap-2">
              <ImpactIcon size={18} className={impactColor} />
              <span className={`text-xl font-bold ${impactColor}`}>{response.impactRange.mid}</span>
              <span className="text-xs text-gray-500">
                {impactParsed?.isNegative ? 'estimated downside' : 'estimated upside'}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Range: {response.impactRange.low} to {response.impactRange.high}
            </div>
            <div className={`ml-auto px-2 py-1 rounded text-xs ${
              response.confidence >= 0.7 ? 'bg-emerald-500/20 text-emerald-400' :
              response.confidence >= 0.4 ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {(response.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        )}

        {/* Confidence Story */}
        {response.confidenceStory && response.confidenceStory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-gray-500 mb-1">Why this confidence?</p>
            <div className="flex flex-wrap gap-2">
              {response.confidenceStory.map((story, i) => (
                <span key={i} className="text-[10px] text-gray-400 bg-[#0a0a0a] px-2 py-0.5 rounded">
                  {story}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LAYER 2: TWO WAYS TO TRADE THIS (OG vs Sniper - Compact)
          ═══════════════════════════════════════════════════════════════════════ */}
      {og && sniper && (
        <div className="p-4 bg-[#0d0d0d] rounded-xl border border-[#222]">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Two ways to trade this scenario</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Defensive View (OG) */}
            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Defensive</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getSignalStyle(og.signal)}`}>
                  {og.signal}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-snug">{og.headline}</p>
              <p className="text-xs text-blue-400/70 mt-2 italic">→ {og.actionBias}</p>
            </div>

            {/* Aggressive View (Sniper) */}
            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">Aggressive</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getSignalStyle(sniper.signal)}`}>
                  {sniper.signal}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-snug">{sniper.headline}</p>
              <p className="text-xs text-purple-400/70 mt-2 italic">→ {sniper.actionBias}</p>
            </div>
          </div>

          {/* Consensus Note */}
          {response.analystConsensus?.consensus !== 'aligned' && (
            <p className="text-xs text-gray-500 mt-3 text-center italic">
              Models disagree: {response.analystConsensus?.divergenceReason || 'different time horizons'}
            </p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SHOW EVIDENCE TOGGLE
          ═══════════════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => setShowEvidence(!showEvidence)}
        className="w-full p-3 rounded-lg border border-[#333] bg-[#0d0d0d] hover:bg-[#111] transition-colors flex items-center justify-between"
      >
        <span className="text-xs text-gray-400 flex items-center gap-2">
          <FileText size={14} />
          {showEvidence ? 'Hide supporting evidence' : 'Show supporting evidence'}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${showEvidence ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ═══════════════════════════════════════════════════════════════════════
          EVIDENCE SECTIONS (Collapsed by Default)
          ═══════════════════════════════════════════════════════════════════════ */}
      {showEvidence && (
        <div className="space-y-2">
          {/* Why Exposed */}
          {response.exposureMap?.topImpacted && response.exposureMap.topImpacted.length > 0 && (
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <button
                onClick={() => toggleSection('exposure')}
                className="w-full p-3 bg-[#111] flex items-center justify-between hover:bg-[#161616] transition-colors"
              >
                <span className="text-xs text-orange-400 flex items-center gap-2">
                  <Target size={12} />
                  Why this exposure exists
                </span>
                <ChevronRight
                  size={14}
                  className={`text-gray-500 transition-transform ${expandedSection === 'exposure' ? 'rotate-90' : ''}`}
                />
              </button>

              {expandedSection === 'exposure' && (
                <div className="p-3 bg-[#0d0d0d] space-y-2">
                  {response.exposureMap.topImpacted.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#111] rounded border border-[#222]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-white font-bold">{item.ticker}</span>
                        <span className="text-xs text-gray-500">{item.path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm font-bold ${
                          item.impact.startsWith('-') ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {item.impact}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.confidence >= 0.7 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Model Details */}
          {og && sniper && (
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <button
                onClick={() => toggleSection('models')}
                className="w-full p-3 bg-[#111] flex items-center justify-between hover:bg-[#161616] transition-colors"
              >
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <Shield size={12} className="text-blue-400" />
                  <Zap size={12} className="text-purple-400" />
                  Full model reasoning
                </span>
                <ChevronRight
                  size={14}
                  className={`text-gray-500 transition-transform ${expandedSection === 'models' ? 'rotate-90' : ''}`}
                />
              </button>

              {expandedSection === 'models' && (
                <div className="p-3 bg-[#0d0d0d] grid grid-cols-2 gap-3">
                  {/* OG Full */}
                  <div className="p-3 rounded border border-blue-500/20 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={14} className="text-blue-400" />
                      <span className="text-xs font-bold text-blue-400">OG Model</span>
                    </div>
                    <div className="space-y-1 mb-2">
                      {og.reasoning.map((r, i) => (
                        <p key={i} className="text-[11px] text-gray-400">• {r}</p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {og.keyMetrics.map((m, i) => (
                        <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] ${
                          m.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                          m.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {m.label}: {m.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sniper Full */}
                  <div className="p-3 rounded border border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={14} className="text-purple-400" />
                      <span className="text-xs font-bold text-purple-400">Sniper Model</span>
                    </div>
                    <div className="space-y-1 mb-2">
                      {sniper.reasoning.map((r, i) => (
                        <p key={i} className="text-[11px] text-gray-400">• {r}</p>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sniper.keyMetrics.map((m, i) => (
                        <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] ${
                          m.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                          m.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {m.label}: {m.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* What to Watch */}
          {response.actionLayer && (
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <button
                onClick={() => toggleSection('watch')}
                className="w-full p-3 bg-[#111] flex items-center justify-between hover:bg-[#161616] transition-colors"
              >
                <span className="text-xs text-emerald-400 flex items-center gap-2">
                  <Eye size={12} />
                  What to watch
                </span>
                <ChevronRight
                  size={14}
                  className={`text-gray-500 transition-transform ${expandedSection === 'watch' ? 'rotate-90' : ''}`}
                />
              </button>

              {expandedSection === 'watch' && (
                <div className="p-3 bg-[#0d0d0d] space-y-3">
                  {response.actionLayer.watchIn72h?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-amber-400 uppercase mb-1 flex items-center gap-1">
                        <Clock size={10} /> Next 72 hours
                      </p>
                      {response.actionLayer.watchIn72h.map((item, i) => (
                        <p key={i} className="text-xs text-gray-400">• {item}</p>
                      ))}
                    </div>
                  )}
                  {response.actionLayer.watchIn2Weeks?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-blue-400 uppercase mb-1 flex items-center gap-1">
                        <Clock size={10} /> Next 2 weeks
                      </p>
                      {response.actionLayer.watchIn2Weeks.map((item, i) => (
                        <p key={i} className="text-xs text-gray-400">• {item}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* What Would Change This Analysis */}
          {response.actionLayer?.whatWouldChange && response.actionLayer.whatWouldChange.length > 0 && (
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <button
                onClick={() => toggleSection('change')}
                className="w-full p-3 bg-[#111] flex items-center justify-between hover:bg-[#161616] transition-colors"
              >
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <Info size={12} />
                  What would change this analysis
                </span>
                <ChevronRight
                  size={14}
                  className={`text-gray-500 transition-transform ${expandedSection === 'change' ? 'rotate-90' : ''}`}
                />
              </button>

              {expandedSection === 'change' && (
                <div className="p-3 bg-[#0d0d0d]">
                  {response.actionLayer.whatWouldChange.map((item, i) => (
                    <p key={i} className="text-xs text-gray-500 flex items-start gap-2 mb-1">
                      <ArrowRight size={10} className="mt-0.5 text-gray-600" />
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coverage Footer */}
          {response.coverage && (
            <div className="p-2 bg-[#0a0a0a] rounded border border-[#1a1a1a] flex items-center gap-3 text-[10px] text-gray-600">
              <span className="flex items-center gap-1">
                <FileText size={10} />
                {response.coverage.edgesUsed} edges
              </span>
              <span>•</span>
              <span>{response.coverage.tierBreakdown}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// API Call - Single answer_scenario endpoint
// =============================================================================

interface AnswerScenarioResponse {
  structured_response: StructuredResponse;
  _debug: Record<string, unknown>;
}

async function callAnswerScenario(
  question: string,
  ticker?: string,
  signal?: AbortSignal
): Promise<StructuredResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/chat/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'answer_scenario',
        arguments: {
          question,
          ticker: ticker || undefined,
          severity: 0.5,
          top_k: 5
        }
      }),
      signal  // Pass abort signal to fetch
    });

    const data = await response.json() as { success: boolean; result?: AnswerScenarioResponse; error?: string };

    if (data.success && data.result?.structured_response) {
      return data.result.structured_response;
    }

    return null;
  } catch (err) {
    // Don't log abort errors
    if (err instanceof Error && err.name === 'AbortError') {
      return null;
    }
    console.error('answer_scenario failed:', err);
    return null;
  }
}

// =============================================================================
// Main Component
// =============================================================================

export default function GanoChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `Ask questions like ChatGPT. Get answers like an analyst with a proprietary graph.

Try: "What happens if China invades Taiwan?"`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Abort any previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = input;
    setInput('');
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();

    // Show loading state
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      toolCalls: [{ tool: 'answer_scenario', arguments: { question: queryText } }],
      isLoading: true
    }]);

    // Extract ticker if user mentioned one explicitly (use improved extraction)
    const ticker = extractTickerLocal(queryText);

    // Single API call - MCP does all orchestration (pass abort signal)
    const structured = await callAnswerScenario(
      queryText,
      ticker,
      abortControllerRef.current?.signal
    );

    // Check if aborted
    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    setMessages(prev => prev.map(m =>
      m.id === assistantId
        ? {
            ...m,
            structuredResponse: structured || undefined,
            isLoading: false,
            content: structured ? '' : 'Unable to analyze this query. Try asking about supply chain risks or geopolitical scenarios.'
          }
        : m
    ));

    setIsLoading(false);
  };

  return (
    <div className="h-[800px] flex flex-col bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] bg-[#0d0d0d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Sparkles size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-mono text-sm text-white font-semibold">GANO Reasoner</h2>
            <p className="font-mono text-[10px] text-gray-500">209K supply chain edges • Factor models</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role !== 'user' && (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'system' ? 'bg-emerald-500/20' : 'bg-emerald-500/20'
              }`}>
                <Sparkles size={16} className="text-emerald-400" />
              </div>
            )}
            <div className={`${msg.role === 'user' ? 'max-w-md' : 'flex-1'}`}>
              {msg.role === 'user' ? (
                <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#333]">
                  <p className="text-sm text-gray-200">{msg.content}</p>
                </div>
              ) : msg.isLoading ? (
                <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-emerald-400" />
                    <span className="text-sm text-gray-400">Analyzing...</span>
                  </div>
                </div>
              ) : msg.structuredResponse ? (
                <DecisionCard response={msg.structuredResponse} />
              ) : msg.content ? (
                <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : null}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-[#333] flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1a1a1a] bg-[#0d0d0d]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about supply chains, risks, scenarios..."
            className="flex-1 px-4 py-3 bg-[#111] border border-[#222] rounded-lg font-mono text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-emerald-500 text-black font-mono text-sm font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        <div className="flex gap-2 mt-3">
          {['What if China invades Taiwan?', 'NVDA supply chain', 'AAPL rate sensitivity'].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="px-3 py-1.5 bg-[#111] border border-[#222] rounded-lg text-xs text-gray-500 hover:text-white hover:border-[#333] transition-colors font-mono"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
