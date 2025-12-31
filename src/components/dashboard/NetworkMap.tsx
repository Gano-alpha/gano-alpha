"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useData, GraphTopology, GraphNode as ApiGraphNode, GraphLink as ApiGraphLink } from "@/hooks/useData";

// Dynamically import to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode extends ApiGraphNode {
  x?: number;
  y?: number;
}

interface GraphLink extends Omit<ApiGraphLink, 'source' | 'target'> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata?: {
    total_nodes: number;
    total_edges: number;
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.ganoalpha.com';

export default function NetworkMap() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<GraphLink>>(new Set());
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [dataSource, setDataSource] = useState<'api' | 'static'>('api');

  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Load graph data - try API first, fallback to static file
  useEffect(() => {
    async function loadGraphData() {
      // Try API endpoint first
      try {
        const response = await fetch(`${BACKEND_URL}/v1/graph-topology`);
        if (response.ok) {
          const graph = await response.json();
          console.log(`Loaded graph from API: ${graph.nodes.length} nodes, ${graph.links.length} edges`);
          setData(graph);
          setDataSource('api');
          return;
        }
      } catch (err) {
        console.warn("API graph-topology not available, falling back to static file");
      }

      // Fallback to static JSON file
      try {
        const response = await fetch("/data/graph_data.json");
        const graph = await response.json();
        console.log(`Loaded graph from static: ${graph.nodes.length} nodes, ${graph.links.length} edges`);
        setData(graph);
        setDataSource('static');
      } catch (err) {
        console.error("Failed to load graph:", err);
      }
    }

    loadGraphData();
  }, []);

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

  // "Blast Radius" - Click node to highlight its network
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      const newHighlightNodes = new Set<string>();
      const newHighlightLinks = new Set<GraphLink>();

