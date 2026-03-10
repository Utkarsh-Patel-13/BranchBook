---
sidebar_position: 2
---

# Schema

| Model | Purpose |
|-------|---------|
| **Workspace** | Owned by User. Contains nodes. |
| **Node** | Tree structure. `parentId` for hierarchy. Title, summaries, context fields. |
| **Note** | 1:1 with Node. Lexical JSON in `content`. |
| **Message** | Chat messages per Node. Role, content, reasoning, sources, per-message summary. |

Context Engine columns on Node: `detailedSummary`, `highLevelSummary`, `summaryDraft`, `inheritedContext`.
