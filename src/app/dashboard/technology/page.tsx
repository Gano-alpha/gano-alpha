"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Cpu, BarChart3, Layers, Code2, FileJson } from "lucide-react";
import mermaid from "mermaid";

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#10B981",
    primaryTextColor: "#E4E4E7",
    primaryBorderColor: "#27272a",
    lineColor: "#52525b",
    secondaryColor: "#3B82F6",
    tertiaryColor: "#0A0A0A",
    background: "#050505",
    mainBkg: "#0A0A0A",
    nodeBorder: "#27272a",
    clusterBkg: "#0A0A0A",
    clusterBorder: "#27272a",
    titleColor: "#E4E4E7",
    edgeLabelBackground: "#0A0A0A",
  },
  flowchart: {
    htmlLabels: true,
    curve: "basis",
  },
});

const architectureDiagram = `
graph TD
    %% Styling
    classDef python fill:#10B981,stroke:#059669,stroke-width:2px,color:#000;
    classDef data fill:#3B82F6,stroke:#2563EB,stroke-width:2px,color:#fff;
    classDef web fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#000;

    subgraph "Layer 1: The Engine (Python/Backend)"
        A[Ingestion Pipeline] -->|Clean| B(Vectorized Graph Builder)
        B -->|Compute| C{Structural Shock Detector}

        subgraph "Core Modules"
            C1[regime_classifier.py]
            C2[temporal.py]
            C3[why_did_it_move.py]
        end

        C -.-> C1
        C -.-> C2
        C -.-> C3
    end

    subgraph "Layer 2: The Data Layer"
        D[(Postgres / Parquet)]
        E[Static Artifacts JSON]

        C -->|Write| D
        C -->|Export| E
    end

    subgraph "Layer 3: Delivery (Next.js 14)"
        F[FastAPI Gateway] -->|Read| D
        G[Dashboard UI]

        E -->|Direct Load| G
        F -->|Live Query| G
    end

    %% Mapping Features to Modules
    C1 -->|Drives| H[Traffic Light Indicator]
    C3 -->|Drives| I[Attribution Text]
    B -->|Drives| J[React Flow Graph]

    class A,B,C,C1,C2,C3 python;
    class D,E data;
    class F,G,H,I,J web;
`;

const apiEndpoints = [
  { method: "GET", path: "/v1/signals", description: "Fetch current trading signals with confidence scores" },
  { method: "GET", path: "/v1/market-status", description: "Current regime classification and graph stats" },
  { method: "GET", path: "/v1/mini-graph/:ticker", description: "Supply chain subgraph for a specific ticker" },
  { method: "GET", path: "/v1/whispers", description: "Anomaly detection alerts and Merton PD spikes" },
  { method: "GET", path: "/health", description: "System health check and graph loading status" },
];

const techStack = [
  { category: "Graph Engine", items: ["207,000+ edges", "RGBA Centrality Model", "Temporal Decay Functions"] },
  { category: "Data Sources", items: ["SEC EDGAR (10-K, 10-Q, 8-K)", "Merton Model (PD)", "Options Flow"] },
  { category: "Backend", items: ["Python 3.11", "FastAPI", "PostgreSQL", "Parquet"] },
  { category: "Frontend", items: ["Next.js 14", "React Flow", "Recharts", "Tailwind CSS"] },
];

