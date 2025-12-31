"use client";

import { useState } from "react";

interface NarrativeBlockProps {
  scenario?: string;
  findings: string[];
  interpretation?: string;
  className?: string;
}

/**
 * Narrative Block
 *
 * Purpose: Set context, explain why the result exists.
 * Always first, always visible, scrolls away naturally.
 *
 * Layout:
 * - Scenario/Question Summary (1-2 sentences)
 * - What we found (2-3 bullet-style sentences)
 * - What this means (1 short paragraph)
 */
export function NarrativeBlock({
  scenario,
  findings,
  interpretation,
  className = ""
}: NarrativeBlockProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className={`p-5 bg-surface border border-border rounded-xl space-y-4 animate-fade-in ${className}`}
    >
      {/* Scenario / Question Summary */}
      {scenario && (
        <p className="text-secondary leading-relaxed">
          {scenario}
        </p>
      )}

      {/* What we found */}
      {findings.length > 0 && (
        <div className="space-y-2">
          {findings.map((finding, i) => (
            <p
              key={i}
              className="text-secondary text-sm leading-relaxed"
              style={{
                animationDelay: `${i * 100}ms`,
                animation: 'fade-slide-in 0.3s ease-out forwards',
                opacity: 0
              }}
            >
              {finding}
            </p>
          ))}
        </div>
      )}

      {/* What this means */}
      {interpretation && (
        <p
          className="text-muted text-sm pt-2 border-t border-border"
          style={{
            animationDelay: `${findings.length * 100 + 100}ms`,
            animation: 'fade-slide-in 0.3s ease-out forwards',
            opacity: 0
          }}
        >
          {interpretation}
        </p>
      )}
    </div>
  );
}
