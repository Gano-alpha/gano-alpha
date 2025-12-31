"use client";

import { useState, useEffect } from "react";
import { ChevronRight, FileText, Network, BarChart3 } from "lucide-react";
import type { EvidencePill, BlockState } from "@/lib/block-state";

interface Factor {
  name: string;
  beta: number;
  rSquared: number;
  pValue: number;
  description?: string;
}

interface GraphPath {
  from: string;
  to: string;
  via?: string;
  confidence: number;
}

interface SourceFiling {
  source: string;
  date?: string;
  text: string;
  type?: "10-K" | "10-Q" | "8-K" | "Transcript";
}

interface EvidenceBlockProps {
  ticker: string;
  factorProof?: {
    factors: Factor[];
  };
  graphPaths?: {
    paths: GraphPath[];
    totalEdges?: number;
  };
  sourceFilings?: {
    filings: SourceFiling[];
  };
  // Controlled state from parent (optional)
  defaultState?: BlockState;
  activePill?: EvidencePill;
  onPillClick?: (pill: EvidencePill) => void;
  className?: string;
}

/**
 * Evidence / Receipts Block
 *
 * Purpose: Prove why a rank exists. Allow inspection without cognitive overload.
 * This is your moat. Every number must trace to a source.
 *
 * Behavior:
 * - Always starts collapsed
 * - Clicking pill: toggle or switch tab
 * - Evidence never interrupts ranking
 * - System never auto-expands unless user asks "why"
 */