export default function TechnologyPage() {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = "";
      mermaid.render("architecture-diagram", architectureDiagram).then(({ svg }) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-mono">Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-accent" />
            <span className="font-mono text-sm text-primary">SYSTEM ARCHITECTURE</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl text-primary">
            The Technology Behind GANO
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto font-mono">
            We mapped the structure of the U.S. economy into a 207,000-edge knowledge graph.
            Price is noise. Structure is signal.
          </p>
        </section>

        {/* Architecture Diagram */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Layers size={20} className="text-accent" />
            <h2 className="font-mono text-xl text-primary uppercase tracking-wider">
              System Architecture
            </h2>
          </div>

          <div className="border border-border rounded-lg bg-surface/30 p-8 overflow-x-auto">
            <div
              ref={mermaidRef}
              className="min-w-[600px] flex justify-center [&_svg]:max-w-full"
            />
          </div>

          <p className="text-sm text-muted font-mono text-center">
            Real-time data flows from SEC filings through our vectorized graph engine to your dashboard.
          </p>
        </section>

        {/* The "Why" Section */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-accent" />
              <h2 className="font-mono text-xl text-primary uppercase tracking-wider">
                The Methodology
              </h2>
            </div>

            <div className="border border-border rounded-lg bg-surface/30 p-6 space-y-4">
              <p className="text-muted leading-relaxed">
                We track <span className="text-accent font-bold">6,000+ supplier-customer pairs</span> extracted
                from SEC filings using LLM-powered NLP. Each relationship is scored for confidence and
                weighted by revenue exposure.
              </p>
              <p className="text-muted leading-relaxed">
                Our <span className="text-primary font-bold">RGBA Centrality Model</span> computes four
                dimensions of systemic importance: Operational (supply chain), Social (board links),
                Flow (ETF holdings), and Environmental (macro sensitivity).
              </p>
              <p className="text-muted leading-relaxed">
                When structural shocks propagate through the graph, we detect them
                <span className="text-danger font-bold"> before</span> they hit the order book.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Database size={20} className="text-accent" />
              <h2 className="font-mono text-xl text-primary uppercase tracking-wider">
                Tech Stack
              </h2>
            </div>

            <div className="border border-border rounded-lg bg-surface/30 p-6">
              <div className="grid grid-cols-2 gap-6">
                {techStack.map((stack) => (
                  <div key={stack.category} className="space-y-2">
                    <h3 className="font-mono text-xs text-muted uppercase tracking-wider">
                      {stack.category}
                    </h3>
                    <ul className="space-y-1">
                      {stack.items.map((item) => (
                        <li key={item} className="text-sm text-primary font-mono flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* API Documentation */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Code2 size={20} className="text-accent" />
            <h2 className="font-mono text-xl text-primary uppercase tracking-wider">
              API Reference
            </h2>
            <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-mono rounded">
              v1
            </span>
          </div>

          <div className="border border-border rounded-lg bg-surface/30 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface border-b border-border text-xs font-mono text-muted uppercase">
              <div className="col-span-2">Method</div>
              <div className="col-span-4">Endpoint</div>
              <div className="col-span-6">Description</div>
            </div>

            {apiEndpoints.map((endpoint) => (
              <div
                key={endpoint.path}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-white/5 transition-colors"
              >
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                    endpoint.method === "GET" ? "bg-accent/20 text-accent" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {endpoint.method}
                  </span>
                </div>
                <div className="col-span-4 font-mono text-sm text-primary">
                  {endpoint.path}
                </div>
                <div className="col-span-6 text-sm text-muted">
                  {endpoint.description}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted font-mono text-center">
            All endpoints require Bearer token authentication. Contact us for API access.
          </p>
        </section>

        {/* Data Artifacts */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <FileJson size={20} className="text-accent" />
            <h2 className="font-mono text-xl text-primary uppercase tracking-wider">
              Data Artifacts
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "graph_data.json", desc: "Full knowledge graph topology", size: "~650KB" },
              { name: "signals.json", desc: "Daily trading signals", size: "~15KB" },
              { name: "regime.json", desc: "Market regime classification", size: "~2KB" },
            ].map((artifact) => (
              <div
                key={artifact.name}
                className="border border-border rounded-lg bg-surface/30 p-4 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-accent">{artifact.name}</span>
                  <span className="text-xs text-muted font-mono">{artifact.size}</span>
                </div>
                <p className="text-xs text-muted">{artifact.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 border-t border-border">
          <p className="font-serif italic text-muted text-lg mb-4">
            Want to integrate GANO into your workflow?
          </p>
          <a
            href="mailto:api@ganoalpha.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-mono text-sm font-bold rounded hover:bg-emerald-400 transition-colors"
          >
            Request API Access
          </a>
        </section>
      </main>
    </div>
  );
}
