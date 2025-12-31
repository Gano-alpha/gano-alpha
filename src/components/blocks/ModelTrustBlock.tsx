"use client";

import { useState } from "react";
import { ChevronDown, Shield, Zap, Info } from "lucide-react";

interface ModelStats {
  model: 'OG' | 'Sniper';
  hitRate: number;
  avgReturn: {
    high: number;
    medium: number;
    low: number;
  };
  sampleSize: number;
}

interface Definition {
  term: string;
  explanation: string;
}

interface ModelTrustBlockProps {
  models: ModelStats[];
  definitions?: Definition[];
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Model Trust Block
 *
 * Purpose: Make trust measurable. Separate model quality from current opinion.
 * No marketing language. Numbers > adjectives. Always optional, never intrusive.
 *
 * Layout:
 * - Model Overview (OG | Sniper)
 * - Calibration (High/Low conviction performance)
 * - Definitions
 */
export function ModelTrustBlock({
  models,
  definitions = [],
  defaultExpanded = false,
  className = ""
}: ModelTrustBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-muted hover:text-secondary transition-colors"
      >
        <Info size={14} />
        <span>Model accuracy & definitions</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="mt-3 p-4 bg-surface border border-border rounded-lg space-y-4"
          style={{ animation: 'fade-slide-in 0.2s ease-out forwards' }}
        >
          {/* Model Overview */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-3">Model Overview</p>
            <div className="grid grid-cols-2 gap-3">
              {models.map((model, i) => (
                <div
                  key={model.model}
                  className={`p-3 rounded-lg border ${
                    model.model === 'OG'
                      ? 'border-blue-500/20 bg-blue-500/5'
                      : 'border-purple-500/20 bg-purple-500/5'
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animation: 'fade-slide-in 0.2s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {model.model === 'OG' ? (
                      <Shield size={14} className="text-blue-400" />
                    ) : (
                      <Zap size={14} className="text-purple-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      model.model === 'OG' ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                      {model.model}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Hit rate</span>
                      <span className="font-mono text-primary">{(model.hitRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Sample</span>
                      <span className="font-mono text-primary">{model.sampleSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calibration */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-3">Calibration</p>
            <div className="space-y-2">
              {models.map((model) => (
                <div key={`cal-${model.model}`} className="space-y-1">
                  <p className="text-xs text-secondary font-medium">{model.model}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-background/50 rounded">
                      <p className="text-muted">High conviction</p>
                      <p className={`font-mono ${model.avgReturn.high >= 0 ? 'text-teal' : 'text-red-400'}`}>
                        {model.avgReturn.high >= 0 ? '+' : ''}{model.avgReturn.high}bp
                      </p>
                    </div>
                    <div className="p-2 bg-background/50 rounded">
                      <p className="text-muted">Medium</p>
                      <p className={`font-mono ${model.avgReturn.medium >= 0 ? 'text-teal' : 'text-red-400'}`}>
                        {model.avgReturn.medium >= 0 ? '+' : ''}{model.avgReturn.medium}bp
                      </p>
                    </div>
                    <div className="p-2 bg-background/50 rounded">
                      <p className="text-muted">Low</p>
                      <p className={`font-mono ${model.avgReturn.low >= 0 ? 'text-teal' : 'text-red-400'}`}>
                        {model.avgReturn.low >= 0 ? '+' : ''}{model.avgReturn.low}bp
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Definitions */}
          {definitions.length > 0 && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-3">Definitions</p>
              <div className="space-y-2">
                {definitions.map((def, i) => (
                  <div
                    key={i}
                    className="text-xs"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animation: 'fade-slide-in 0.2s ease-out forwards',
                      opacity: 0
                    }}
                  >
                    <span className="text-secondary font-medium">{def.term}:</span>{' '}
                    <span className="text-muted">{def.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
