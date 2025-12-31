# API Contract - Frontend ↔ Backend

## Chat Query (Current - Non-Streaming)

### Request
```typescript
POST /v1/chat/query
Content-Type: application/json
Authorization: Bearer <token>

{ "query": "What should I buy today?" }
```

### Response
```typescript
{
  "query": "What should I buy today?",
  "intent": "Finding top signals",
  "tools_selected": [
    { "tool": "get_top_signals", "arguments": { "direction": "long", "top_k": 10 } }
  ],
  "blocks": [
    {
      "type": "narrative",
      "id": "blk_abc123",
      "title": "Top Long Signals",
      "text": "Found 10 high-conviction long signals...",
      "tone": "analyst",
      "meta": { "confidence": 0.85 }
    },
    {
      "type": "ranked_list",
      "id": "blk_def456",
      "title": "Ranked Signals",
      "columns": [...],
      "rows": [...],
      "meta": {}
    }
  ],
  "_debug": {
    "tool_trace": [
      { "tool": "get_top_signals", "arguments": {...}, "timing_ms": 234 }
    ],
    "message_id": "msg_xyz789",
    "created_at": "2024-01-15T10:30:00Z",
    "total_ms": 1250
  }
}
```

---

## Chat Query Stream (TODO - SSE)

### Request
```typescript
GET /v1/chat/query/stream?q=What%20should%20I%20buy%20today
Authorization: Bearer <token>
Accept: text/event-stream
```

### Response (SSE Events)
```
event: tool_start
data: {"tool": "get_top_signals", "args": {"direction": "long"}}

event: tool_complete
data: {"tool": "get_top_signals", "timing_ms": 234}

event: complete
data: {"blocks": [...], "intent": "Finding top signals"}
```

---

## Context Endpoints

### Macro Context
```typescript
GET /v1/context/macro

Response:
{
  "vix": 18.5,
  "vix_change": -0.3,
  "vix_regime": "Normal",
  "rate_10y": 4.25,
  "rate_change": 0.02,
  "credit_regime": "Tight",
  "spy_change": 0.45
}
```

### Context Signals
```typescript
GET /v1/context/signals?top_k=10

Response:
{
  "signals": [
    { "ticker": "NVDA", "model": "Sniper", "direction": "long", "score": 0.89 }
  ]
}
```

### Context Warnings
```typescript
GET /v1/context/warnings?top_k=5

Response:
{
  "warnings": [
    { "ticker": "TSLA", "type": "Short Interest Spike", "severity": "high" }
  ]
}
```

---

## Ticker Analysis

### Direct Tool Execution
```typescript
POST /v1/chat/execute
{
  "tool": "analyze_ticker",
  "arguments": { "ticker": "NVDA" }
}

Response:
{
  "tool": "analyze_ticker",
  "success": true,
  "result": {
    "ticker": "NVDA",
    "company_name": "NVIDIA Corporation",
    "sector": "Technology",
    "supply_chain": {...},
    "factor_sensitivities": {...},
    "model_signals": {...}
  }
}
```

---

## Error Responses

```typescript
// 401 Unauthorized
{ "error": "Not authenticated" }

// 400 Bad Request
{ "error": "Invalid query", "detail": "Query cannot be empty" }

// 500 Server Error
{ "error": "Internal server error", "message": "..." }
```
