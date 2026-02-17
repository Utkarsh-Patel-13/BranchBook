---
sidebar_position: 3
---

# Chat API

REST endpoints for AI chat and conversation summarization. Both require authentication.

## Streaming Chat

**`POST /api/chat`**

Streams AI responses using Google Gemini. Supports multiple models, thinking mode, and optional web search.

### Request Body

```json
{
  "id": "<nodeId>",
  "message": {
    "role": "user",
    "parts": [{ "type": "text", "text": "Your message" }]
  },
  "options": {
    "model": "gemini-2.5-flash-lite-preview-09-2025",
    "thinking": false,
    "webSearch": false
  }
}
```

### Behavior

- Loads conversation history for the node
- Uses inherited context from the node tree when available
- Persists messages and per-message summaries
- Triggers resummarization when draft threshold is reached
- Returns a streaming response (Vercel AI SDK `UIMessage` format)

## Summarize

**`POST /api/chat/summarize`**

Generates study notes (Lexical-compatible HTML) from a node's chat history.

### Request Body

```json
{
  "nodeId": "<nodeId>"
}
```

### Response

```json
{
  "html": "<p>...structured notes...</p>"
}
```

### Behavior

- Requires node ownership
- Requires at least one message in the conversation
- Uses Gemini to turn the discussion into structured notes with headings and paragraphs