      if (node && node.id !== selectedNode?.id) {
        newHighlightNodes.add(node.id);

        // Find all connected nodes
        data.links.forEach((link) => {
          const sourceId = typeof link.source === "object" ? link.source.id : link.source;
          const targetId = typeof link.target === "object" ? link.target.id : link.target;

          if (sourceId === node.id || targetId === node.id) {
            newHighlightLinks.add(link);
            newHighlightNodes.add(sourceId);
            newHighlightNodes.add(targetId);
          }
        });

        setSelectedNode(node);

        // Zoom to node
        if (fgRef.current) {
          fgRef.current.centerAt(node.x, node.y, 1000);
          fgRef.current.zoom(3, 1500);
        }
      } else {
        setSelectedNode(null);
      }

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    },
    [data.links, selectedNode]
  );

  const clearFocus = useCallback(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setSelectedNode(null);
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 50);
    }
  }, []);

  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 500);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 500);

  // Color nodes by group/layer
  const getNodeColor = useCallback(
    (node: GraphNode) => {
      // If in focus mode, dim non-highlighted nodes
      if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) {
        return "#18181b";
      }

      switch (node.group) {
        case "Operational":
          return "#EF4444"; // Red - Supply Chain
        case "Flow":
          return "#3B82F6"; // Blue - ETF/Flow
        case "Social":
          return "#10B981"; // Emerald - Board Links
        case "Environmental":
          return "#F59E0B"; // Amber - Macro/Regulatory
        default:
          return "#71717a"; // Zinc
      }
    },
    [highlightNodes]
  );

  // Link styling
  const getLinkColor = useCallback(
    (link: GraphLink) => {
      if (highlightLinks.size > 0) {
        return highlightLinks.has(link) ? "#ffffff" : "#0a0a0a";
      }
      // Color by relationship layer
      switch (link.layer) {
        case "Operational":
          return "rgba(239, 68, 68, 0.3)";
        case "Flow":
          return "rgba(59, 130, 246, 0.3)";
        case "Social":
          return "rgba(16, 185, 129, 0.3)";
        default:
          return "rgba(39, 39, 42, 0.5)";
      }
    },
    [highlightLinks]
  );

  const getLinkWidth = useCallback(
    (link: GraphLink) => {
      if (highlightLinks.has(link)) return 2;
      return 0.5;
    },
    [highlightLinks]
  );

  if (data.nodes.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-sm text-muted">Loading graph topology...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-background overflow-hidden">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/90 backdrop-blur border border-border p-3 rounded-md space-y-2 pointer-events-auto">
          <h3 className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
            Risk Topology
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-gray-300 font-mono">Supply Chain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-300 font-mono">ETF Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-gray-300 font-mono">Board Links</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-gray-300 font-mono">Macro/Sector</span>
            </div>
          </div>

          {selectedNode && (
            <button
              onClick={clearFocus}
              className="mt-3 w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-[10px] text-white py-1.5 px-2 rounded transition"
            >
              <X size={10} /> Clear Focus
            </button>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-black/90 border border-border rounded hover:bg-surface transition"
        >
          <ZoomIn size={14} className="text-muted" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-black/90 border border-border rounded hover:bg-surface transition"
        >
          <ZoomOut size={14} className="text-muted" />
        </button>
      </div>

      {/* Stats Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/90 border border-border px-3 py-2 rounded-md">
          <div className="font-mono text-[10px] text-muted">
            <span className="text-white">{data.nodes.length}</span> nodes •{" "}
            <span className="text-white">{data.links.length}</span> edges
          </div>
          <div className="font-mono text-[9px] text-muted/60 mt-1">
            {dataSource === 'api' ? '● LIVE' : '○ CACHED'}
          </div>
        </div>
      </div>

      {/* Node Tooltip (Mini Terminal) */}
      {hoverNode && (
        <div
          className="absolute z-20 pointer-events-none bg-black border border-border p-3 rounded shadow-2xl w-52"
          style={{ top: 60, right: 16 }}
        >
          <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
            <span className="font-bold text-white font-mono text-lg">{hoverNode.id}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                hoverNode.group === "Operational"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : hoverNode.group === "Flow"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : hoverNode.group === "Social"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
            >
              {hoverNode.group}
            </span>
          </div>
          <div className="text-[10px] text-muted mb-2 truncate">{hoverNode.name}</div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Sector:</span>
              <span className="text-primary truncate ml-2">{hoverNode.sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Centrality:</span>
              <span className="text-white">{hoverNode.metrics.centrality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Merton PD:</span>
              <span className="text-danger">{hoverNode.metrics.merton_pd}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Connections:</span>
              <span className="text-accent">{hoverNode.metrics.edge_count}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/50 text-[9px] text-muted font-mono">
            Click to see blast radius
          </div>
        </div>
      )}

      {/* The Graph Engine */}
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor="#050505"
        // Nodes
        nodeLabel={() => ""} // Disable default label
        nodeRelSize={4}
        nodeVal={(node: any) => node.val || 1}
        nodeColor={getNodeColor as any}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const size = Math.sqrt(node.val || 1) * 4;
          const color = getNodeColor(node);
          const isHighlighted = highlightNodes.has(node.id);
          const isLargeNode = node.val > 5;

          // Draw outer glow for highlighted/large nodes
          if (isHighlighted || isLargeNode) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
            ctx.fillStyle = `${color}33`;
            ctx.fill();
          }

          // Draw main node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Draw border for better definition
          ctx.strokeStyle = isHighlighted ? '#ffffff' : `${color}88`;
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.stroke();

          // Always show ticker label for nodes with val > 3, or when zoomed in
          const showLabel = node.val > 3 || globalScale > 1.5 || isHighlighted;
          if (showLabel) {
            const fontSize = Math.max(10, 12 / globalScale);
            ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Draw text background for readability
            const textWidth = ctx.measureText(node.id).width;
            ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
            ctx.fillRect(
              node.x - textWidth / 2 - 2,
              node.y + size + 4,
              textWidth + 4,
              fontSize + 2
            );

            // Draw ticker text
            ctx.fillStyle = isHighlighted ? "#ffffff" : "#e5e5e5";
            ctx.fillText(node.id, node.x, node.y + size + 4 + fontSize / 2 + 1);
          }
        }}
        // Links
        linkColor={getLinkColor as any}
        linkWidth={getLinkWidth as any}
        linkDirectionalParticles={(link: any) => (highlightLinks.has(link) ? 3 : 0)}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        // Interaction
        onNodeClick={handleNodeClick as any}
        onNodeHover={(node: any) => {
          setHoverNode(node || null);
          if (containerRef.current) {
            containerRef.current.style.cursor = node ? "pointer" : "default";
          }
        }}
        onBackgroundClick={clearFocus}
        // Physics - add padding to keep nodes away from edges
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        onEngineStop={() => {
          // Fit graph with padding after simulation stabilizes
          if (fgRef.current) {
            fgRef.current.zoomToFit(400, 60);
          }
        }}
      />
    </div>
  );
}
