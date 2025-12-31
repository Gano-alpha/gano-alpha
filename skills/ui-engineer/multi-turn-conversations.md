# Multi-Turn Conversation Support

## Problem

Currently, each query is independent - the backend doesn't know about previous messages in the conversation. Users can't ask follow-up questions like "tell me more about that" or "what about AAPL instead?"

## Solution: Two-Part Approach

### Part 1: Frontend Sends History (Immediate Context)

Send the last N messages with each query so GPT-4 has conversation context for tool selection.

**Frontend changes:**
```typescript
// Build history from current thread messages
const history = messages
  .slice(-10)  // Last 10 messages max
  .map(m => ({
    role: m.role,
    content: m.role === "user"
      ? m.content
      : summarizeAssistantMessage(m)  // Summarize structured responses
  }));

// Send with query
await sendChatQueryStreaming(getAccessToken, query, history, onEvent);
```

**Backend changes:**
```python
class ChatQueryRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = []

def handle_query_streaming(user_query: str, history: List[Dict] = None):
    messages = [
        {"role": "system", "content": selection_prompt},
        *(history or []),  # Previous conversation turns
        {"role": "user", "content": user_query}
    ]
```

### Part 2: Server-Side Session Storage (Persistence)

Store conversation state in database for persistence across page refreshes.

**Database schema:**
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,  -- 'user' or 'assistant'
    content TEXT,
    blocks JSONB,  -- Stored render blocks
    tool_trace JSONB,  -- Tools that were called
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API endpoints:**
```
GET  /v1/conversations              - List user's conversations
POST /v1/conversations              - Create new conversation
GET  /v1/conversations/:id          - Get conversation with messages
POST /v1/conversations/:id/messages - Add message (with streaming)
DELETE /v1/conversations/:id        - Delete conversation
```

---

## Implementation Order

### Phase 1: History in Request (Quick Win)
1. Update `ChatQueryRequest` to accept `history` field
2. Update `handle_query_streaming` to include history in GPT messages
3. Update frontend `sendChatQueryStreaming` to send history
4. Update chat page to build history from current messages

### Phase 2: Server Persistence (Full Solution)
1. Create database tables for conversations
2. Add conversation CRUD endpoints
3. Update frontend to sync with server
4. Add conversation list to sidebar

---

## History Summarization

Assistant messages contain structured blocks, not plain text. We need to summarize them for the history:

```typescript
function summarizeAssistantMessage(msg: Message): string {
  if (msg.blocks && msg.blocks.length > 0) {
    // Extract key info from blocks
    const parts: string[] = [];

    for (const block of msg.blocks) {
      if (block.type === "narrative") {
        parts.push(block.text);
      } else if (block.type === "ranked_list") {
        const tickers = block.rows?.slice(0, 5).map(r => r.ticker).join(", ");
        parts.push(`Showed ranked list: ${tickers}...`);
      } else if (block.type === "split_compare") {
        parts.push(`Compared ${block.leftTitle} vs ${block.rightTitle}`);
      }
    }

    return parts.join(" ");
  }

  return msg.content || "[No content]";
}
```

---

## Token Management

GPT-4 has context limits. We need to manage history size:

1. **Limit messages**: Keep last 10 messages max
2. **Summarize long responses**: Truncate assistant summaries to ~200 chars
3. **Drop old context**: If approaching token limit, drop oldest messages

```python
def trim_history(history: List[Dict], max_tokens: int = 2000) -> List[Dict]:
    """Trim history to fit within token budget."""
    total = 0
    trimmed = []

    for msg in reversed(history):
        msg_tokens = len(msg["content"]) // 4  # Rough estimate
        if total + msg_tokens > max_tokens:
            break
        trimmed.insert(0, msg)
        total += msg_tokens

    return trimmed
```

---

## Files to Modify

### Phase 1 (History in Request)

| File | Changes |
|------|---------|
| `gano-reasoner/api/main.py` | Add `history` to `ChatQueryRequest`, update streaming endpoint |
| `gano-reasoner/api/chat_handler.py` | Update `handle_query_streaming` to accept/use history |
| `gano-alpha/src/lib/api.ts` | Update `sendChatQueryStreaming` to accept history param |
| `gano-alpha/src/app/(dashboard)/chat/page.tsx` | Build history from messages, pass to API |

### Phase 2 (Server Persistence)

| File | Changes |
|------|---------|
| `gano-reasoner/schema/` | New SQL migration for conversations table |
| `gano-reasoner/api/conversations_router.py` | New CRUD endpoints |
| `gano-reasoner/api/main.py` | Include conversations router |
| `gano-alpha/src/lib/api.ts` | Add conversation API functions |
| `gano-alpha/src/app/(dashboard)/chat/page.tsx` | Sync threads with server |

---

## Example Conversation Flow

```
User: "What stocks benefit from rate cuts?"
Assistant: [Shows ranked list of rate-sensitive stocks]

User: "Tell me more about the top one"
       ^ GPT now knows "top one" = first stock from previous response

User: "What about its supply chain risk?"
       ^ GPT knows which ticker user is asking about

User: "Compare it to AAPL"
       ^ GPT can compare previous ticker to AAPL
```

---

## Implementation Status

- [x] Phase 1: Add history to request ✅ COMPLETED
  - [x] Backend: Update `/v1/chat/query/stream` to accept `history` query param
  - [x] Backend: Update `handle_query_streaming` to include history in GPT messages
  - [x] Backend: Add `_trim_history()` helper for token management
  - [x] Frontend: Update `sendChatQueryStreaming()` to accept history param
  - [x] Frontend: Add `summarizeAssistantMessage()` helper
  - [x] Frontend: Add `buildConversationHistory()` helper
  - [x] Frontend: Pass history from chat page to API
- [ ] Phase 2: Server persistence
  - [ ] Database: Create conversations tables
  - [ ] Backend: Add conversations router
  - [ ] Frontend: Sync with server
  - [ ] Frontend: Load conversations on mount
