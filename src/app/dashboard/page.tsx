"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/auth-context";
import RegimeGauge from "@/components/dashboard/RegimeGauge";
import SignalFeed from "@/components/dashboard/SignalFeed";
import MertonCaseStudy from "@/components/dashboard/MertonCaseStudy";
import GraphPlayground from "@/components/dashboard/GraphPlayground";
import { LogOut } from "lucide-react";

const ShockSimulator = dynamic(() => import("@/components/dashboard/ShockSimulator"), {
  ssr: false,
  loading: () => (
    <div className="h-[700px] flex items-center justify-center bg-surface border border-border rounded-xl">
      <p className="font-mono text-sm text-muted animate-pulse">Loading Shock Simulator...</p>
    </div>
  ),
});

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Protect this route
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-mono text-sm text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 space-y-32">

      {/* SECTION 1: THE FLIGHT RECORDER (Hero) */}
      <section className="space-y-8 min-h-[90vh] flex flex-col justify-center">
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-border pb-6 gap-6">
          <div className="space-y-2">
            <h1 className="font-serif text-6xl md:text-8xl text-white tracking-tighter leading-none">
              GANO<span className="text-accent">.</span>ALPHA
            </h1>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow"></span>
              <p className="font-mono text-muted text-xs uppercase tracking-[0.2em]">
                System Online • v14.2 • {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <RegimeGauge />
            <button
              onClick={handleLogout}
              className="p-2 border border-border rounded hover:bg-surface transition-colors"
              title="Logout"
            >
              <LogOut size={16} className="text-muted" />
            </button>
          </div>
        </header>

        {/* Shock Simulator replaces the old static HeroGraph */}
        <ShockSimulator />
      </section>

      {/* SECTION 2: THE THESIS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
            Price is Noise. <br/>
            <span className="text-muted italic">Structure is Signal.</span>
          </h2>
          <p className="text-lg text-muted leading-relaxed max-w-md">
            Most algorithms treat a -5% drop as a number. We treat it as a node in a 200k-edge graph.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-3 border border-border rounded bg-surface/30">
              <span className="block w-2 h-2 rounded-full bg-red-500 mb-2"></span>
              <div className="font-mono text-xs font-bold text-white">OPERATIONAL</div>
              <div className="text-[10px] text-muted">Supply Chain</div>
            </div>
            <div className="p-3 border border-border rounded bg-surface/30">
              <span className="block w-2 h-2 rounded-full bg-green-500 mb-2"></span>
              <div className="font-mono text-xs font-bold text-white">SOCIAL</div>
              <div className="text-[10px] text-muted">Board Network</div>
            </div>
            <div className="p-3 border border-border rounded bg-surface/30">
              <span className="block w-2 h-2 rounded-full bg-blue-500 mb-2"></span>
              <div className="font-mono text-xs font-bold text-white">ENVIRONMENTAL</div>
              <div className="text-[10px] text-muted">Regulatory</div>
            </div>
            <div className="p-3 border border-border rounded bg-surface/30">
              <span className="block w-2 h-2 rounded-full bg-amber-500 mb-2"></span>
              <div className="font-mono text-xs font-bold text-white">FLOW</div>
              <div className="text-[10px] text-muted">ETF Liquidity</div>
            </div>
          </div>
        </div>
        <div className="h-[500px] bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-black/50">
            <div className="font-mono text-xs text-accent uppercase tracking-wider">Live Signals</div>
          </div>
          <SignalFeed />
        </div>
      </section>

      {/* SECTION 3: STATS */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-border pb-4">
          <h2 className="font-serif text-4xl text-white">Performance Audit</h2>
          <p className="font-mono text-xs text-accent">OUT-OF-SAMPLE (2024-2025)</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          {[
            { label: "Sharpe Ratio", value: "2.90", sub: "Risk-Adjusted" },
            { label: "Alpha (OOS)", value: "+14.69%", sub: "V14 Production" },
            { label: "Win Rate", value: "63.3%", sub: "Base Hit Rate" },
            { label: "Graph Nodes", value: "3,061", sub: "207k Edges" },
          ].map((stat, i) => (
            <div key={i} className="bg-background p-8 hover:bg-surface/50 transition duration-300">
              <div className="font-mono text-xs text-muted uppercase mb-2">{stat.label}</div>
              <div className="font-serif text-3xl md:text-4xl text-white">{stat.value}</div>
              <div className="font-mono text-[10px] text-muted mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: MERTON */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-border pb-4">
          <div>
            <h2 className="font-serif text-4xl text-white">The Trap</h2>
            <p className="text-muted text-sm mt-2">When Price ignores Merton PD warnings</p>
          </div>
          <p className="font-mono text-xs text-danger">CASE STUDY</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-[400px] bg-surface border border-border rounded-xl p-6">
            <MertonCaseStudy />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-surface border border-border rounded-lg">
              <div className="font-mono text-xs text-muted uppercase mb-2">The Pattern</div>
              <p className="text-sm text-primary leading-relaxed">
                Price stable while Merton PD spikes. Retail sees oversold. We see risk.
              </p>
            </div>
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg">
              <div className="font-mono text-xs text-danger uppercase mb-2">Outcome</div>
              <p className="text-sm text-danger/80">-55% drawdown in 30 days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PLAYGROUND */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-border pb-4">
          <div>
            <h2 className="font-serif text-4xl text-white">Graph Playground</h2>
            <p className="text-muted text-sm mt-2">Query the knowledge graph</p>
          </div>
          <p className="font-mono text-xs text-accent">207,810 EDGES • 3,061 NODES</p>
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <GraphPlayground />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border pt-12 pb-24 text-center space-y-8">
        <p className="font-serif text-2xl text-muted italic">
          &quot;In the short run, the market is a voting machine.<br/>
          In the long run, it is a graph.&quot;
        </p>
        <div className="flex justify-center gap-6 font-mono text-[10px] text-gray-600 uppercase tracking-widest">
          <span>Python Core</span>
          <span>•</span>
          <span>NetworkX</span>
          <span>•</span>
          <span>Next.js</span>
        </div>
      </footer>
    </div>
  );
}
