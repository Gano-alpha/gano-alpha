"use client";

import { useState, useCallback } from "react";
import { Play, Search, ChevronDown, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getMiniGraph, searchStocks, MiniGraphNode, MiniGraphEdge } from "@/lib/api";

const exampleQueries = [
  { name: "NVDA Supply Chain", ticker: "NVDA" },
  { name: "ASML Customers", ticker: "ASML" },
  { name: "TSMC Network", ticker: "TSM" },
  { name: "AMD Ecosystem", ticker: "AMD" },
];

const availableFilters = [
  "centrality_flow",
  "centrality_operational",
  "centrality_social",
  "merton_pd",
  "rsi_14",
  "vol_z",
  "alpha_gap",
];

interface GraphResult {
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
  ticker: string;
}

export default function GraphPlayground() {
  const { getAccessToken } = useAuth();
  const [ticker, setTicker] = useState("NVDA");
  const [isRunning, setIsRunning] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [result, setResult] = useState<GraphResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ ticker: string; name: string; sector: string }>>([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleRun = useCallback(async () => {
    if (!ticker.trim()) return;

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const data = await getMiniGraph(getAccessToken, ticker.toUpperCase());
      setResult({
        nodes: data.nodes,
        edges: data.edges,
        ticker: data.ticker,
      });
    } catch (err) {
      console.error('Failed to fetch graph:', err);
      setError('Failed to load graph. Try another ticker.');
    } finally {
      setIsRunning(false);
    }
  }, [ticker, getAccessToken]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    try {
      const data = await searchStocks(getAccessToken, query, 5);
      setSearchResults(data.results);
      setShowSearch(true);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [getAccessToken]);

  return (
    <div className="flex flex-col md:flex-row h-[500px]">
      {/* Editor Side */}
      <div className="w-full md:w-1/2 border-r border-border flex flex-col">
        <div className="bg-surface border-b border-border p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted uppercase">Graph Query</span>

            {/* Example Queries Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-mono"
              >
                Examples
                <ChevronDown className="w-3 h-3" />
              </button>

              {showExamples && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-black border border-border rounded-lg shadow-xl z-10">
                  {exampleQueries.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTicker(example.ticker);
                        setShowExamples(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-mono text-primary hover:bg-surface border-b border-border last:border-b-0"
                    >
                      {example.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning || !ticker.trim()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition ${
              isRunning || !ticker.trim()
                ? "bg-accent/50 text-black cursor-not-allowed"
                : "bg-accent text-black hover:bg-emerald-400"
            }`}
          >
            <Play size={12} className={isRunning ? "animate-pulse" : ""} />
            {isRunning ? "LOADING..." : "RUN"}
          </button>
        </div>

        {/* Ticker Input */}
        <div className="p-4 border-b border-border relative">
          <label className="block text-xs font-mono text-muted uppercase mb-2">
            Ticker Symbol
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value.toUpperCase());
              handleSearch(e.target.value);
            }}
            onFocus={() => ticker.length >= 2 && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            className="w-full bg-black border border-border text-white px-4 py-3 rounded-sm focus:outline-none focus:border-accent font-mono text-lg placeholder:text-zinc-700 transition-colors"
            placeholder="NVDA"
          />

          {/* Search Results Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-black border border-border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
              {searchResults.map((stock) => (
                <button
                  key={stock.ticker}
                  onClick={() => {
                    setTicker(stock.ticker);
                    setShowSearch(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-surface border-b border-border last:border-b-0 flex items-center justify-between"
                >
                  <span className="font-mono text-sm text-white font-bold">{stock.ticker}</span>
                  <span className="text-xs text-muted truncate ml-2">{stock.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-grow bg-black p-4 font-mono text-sm text-muted overflow-auto">
          <p className="mb-4">This will query the knowledge graph for:</p>
          <ul className="space-y-2 text-accent">
            <li>• Direct suppliers of {ticker || '...'}</li>
            <li>• Direct customers of {ticker || '...'}</li>
            <li>• Edge relationships & confidence</li>
          </ul>
        </div>

        <div className="p-4 border-t border-border bg-surface/50">
          <p className="text-xs text-muted mb-2 font-mono">AVAILABLE FEATURES:</p>
          <div className="flex flex-wrap gap-2">
            {availableFilters.map((filter) => (
              <span
                key={filter}
                className="px-2 py-1 bg-accent/10 rounded border border-accent/20 font-mono text-[10px] text-accent"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Results Side */}
      <div className="w-full md:w-1/2 bg-black relative flex flex-col overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
          }}
        />

        {error && (
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded">
            <AlertCircle size={14} className="text-danger" />
            <span className="text-xs font-mono text-danger">{error}</span>
          </div>
        )}

        {isRunning ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 z-10">
              <div className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full mx-auto animate-spin" />
              <p className="text-accent font-mono text-sm">Querying graph for {ticker}...</p>
            </div>
          </div>
        ) : result ? (
          <div className="flex-1 overflow-auto p-4 z-10">
            <div className="mb-4">
              <h3 className="font-mono text-lg text-white mb-1">{result.ticker} Network</h3>
              <p className="text-xs text-muted font-mono">
                {result.nodes.length} nodes • {result.edges.length} edges
              </p>
            </div>

            {/* Nodes List */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-mono text-muted uppercase">Connected Nodes</h4>
              <div className="grid grid-cols-2 gap-2">
                {result.nodes.slice(0, 12).map((node) => (
                  <div
                    key={node.id}
                    className={`px-3 py-2 border rounded text-xs font-mono ${
                      node.type === 'center'
                        ? 'border-accent bg-accent/10 text-accent'
                        : node.type === 'supplier'
                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        : 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                    }`}
                  >
                    <span className="font-bold">{node.label}</span>
                    <span className="text-[10px] ml-2 opacity-60">
                      {node.type === 'center' ? '●' : node.type === 'supplier' ? '↑' : '↓'}
                    </span>
                  </div>
                ))}
              </div>
              {result.nodes.length > 12 && (
                <p className="text-[10px] text-muted font-mono">
                  +{result.nodes.length - 12} more nodes
                </p>
              )}
            </div>

            {/* Edges Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono text-muted uppercase">Edge Types</h4>
              <div className="space-y-1">
                {Array.from(new Set(result.edges.map(e => e.relationship))).slice(0, 5).map((rel) => (
                  <div key={rel} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-primary">{rel}</span>
                    <span className="text-muted">
                      {result.edges.filter(e => e.relationship === rel).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 z-10">
              <div className="w-16 h-16 bg-surface border border-border rounded-full mx-auto flex items-center justify-center">
                <Search className="text-muted" />
              </div>
              <p className="text-muted font-mono text-sm">
                Enter a ticker and run to query the graph...
              </p>
              <p className="text-xs text-muted/50 font-mono max-w-xs mx-auto">
                Results will show connected suppliers, customers, and edge relationships
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
