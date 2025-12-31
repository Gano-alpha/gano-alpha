"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Simple dynamic import
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

// Hardcoded test data - AAPL with two suppliers
const TEST_DATA = {
  nodes: [
    { id: "AAPL", name: "Apple", group: "center", val: 20 },
    { id: "TSM", name: "TSMC", group: "supplier", val: 12 },
    { id: "QCOM", name: "Qualcomm", group: "supplier", val: 10 },
  ],
  links: [
    { source: "TSM", target: "AAPL" },
    { source: "QCOM", target: "AAPL" },
  ],
};

const COLORS: Record<string, string> = {
  center: "#10B981",
  supplier: "#F59E0B",
};

export default function TestGraph() {
  const fgRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Try to configure forces after mount
  useEffect(() => {
    if (mounted && fgRef.current) {
      console.log("TestGraph: fgRef.current =", fgRef.current);
      console.log("TestGraph: d3Force =", fgRef.current.d3Force);

      // Try to access d3Force
      const charge = fgRef.current.d3Force?.('charge');
      console.log("TestGraph: charge force =", charge);

      if (charge) {
        charge.strength(-300);
        console.log("TestGraph: Set charge strength to -300");
      }

      // Zoom to fit
      setTimeout(() => {
        fgRef.current?.zoomToFit?.(400, 50);
        console.log("TestGraph: Called zoomToFit");
      }, 1000);
    }
  }, [mounted]);

  if (!mounted) {
    return <div className="h-[400px] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-[400px] w-full border border-gray-700 rounded-lg overflow-hidden relative">
      <div className="absolute top-2 left-2 z-10 bg-black/80 px-3 py-2 rounded text-xs font-mono text-white">
        Test Graph: AAPL + 2 suppliers
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={600}
        height={400}
        graphData={TEST_DATA}
        backgroundColor="#0a0a0a"
        nodeRelSize={6}
        nodeVal={(node: any) => node.val}
        nodeColor={(node: any) => COLORS[node.group] || "#888"}
        nodeCanvasObject={(node: any, ctx) => {
          const size = Math.sqrt(node.val) * 4;
          const color = COLORS[node.group] || "#888";

          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw label
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(node.id, node.x, node.y + size + 14);
        }}
        linkColor={() => "#666"}
        linkWidth={2}
        linkDirectionalArrowLength={8}
        linkDirectionalArrowRelPos={0.9}
        cooldownTicks={100}
        onEngineStop={() => {
          console.log("TestGraph: Engine stopped");
          fgRef.current?.zoomToFit?.(300, 40);
        }}
      />

      {/* Debug buttons */}
      <div className="absolute bottom-2 right-2 z-10 flex gap-2">
        <button
          onClick={() => {
            console.log("Zoom button clicked, fgRef.current =", fgRef.current);
            if (fgRef.current) {
              const currentZoom = fgRef.current.zoom?.();
              console.log("Current zoom:", currentZoom);
              fgRef.current.zoom?.(currentZoom * 1.5, 300);
            }
          }}
          className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded"
        >
          Zoom In
        </button>
        <button
          onClick={() => {
            console.log("Fit button clicked");
            fgRef.current?.zoomToFit?.(300, 40);
          }}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
