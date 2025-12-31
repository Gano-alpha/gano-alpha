"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

// Curated demo data showing AAPL's supply chain - a story users can understand
// Based on real supply chain relationships from SEC filings
const HERO_GRAPH_DATA = {
  nodes: [
    // Center: Apple
    { id: "AAPL", name: "Apple Inc", group: "center", val: 30, sector: "Technology" },

    // Key Suppliers (upstream) - from real SEC filings
    { id: "TSM", name: "Taiwan Semiconductor", group: "supplier", val: 18, sector: "Semiconductors" },
    { id: "QCOM", name: "Qualcomm", group: "supplier", val: 14, sector: "Semiconductors" },
    { id: "AVGO", name: "Broadcom", group: "supplier", val: 13, sector: "Semiconductors" },
    { id: "CRUS", name: "Cirrus Logic", group: "supplier", val: 10, sector: "Semiconductors" },
    { id: "NXPI", name: "NXP Semi", group: "supplier", val: 9, sector: "Semiconductors" },

    // Manufacturing Partners
    { id: "HON", name: "Honeywell", group: "supplier", val: 11, sector: "Industrials" },

    // Competitors / Market Context
    { id: "MSFT", name: "Microsoft", group: "competitor", val: 16, sector: "Technology" },
    { id: "GOOGL", name: "Alphabet", group: "competitor", val: 15, sector: "Technology" },
    { id: "AMZN", name: "Amazon", group: "customer", val: 14, sector: "Technology" },

    // Tier 2 - Supplier's suppliers (shows graph depth)
    { id: "ASML", name: "ASML Holding", group: "tier2", val: 12, sector: "Semiconductors" },
    { id: "LRCX", name: "Lam Research", group: "tier2", val: 8, sector: "Semiconductors" },
  ],
  links: [
    // Direct suppliers to Apple
    { source: "TSM", target: "AAPL", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "QCOM", target: "AAPL", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "AVGO", target: "AAPL", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "CRUS", target: "AAPL", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "NXPI", target: "AAPL", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "HON", target: "AAPL", type: "SUPPLIES_TO", layer: "Operational" },

    // Equipment suppliers to TSM (Tier 2)
    { source: "ASML", target: "TSM", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "LRCX", target: "TSM", type: "SUPPLIES_TO", layer: "Operational" },

    // Cross-supply relationships
    { source: "QCOM", target: "MSFT", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "AVGO", target: "GOOGL", type: "SUPPLIES_TO", layer: "Operational" },
    { source: "TSM", target: "AMZN", type: "SUPPLIES_TO", layer: "Operational" },

    // Competitive edges (market relationship)
    { source: "AAPL", target: "MSFT", type: "COMPETES_WITH", layer: "Social" },
    { source: "AAPL", target: "GOOGL", type: "COMPETES_WITH", layer: "Social" },
  ],
};

const GROUP_COLORS: Record<string, string> = {
  center: "#10B981",    // Emerald - the focus company
  supplier: "#F59E0B",  // Amber - upstream
  customer: "#3B82F6",  // Blue - downstream
  competitor: "#EF4444", // Red - competitive relationship
  tier2: "#8B5CF6",     // Purple - secondary/Tier 2
};

export default function HeroGraph() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Center and zoom after load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(500, 80);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getNodeColor = useCallback((node: any) => {
    return GROUP_COLORS[node.group] || "#71717a";
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050505] overflow-hidden">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/90 backdrop-blur border border-border/50 p-3 rounded-lg">
          <h3 className="font-mono text-[10px] text-muted uppercase tracking-wider mb-3">
            Supply Chain Map
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-gray-300 font-mono">Focus Company</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[11px] text-gray-300 font-mono">Suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[11px] text-gray-300 font-mono">Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              <span className="text-[11px] text-gray-300 font-mono">Tier 2 (indirect)</span>
            </div>
          </div>
        </div>
      </div>

      {/* What-If Scenarios Panel */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/90 border border-border/50 px-4 py-3 rounded-lg max-w-[200px]">
          <h3 className="font-mono text-[10px] text-accent uppercase tracking-wider mb-2">
            Shock Scenarios
          </h3>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors">
              <span className="text-red-400">⚡</span>
              <span>TSM disruption (Taiwan)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors">
              <span className="text-amber-400">📈</span>
              <span>Rate hike +100bps</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors">
              <span className="text-blue-400">🏭</span>
              <span>Chip shortage</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border/30">
            <div className="font-mono text-[10px] text-muted">
              Full graph: <span className="text-white">9,839</span> nodes
            </div>
          </div>
        </div>
      </div>


      {/* Hover Tooltip */}
      {hoverNode && (
        <div
          className="absolute z-20 pointer-events-none bg-black/95 border border-border p-3 rounded-lg shadow-2xl"
          style={{ bottom: 80, left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: GROUP_COLORS[hoverNode.group] }}
            />
            <span className="font-mono font-bold text-white text-lg">{hoverNode.id}</span>
            <span className="text-muted text-sm">{hoverNode.name}</span>
          </div>
          <div className="mt-2 text-xs text-muted font-mono">
            {hoverNode.group === 'center' ? 'Focus company — shock propagation origin' :
             hoverNode.group === 'supplier' ? `Direct supplier to ${hoverNode.sector}` :
             hoverNode.group === 'customer' ? 'Downstream customer' :
             hoverNode.group === 'competitor' ? 'Market competitor' :
             'Tier 2 — indirect exposure'}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-black/90 border border-accent/30 px-4 py-2 rounded-full flex items-center gap-3">
          <span className="font-mono text-xs text-accent">
            AAPL Supply Chain
          </span>
          <span className="text-border">|</span>
          <span className="font-mono text-xs text-muted">
            Click scenarios above to simulate shocks
          </span>
        </div>
      </div>

      {/* The Graph */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={HERO_GRAPH_DATA}
        backgroundColor="#050505"
        nodeLabel={() => ""}
        nodeRelSize={6}
        nodeVal={(node: any) => node.val}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const size = Math.sqrt(node.val) * 3;
          const color = getNodeColor(node);
          const isCenter = node.group === 'center';

          // Glow for center node
          if (isCenter) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI);
            ctx.fillStyle = `${color}22`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
            ctx.fillStyle = `${color}44`;
            ctx.fill();
          }

          // Main circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Border
          ctx.strokeStyle = isCenter ? '#ffffff' : `${color}88`;
          ctx.lineWidth = isCenter ? 2 : 1;
          ctx.stroke();

          // Always show ticker label
          const fontSize = isCenter ? 14 : 11;
          ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Text background
          const textWidth = ctx.measureText(node.id).width;
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.fillRect(
            node.x - textWidth / 2 - 4,
            node.y + size + 6,
            textWidth + 8,
            fontSize + 6
          );

          // Ticker text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(node.id, node.x, node.y + size + 6 + fontSize / 2 + 3);
        }}
        linkColor={() => "rgba(100, 100, 120, 0.4)"}
        linkWidth={1.5}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.9}
        linkCurvature={0.1}
        onNodeHover={(node: any) => setHoverNode(node || null)}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.25}
        {...{
          d3Force: (name: string, force: any) => {
            // Stronger centering force
            if (name === 'charge') {
              force.strength(-200);
            }
            if (name === 'link') {
              force.distance(100);
            }
          }
        } as any}
      />
    </div>
  );
}
