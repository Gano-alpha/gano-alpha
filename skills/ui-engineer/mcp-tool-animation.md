# MCP Tool Animation - Implementation Guide

## Problem

During loading, we want to show which MCP tools are being used (like the landing page demo).

## Core Principle

**NO SIMULATION** - The frontend must never guess which tools are running. All tool progress comes from the server via SSE streaming.

---

## Implementation (Completed)

### 1. Backend - Streaming Handler

**File:** `gano-reasoner/api/chat_handler.py`

```python
def handle_query_streaming(user_query: str):
    """
    Yields SSE events as tools are executed:
    - {"event": "tool_start", "tool": "...", "args": {...}}
    - {"event": "tool_complete", "tool": "...", "timing_ms": 123}
    - {"event": "complete", "blocks": [...], "intent": "..."}
    - {"event": "error", "message": "..."}
    """
    # GPT-4 selects tools
    response = client.chat.completions.create(...)

    for tool_info in tools_to_execute:
        # Emit tool_start
        yield {"event": "tool_start", "id": tool_id, "tool": func_name, "args": func_args}

        # Execute tool
        result, timing_ms = execute_tool(func_name, func_args)

        # Emit tool_complete
        yield {"event": "tool_complete", "id": tool_id, "tool": func_name, "timing_ms": timing_ms}

    # Emit final response
    yield {"event": "complete", "blocks": validated_blocks, "intent": intent, ...}
```

### 2. Backend - SSE Endpoint

**File:** `gano-reasoner/api/main.py`

```python
@app.get("/v1/chat/query/stream")
async def chat_query_stream(q: str = Query(...)):
    """
    GET /v1/chat/query/stream?q=What%20stocks%20should%20I%20buy

    Returns SSE stream with tool progress events.
    """
    async def event_generator():
        for event in handle_query_streaming(q):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
```

### 3. Frontend - Streaming API

**File:** `gano-alpha/src/lib/api.ts`

```typescript
export interface StreamEvent {
  event: 'tool_start' | 'tool_complete' | 'complete' | 'error';
  id?: string;
  tool?: string;
  args?: Record<string, unknown>;
  timing_ms?: number;
  blocks?: RenderBlock[];
  // ...
}

export async function sendChatQueryStreaming(
  getAccessToken: () => Promise<string | null>,
  query: string,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const reader = response.body?.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Parse SSE events and call onEvent callback
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        onEvent(JSON.parse(line.slice(6)));
      }
    }
  }
}
```

### 4. Frontend - Chat Page Integration

**File:** `gano-alpha/src/app/(dashboard)/chat/page.tsx`

```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  // Create loading message with empty toolSteps
  setMessages(prev => [...prev, {
    id: assistantId,
    isLoading: true,
    toolSteps: [],  // Will be populated by SSE events
  }]);

  // Handle SSE events
  const handleEvent = (event: StreamEvent) => {
    if (event.event === "tool_start") {
      // Add new step as "running"
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, toolSteps: [...m.toolSteps, { id: event.id, tool: event.tool, status: "running" }] }
          : m
      ));
    } else if (event.event === "tool_complete") {
      // Update step to "complete" with timing
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, toolSteps: m.toolSteps.map(s => s.id === event.id ? { ...s, status: "complete", timing_ms: event.timing_ms } : s) }
          : m
      ));
    } else if (event.event === "complete") {
      // Final response with blocks
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, isLoading: false, blocks: event.blocks }
          : m
      ));
    }
  };

  await sendChatQueryStreaming(getAccessToken, query, handleEvent);
});
```

### 5. Frontend - Animation Component

**File:** `gano-alpha/src/components/chat/MCPToolAnimation.tsx`

```typescript
export function MCPToolAnimation({ steps, isComplete }: MCPToolAnimationProps) {
  // No steps yet = simple loader
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-accent" />
        <span>Processing query...</span>
      </div>
    );
  }

  // With real steps from server = show progress
  return (
    <div>
      {steps.map(step => (
        <div key={step.id}>
          {step.status === "running" && <Loader2 className="animate-spin" />}
          {step.status === "complete" && <Check className="text-teal" />}
          <span>{getToolDisplayName(step.tool)}</span>
          {step.timing_ms && <span>{step.timing_ms}ms</span>}
        </div>
      ))}
    </div>
  );
}
```

---

## Data Flow

```
User submits query
       |
       v
Frontend: GET /v1/chat/query/stream?q=...
       |
       v
Backend: GPT-4 selects tools
       |
       +---> yield {event: "tool_start", tool: "get_top_signals"}
       |           |
       |           +---> Frontend: Add step with status="running"
       |
       +---> yield {event: "tool_complete", tool: "get_top_signals", timing_ms: 234}
       |           |
       |           +---> Frontend: Update step with status="complete"
       |
       +---> yield {event: "complete", blocks: [...]}
                   |
                   +---> Frontend: Set isLoading=false, render blocks
```

---

## API Events Schema

```typescript
// Tool starting
{ "event": "tool_start", "id": "tool_abc123", "tool": "analyze_ticker", "args": { "ticker": "NVDA" } }

// Tool completed
{ "event": "tool_complete", "id": "tool_abc123", "tool": "analyze_ticker", "timing_ms": 234 }

// All done
{ "event": "complete", "blocks": [...], "intent": "Analyzing ticker", "total_ms": 1250 }

// Error
{ "event": "error", "message": "No tools selected" }
```

---

## Files Modified

| File | Changes |
|------|---------|
| `gano-reasoner/api/chat_handler.py` | Added `handle_query_streaming()` generator |
| `gano-reasoner/api/main.py` | Added `/v1/chat/query/stream` SSE endpoint |
| `gano-alpha/src/lib/api.ts` | Added `sendChatQueryStreaming()` and `StreamEvent` type |
| `gano-alpha/src/app/(dashboard)/chat/page.tsx` | Updated `handleSubmit` to use streaming |
| `gano-alpha/src/components/chat/MCPToolAnimation.tsx` | Simplified to render real steps only |
