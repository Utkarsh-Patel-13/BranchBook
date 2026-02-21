---
Quality Signal States

There are two separate quality fields:
1. ContextArtifact.qualitySignal — quality of a node's own summarization artifact
2. Node.inheritedContextQuality — quality of the assembled context a child node received from its ancestors

---
How Each State is Set

PARTIAL

Set by: summarize-message.job.ts (step 6)
- When the first assistant message is summarized for a node and no ContextArtifact exists yet
- Creates a new artifact with only a per-message summary — no full AI processing

FRESH

Set by: run-full-summarization.job.ts (step 4)
- When the full Gemini summarization cycle completes and upsertArtifact(..., qualitySignal: "FRESH") is called
- This is triggered once summaryDraftCount >= SUMMARY_THRESHOLD

STALE

Set by: artifact.service.ts — lazily on read inside getArtifact()
- If a FRESH artifact's lastProcessedAt is older than CONTEXT_STALENESS_HOURS (default: 24h), it is automatically downgraded to STALE before being returned
- Can also be bulk-applied via markStaleArtifacts() (no scheduled caller exists yet)
- STALE artifacts still contribute their content — they just signal the data is outdated

MINIMAL

Set by: assemble-inherited-context.job.ts (the catch block)
- When the entire context assembly fails → sets the child node's inheritedContextQuality to MINIMAL using the raw-message fallback
- Also used internally in loadAncestorTextAndQuality when an ancestor has no artifact at all (only a summaryDraft or nothing) — rank 3 which propagates as the
worst quality

---
Full Job Chain

User sends message
      │
      ▼
summarize-message job
  ├─ Generate per-message summary (Gemini)
  ├─ Persist to Message.summary
  ├─ Append to Node.summaryDraft
  ├─ If no artifact → create PARTIAL artifact
  └─ If draftCount >= THRESHOLD → enqueue run-full-summarization
                                          │
                                          ▼
                              run-full-summarization job
                                ├─ Gemini structured output
                                ├─ Upsert artifact → FRESH
                                ├─ Reset summaryDraft
                                └─ Enqueue upgrade-child-contexts
                                                │
                                                ▼
                                  upgrade-child-contexts job
                                    └─ For each direct child that has
                                        inheritedContext → enqueue
                                        assemble-inherited-context
                                                  │
                                                  ▼
                                    assemble-inherited-context job
                                      ├─ Walk ancestry (root → parent)
                                      ├─ For each ancestor: getArtifact()
                                      │     └─ FRESH may downgrade to STALE here
                                      ├─ Worst quality across all ancestors
                                      │   = child's inheritedContextQuality
                                      └─ On failure → MINIMAL fallback

---
Quality Rank (used for "worst wins" logic)

FRESH   = 0  (best)
PARTIAL = 1
STALE   = 2
MINIMAL = 3  (worst)

When assembling inherited context, the worst ancestor quality propagates to the child's inheritedContextQuality. So if even one ancestor is MINIMAL, the whole
assembled context is marked MINIMAL.