export function EvidenceBlock({
  ticker,
  factorProof,
  graphPaths,
  sourceFilings,
  defaultState = "collapsed",
  activePill: controlledActivePill,
  onPillClick,
  className = "",
}: EvidenceBlockProps) {
  // Internal state for uncontrolled mode
  const [internalActivePill, setInternalActivePill] = useState<EvidencePill | null>(null);

  // Use controlled or uncontrolled mode
  const isControlled = onPillClick !== undefined;
  const activeSection = isControlled ? controlledActivePill : internalActivePill;
  const isExpanded = defaultState === "expanded" || !!activeSection;

  const handlePillClick = (pill: EvidencePill) => {
    if (isControlled) {
      onPillClick?.(pill);
    } else {
      setInternalActivePill(internalActivePill === pill ? null : pill);
    }
  };

  // Check what data is available
  const hasFactorProof = factorProof && factorProof.factors.length > 0;
  const hasGraphPaths = graphPaths && graphPaths.paths.length > 0;
  const hasFilings = sourceFilings && sourceFilings.filings.length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Evidence Toggle Pill Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handlePillClick("factor")}
          disabled={!hasFactorProof && !factorProof}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
            activeSection === "factor"
              ? "bg-accent/10 text-accent border border-accent/30"
              : "bg-surface border border-border text-muted hover:text-secondary hover:border-muted disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <BarChart3 size={14} />
          Factor proof
        </button>
        <button
          onClick={() => handlePillClick("paths")}
          disabled={!hasGraphPaths && !graphPaths}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
            activeSection === "paths"
              ? "bg-accent/10 text-accent border border-accent/30"
              : "bg-surface border border-border text-muted hover:text-secondary hover:border-muted disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <Network size={14} />
          Graph paths
        </button>
        <button
          onClick={() => handlePillClick("filings")}
          disabled={!hasFilings && !sourceFilings}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
            activeSection === "filings"
              ? "bg-accent/10 text-accent border border-accent/30"
              : "bg-surface border border-border text-muted hover:text-secondary hover:border-muted disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <FileText size={14} />
          Source filings
        </button>
      </div>

      {/* Expanded Content - Slides open inline */}
      {activeSection && (
        <div
          className="p-4 bg-surface/50 border border-border rounded-lg overflow-hidden"
          style={{ animation: "fade-slide-in 0.2s ease-out forwards" }}
        >
          {/* Factor Proof Section */}
          {activeSection === "factor" && (
            <div style={{ animation: "fade-slide-in 0.15s ease-out forwards" }}>
              <p className="text-xs text-muted uppercase tracking-wider mb-3">
                Factor proof for {ticker}
              </p>
              {hasFactorProof ? (
                <div className="space-y-2">
                  {factorProof!.factors.map((factor, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-2 bg-background/50 rounded"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        animation: "fade-slide-in 0.2s ease-out forwards",
                        opacity: 0,
                      }}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-primary font-medium">{factor.name}</p>
                        {factor.description && (
                          <p className="text-xs text-muted mt-1">{factor.description}</p>
                        )}
                      </div>
                      <div className="flex gap-4 text-right">
                        {factor.beta !== 0 && (
                          <div>
                            <p className="text-[10px] text-muted">β</p>
                            <p className="font-mono text-sm text-primary">
                              {factor.beta > 0 ? "+" : ""}
                              {factor.beta.toFixed(3)}
                            </p>
                          </div>
                        )}
                        {factor.rSquared !== 0 && (
                          <div>
                            <p className="text-[10px] text-muted">r²</p>
                            <p className="font-mono text-sm text-teal">{factor.rSquared.toFixed(2)}</p>
                          </div>
                        )}
                        {factor.pValue !== 0 && (
                          <div>
                            <p className="text-[10px] text-muted">p</p>
                            <p
                              className={`font-mono text-sm ${
                                factor.pValue < 0.05 ? "text-teal" : "text-muted"
                              }`}
                            >
                              {factor.pValue.toFixed(3)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Factor sensitivities computed from 5-year rolling regression window.
                </p>
              )}
            </div>
          )}

          {/* Graph Paths Section */}
          {activeSection === "paths" && (
            <div style={{ animation: "fade-slide-in 0.15s ease-out forwards" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted uppercase tracking-wider">
                  Supply chain paths for {ticker}
                </p>
                {graphPaths?.totalEdges && (
                  <span className="text-[10px] text-muted">
                    {graphPaths.totalEdges.toLocaleString()} edges
                  </span>
                )}
              </div>
              {hasGraphPaths ? (
                <div className="space-y-2">
                  {graphPaths!.paths.map((path, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-background/50 rounded"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        animation: "fade-slide-in 0.2s ease-out forwards",
                        opacity: 0,
                      }}
                    >
                      <span className="font-mono text-sm text-primary font-medium">
                        {path.from}
                      </span>
                      <ChevronRight size={12} className="text-muted" />
                      {path.via && (
                        <>
                          <span className="font-mono text-sm text-secondary">{path.via}</span>
                          <ChevronRight size={12} className="text-muted" />
                        </>
                      )}
                      <span className="font-mono text-sm text-primary font-medium">{path.to}</span>
                      <span className="ml-auto font-mono text-xs text-teal">
                        {(path.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Supply chain paths loaded from 209K-edge knowledge graph.
                </p>
              )}
            </div>
          )}

          {/* Source Filings Section */}
          {activeSection === "filings" && (
            <div style={{ animation: "fade-slide-in 0.15s ease-out forwards" }}>
              <p className="text-xs text-muted uppercase tracking-wider mb-3">
                Source filings for {ticker}
              </p>
              {hasFilings ? (
                <div className="space-y-3">
                  {sourceFilings!.filings.map((filing, i) => (
                    <div
                      key={i}
                      className="p-3 bg-background/50 rounded border-l-2 border-accent/30"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        animation: "fade-slide-in 0.2s ease-out forwards",
                        opacity: 0,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-secondary">{filing.source}</span>
                        {filing.type && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-surface rounded text-muted">
                            {filing.type}
                          </span>
                        )}
                        {filing.date && (
                          <span className="text-[10px] text-muted">({filing.date})</span>
                        )}
                      </div>
                      <p className="text-sm text-muted italic">&quot;{filing.text}&quot;</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">SEC filings and earnings transcripts.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
