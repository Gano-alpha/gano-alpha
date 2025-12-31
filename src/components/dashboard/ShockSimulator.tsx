"use client";

import { useState } from "react";
import { MessageSquare, SplitSquareHorizontal } from "lucide-react";
import GanoChat from "./GanoChat";
import ComparisonView from "./ComparisonView";

/**
 * ShockSimulator - Main entry point for the risk analysis interface.
 *
 * Now uses a chat-based interface powered by GANO's MCP tools instead of
 * the previous graph visualization approach.
 *
 * Two modes:
 * 1. Chat Mode: Direct chat with GANO Reasoner
 * 2. Comparison Mode: Side-by-side GANO vs Generic LLM
 */
export default function ShockSimulator() {
  const [mode, setMode] = useState<'chat' | 'compare'>('chat');

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('chat')}
          className={`px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2 transition-all ${
            mode === 'chat'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-[#111] border border-[#333] text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          onClick={() => setMode('compare')}
          className={`px-4 py-2 rounded-lg font-mono text-sm flex items-center gap-2 transition-all ${
            mode === 'compare'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-[#111] border border-[#333] text-gray-400 hover:text-white'
          }`}
        >
          <SplitSquareHorizontal size={16} />
          Compare vs ChatGPT
        </button>
      </div>

      {/* Content */}
      {mode === 'chat' ? <GanoChat /> : <ComparisonView />}
    </div>
  );
}
