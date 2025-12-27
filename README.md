# Gano Alpha

AI-powered supply chain intelligence for smarter investment decisions.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Custom + Radix UI primitives
- **Charts**: Recharts
- **Graph**: React Flow
- **State**: Zustand + React Query

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Dashboard pages
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # Base UI components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/                   # Utilities
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
└── styles/                # Global styles
```

## UI Storyboard (proposed)

This is the plan for the redesigned dashboard, aligned with the new macro/geo/regulatory/contagion data layers.

### 1) Brief (Home)
- Hero risk chips: Rates/Oil/Region with “Run scenario”.
- Sniper Spotlight: 1–3 top signals (confidence, PD, hub %, macro/region badges).
- Quick Scenario: Paste headline → “Parse & Run” to Scenarios.
- Alerts glance: Unread/high-priority counts linking to Alerts.

### 2) Signals (formerly Market)
- Grid/List toggle: Cards for “why-stripes”; table for dense scan.
- Card anatomy: ticker, direction, confidence; badges (Macro/Region/Regulation); mini sparkline; mini-network peek (upstream/downstream counts).
- Filters: Tier (SNIPER/SCOUT), direction, sector, macro domain, region, regulation. Sort by confidence/centrality/solvency.
- Details drawer: “Why” panel with drivers and a mini-graph.

### 3) Scenarios
- Parsed shocks deck: Pills/sliders for Macro (^TNX, CL), Region (CN/TW), Regulation (Export), Themes; add from free-text parser.
- Results: Impact table with stacked contribution bars (Macro/Region/Reg/Infra).
- Actions: Save scenario, re-run, apply to Watchlist/Portfolio.

### 4) Alerts
- Buckets: Unread, Whispers (filings/news), Signals (tier changes), Exposure (macro/geo shocks).
- Card anatomy: Severity chip, source ticker, affected list, extracted snippet, time, filing link.
- Bulk actions: Mark read/delete, filter by severity/type.

### 5) Watchlist
- Posture summary: Chips for Geo Risk, Macro Sensitivity.
- Table: Ticker, direction, confidence, posture badges (Macro/Region/Reg), 7d sparkline.
- Actions: Run shock on watchlist, promote to simulation.

### 6) (Optional) Lab / Explorer
- Graph explorer: Fetch mini-graph by ticker.
- Data QA: Surface flagged edges (sector rules, anonymous customers) for review.

### Visual direction
- Calm palette with stronger CTA contrast (indigo/charcoal), restrained accent chips.
- “Why” is always visible: badges, mini-graph, and sparklines explain each signal.
