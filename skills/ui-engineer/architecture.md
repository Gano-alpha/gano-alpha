# GANO Alpha - UI Architecture Principles

## Core Principle: No Business Logic on UI

The frontend is a **dumb renderer**. All business logic lives on the server (gano-reasoner).

### What This Means

**Server decides**:
- Which tools to call
- How to interpret user queries
- What data to show
- How to format responses
- Confidence scores, rankings, filtering

**Frontend only**:
- Renders what server sends
- Handles user interactions (clicks, input)
- Manages UI state (loading, modals, animations)
- Routes data to correct components

**No guessing/simulating**:
- Don't simulate MCP tool calls based on query text
- Don't infer what tools "might" be running
- Show real data from server responses only

---

## Render Blocks Contract

Server emits 6 block types. Frontend renders them without interpretation.

| Block Type | Purpose | Server Decides |
|------------|---------|----------------|
| `narrative` | Text explanation | Content, tone, confidence |
| `ranked_list` | Ordered items | Ranking, metrics, values |
| `split_compare` | Two columns | Left/right items, titles |
| `evidence` | Proof/data | Evidence items, charts |
| `deep_dive` | Ticker detail | All sections, signals |
| `model_trust` | Accuracy stats | Metrics, calibration |

---

## When UI Logic IS Acceptable

1. **Animation/transitions** - Purely visual
2. **Responsive breakpoints** - Layout adaptation
3. **Local UI state** - Modals, dropdowns, hover states
4. **Input validation** - Basic form validation before submit
5. **Derived display values** - Formatting numbers for display (but server should send pre-formatted when possible)

### Gray Areas - Discuss First

- Filtering/sorting client-side (prefer server-side)
- Caching/optimistic updates
- Complex conditional rendering based on data shape

---

## Questions to Ask Before Implementing

1. "Does the server already provide this data?"
2. "Am I making assumptions about what the server will return?"
3. "Could this logic live on the server instead?"
4. "Am I transforming server data or just displaying it?"
