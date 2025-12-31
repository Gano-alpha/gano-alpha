"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Animation state for live thinking section
  const [animationStep, setAnimationStep] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, loading, router]);

  // Intersection observer to trigger animation when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('live-thinking-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, [isInView]);

  // Sequential animation steps
  useEffect(() => {
    if (!isInView) return;

    const steps = [
      { delay: 0 },      // Step 0: Question appears
      { delay: 600 },    // Step 1: First check
      { delay: 1200 },   // Step 2: Second check
      { delay: 1800 },   // Step 3: Third check
      { delay: 2400 },   // Step 4: Fourth check
      { delay: 3000 },   // Step 5: Answer header
      { delay: 3400 },   // Step 6: Row 1
      { delay: 3700 },   // Step 7: Row 2
      { delay: 4000 },   // Step 8: Row 3
      { delay: 4300 },   // Step 9: Row 4
      { delay: 4600 },   // Step 10: Row 5
      { delay: 4900 },   // Step 11: Footer
    ];

    steps.forEach((step, index) => {
      setTimeout(() => setAnimationStep(index + 1), step.delay);
    });
  }, [isInView]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="text-lg font-semibold text-primary tracking-tight">
          GanoAlpha
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-secondary hover:text-primary transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-primary text-background font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Request access
          </Link>
        </div>
      </header>

      <main className="px-6 max-w-5xl mx-auto">
        {/* Hero - Authority + Tension */}
        <section className="py-20 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold text-primary leading-[1.1] tracking-tight mb-6">
            Interrogate the market.
            <br />
            <span className="text-secondary">Reveal the structure.</span>
            <br />
            <span className="text-secondary">Act with proof.</span>
          </h1>
          <p className="text-lg text-secondary leading-relaxed mb-4 max-w-xl">
            GanoAlpha analyzes filings, earnings, supply chains, factor exposures, and live market signals
            <br className="hidden md:block" />
            to answer real investing questions — not essays.
          </p>
          <p className="text-sm text-muted mb-8">
            Built for investors who want answers they can verify.
          </p>
          <div>
            <Link
              href="/signup"
              className="inline-block bg-primary text-background font-medium px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Request access
            </Link>
            <p className="text-xs text-muted mt-3">
              Private release — limited seats.
            </p>
          </div>
        </section>

        {/* Live Thinking Section */}
        <section id="live-thinking-section" className="py-16 border-t border-border">
          <h2 className="text-sm text-muted uppercase tracking-wider mb-10">
            What actually happens when you ask a question
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: The process */}
            <div className="space-y-8">
              <div className={`transition-all duration-500 ${animationStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <p className="text-xs text-muted uppercase tracking-wider mb-2">The question</p>
                <p className="text-xl text-primary font-medium">
                  Who actually benefits if the Fed cuts rates?
                </p>
              </div>

              {/* Progressive orchestration stack */}
              <div className="space-y-0">
                <div className={`flex items-start gap-3 transition-all duration-200 ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-teal mt-1.5"></div>
                    <div className={`w-px h-6 bg-border transition-all duration-300 ${animationStep >= 3 ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-primary font-medium">Macro detected</p>
                    <p className="text-xs text-muted font-mono">rate_10y factor</p>
                  </div>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-200 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-teal mt-1.5"></div>
                    <div className={`w-px h-6 bg-border transition-all duration-300 ${animationStep >= 4 ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-primary font-medium">Tool selected</p>
                    <p className="text-xs text-muted font-mono">get_tickers_by_factor</p>
                  </div>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-200 ${animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-teal mt-1.5"></div>
                    <div className={`w-px h-6 bg-border transition-all duration-300 ${animationStep >= 5 ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-primary font-medium">Filters applied</p>
                    <p className="text-xs text-muted font-mono">r² ≥ 0.2, |β| ≥ 0.25</p>
                  </div>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-200 ${animationStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-teal mt-1.5"></div>
                    <div className={`w-px h-6 bg-border transition-all duration-300 ${animationStep >= 6 ? 'opacity-100' : 'opacity-0'}`}></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-primary font-medium">Models consulted</p>
                    <p className="text-xs text-muted font-mono">OG, Sniper</p>
                  </div>
                </div>
                <div className={`flex items-start gap-3 transition-all duration-200 ${animationStep >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5"></div>
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Ranked output</p>
                    <p className="text-xs text-muted font-mono">20 tickers, scored</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: The output */}
            <div className={`bg-surface border border-border rounded-xl overflow-hidden transition-all duration-500 ${animationStep >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="px-5 py-4 border-b border-border">
                <p className="text-xs text-muted uppercase tracking-wider">Ranked by sensitivity, confidence, and evidence</p>
              </div>
              <div className="divide-y divide-border">
                <div className={`grid grid-cols-12 gap-2 px-5 py-2 text-xs text-muted bg-background/50 transition-opacity duration-300 ${animationStep >= 6 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Ticker</div>
                  <div className="col-span-4 text-right">Rate sensitivity</div>
                  <div className="col-span-3 text-right">r²</div>
                </div>
                <div className={`grid grid-cols-12 gap-2 px-5 py-3 transition-all duration-300 ${animationStep >= 7 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                  <div className="col-span-1 text-accent font-medium text-sm">1</div>
                  <div className="col-span-4 font-mono text-sm text-primary font-medium">DDOG</div>
                  <div className="col-span-4 text-right font-mono text-sm text-primary">-0.275</div>
                  <div className="col-span-3 text-right font-mono text-sm text-teal">0.38</div>
                </div>
                <div className={`grid grid-cols-12 gap-2 px-5 py-3 transition-all duration-300 ${animationStep >= 8 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                  <div className="col-span-1 text-secondary text-sm">2</div>
                  <div className="col-span-4 font-mono text-sm text-primary font-medium">AMAT</div>
                  <div className="col-span-4 text-right font-mono text-sm text-primary">-0.238</div>
                  <div className="col-span-3 text-right font-mono text-sm text-teal">0.42</div>
                </div>
                <div className={`grid grid-cols-12 gap-2 px-5 py-3 transition-all duration-300 ${animationStep >= 9 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                  <div className="col-span-1 text-secondary text-sm">3</div>
                  <div className="col-span-4 font-mono text-sm text-primary font-medium">MU</div>
                  <div className="col-span-4 text-right font-mono text-sm text-primary">-0.196</div>
                  <div className="col-span-3 text-right font-mono text-sm text-teal">0.54</div>
                </div>
                <div className={`grid grid-cols-12 gap-2 px-5 py-3 opacity-50 transition-all duration-300 ${animationStep >= 10 ? 'opacity-50 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                  <div className="col-span-1 text-secondary text-sm">4</div>
                  <div className="col-span-4 font-mono text-sm text-primary">AMD</div>
                  <div className="col-span-4 text-right font-mono text-sm text-primary">-0.170</div>
                  <div className="col-span-3 text-right font-mono text-sm text-muted">0.31</div>
                </div>
                <div className={`grid grid-cols-12 gap-2 px-5 py-3 opacity-30 transition-all duration-300 ${animationStep >= 11 ? 'opacity-30 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                  <div className="col-span-1 text-secondary text-sm">5</div>
                  <div className="col-span-4 font-mono text-sm text-primary">TSLA</div>
                  <div className="col-span-4 text-right font-mono text-sm text-primary">-0.132</div>
                  <div className="col-span-3 text-right font-mono text-sm text-muted">0.30</div>
                </div>
              </div>
              <div className={`px-5 py-3 bg-background/50 border-t border-border transition-all duration-300 ${animationStep >= 12 ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-xs text-muted">
                  + 15 more · Evidence available for each
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Proof-first philosophy */}
        <section className="py-16 border-t border-border">
          <h2 className="text-xl font-medium text-primary mb-2">
            No conclusions without receipts
          </h2>
          <p className="text-secondary text-sm mb-10">
            Every number is traceable.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-primary font-medium mb-2">Ranked, not rambled</p>
              <p className="text-secondary text-sm leading-relaxed">
                Every answer is a scored list. No essays. No filler.
              </p>
            </div>
            <div>
              <p className="text-primary font-medium mb-2">Evidence attached</p>
              <p className="text-secondary text-sm leading-relaxed">
                Betas, r², supply chain paths, SEC filings — always inspectable.
              </p>
            </div>
            <div>
              <p className="text-primary font-medium mb-2">Multiple models</p>
              <p className="text-secondary text-sm leading-relaxed">
                Defensive and aggressive views. You see both — every time.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © 2025 GanoAlpha Inc.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted">
            {/* Legal links - placeholder for now */}
          </div>
        </div>
      </footer>
    </div>
  );
}
