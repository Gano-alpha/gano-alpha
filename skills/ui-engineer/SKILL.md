---
name: ui-engineer
description: UI/UX Engineer skill for GANO frontend. Use for design system, React/Next.js components, Tailwind CSS styling, and frontend architecture decisions.
---

# GANO UI Engineer Skill

> Context preservation document for Claude Code sessions. This file contains all critical context for UI engineering work on the GANO platform.

## Role Overview

UI/UX Engineer responsible for:
- Next.js frontend (gano-alpha)
- Design system with Jony Ive principles
- Tailwind CSS styling and design tokens
- React component architecture
- Mobile-first responsive design

## Related Skill Files

This skill is split into focused documents:

- [architecture.md](architecture.md) - Core principle: No business logic on UI
- [api-contract.md](api-contract.md) - Server-client contract, block types
- [mcp-tool-animation.md](mcp-tool-animation.md) - MCP tool progress animations with SSE
- [multi-turn-conversations.md](multi-turn-conversations.md) - Conversation state management

---

## Design Principles (Jony Ive Inspired)

### Core Values
- **Minimal** - Remove unnecessary elements
- **Precise** - Exact spacing, aligned to 4px grid
- **Generous** - Whitespace is a feature, not waste
- **Calm** - Muted colors, subtle animations

### Color Palette
```css
/* Primary - Sophisticated blues */
--primary: hsl(220, 15%, 25%);       /* Dark slate */
--primary-light: hsl(220, 10%, 45%); /* Medium slate */

/* Accent - Subtle green for signals */
--accent: hsl(158, 45%, 40%);        /* Sage green */

/* Background - Clean, calm */
--bg-primary: hsl(220, 15%, 97%);    /* Near white */
--bg-card: hsl(0, 0%, 100%);         /* Pure white */

/* Text - High contrast, readable */
--text-primary: hsl(220, 15%, 15%);  /* Almost black */
--text-secondary: hsl(220, 10%, 45%);/* Gray */
```

### Spacing Scale (4px base)
```
4, 8, 12, 16, 24, 32, 48, 64, 96, 128
```

---

## Key Directories

```
gano-alpha/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (dashboard)/chat/   # Main chat interface
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # Design system (shadcn/ui)
│   │   ├── blocks/             # Render block components
│   │   └── chat/               # Chat-specific components
│   └── styles/
│       └── globals.css         # CSS variables, base styles
├── tailwind.config.ts          # Design tokens
└── skills/ui-engineer/         # This skill folder
```

---

## Component Patterns

### Block Rendering
Server sends typed blocks, UI renders without interpretation:
```typescript
// blocks/RenderBlock.tsx
export function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'narrative': return <NarrativeBlock {...block} />;
    case 'ranked_list': return <RankedListBlock {...block} />;
    case 'split_compare': return <SplitCompareBlock {...block} />;
    // ...
  }
}
```

### SSE Streaming for MCP Tools
Real-time progress updates via Server-Sent Events:
```typescript
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'tool_start') {
    setActiveTools(prev => [...prev, data.tool]);
  }
};
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/ui-improvement

# Never push directly to main
git push -u origin feature/ui-improvement

# Create PR for review
```

---

## Learnings

- [Document learnings from each session here]

---

## Decisions

- [Document design decisions here]

---

## Context

- [Current project state and notes]

---

## Implemented Features (Jan 12, 2026)

### New Pages

| Route | Task | Description |
|-------|------|-------------|
| `/track-record` | B1 | Public signal history with performance metrics |
| `/methodology` | B4 | Three-layer architecture documentation |
| `/fragility` | B34 | Fragility dashboard with hero card, components, chart |
| `/ops/dashboard` | B7 | Internal ops dashboard (auth-gated) |

### New Components

| Component | Task | Location |
|-----------|------|----------|
| `FeedbackButton` | B24 | `components/feedback/FeedbackButton.tsx` |
| `FragilityIndexCard` | B15 | `components/fragility/FragilityIndexCard.tsx` |
| `ConfidenceBands` | B14 | `components/fragility/ConfidenceBands.tsx` |
| `FragilityContext` | B35 | `components/fragility/FragilityContext.tsx` |

### Fragility Integration (B35)

Implemented injection rule engine and UI components:

```typescript
// Usage in any block
import { useFragility, FragilitySidebar, FragilityFootnote } from '@/components/fragility';

function MyBlock() {
  const { fragility, evaluateInjection } = useFragility();
  const decision = evaluateInjection('signal_lookup');

  return (
    <div>
      {/* Main content */}
      {decision.should_inject && decision.placement === 'footnote' && (
        <FragilityFootnote fragility={fragility} />
      )}
    </div>
  );
}
```

### Injection Rules

| Rule | Condition | Action |
|------|-----------|--------|
| ALWAYS_ELEVATED | regime >= ELEVATED | Show warning header |
| ALWAYS_DELTA | delta_24h >= 10 | Show footnote with delta |
| TRANSPARENCY | query = transparency | Show full context |
| DEEP_DIVE | query = deep_dive | Show inline context |
| DEFAULT | regime = CALM/NORMAL | No injection |

### Regime Colors

| Regime | Background | Text |
|--------|------------|------|
| CALM | `bg-green-100` | `text-green-700` |
| NORMAL | `bg-blue-100` | `text-blue-700` |
| ELEVATED | `bg-amber-100` | `text-amber-700` |
| STRESSED | `bg-red-100` | `text-red-700` |
| CRISIS | `bg-red-200` | `text-red-900` |

---

*Last Updated: January 12, 2026*
