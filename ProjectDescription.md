# BranchBook - Intelligent Learning & Knowledge Workspace

## Product Vision

BranchBook is a workspace where note-taking and AI conversation exist as equals, enabling non-linear exploration and organic knowledge structuring. It's designed for anyone who learns, explores, or develops ideas through conversation and documentation - from students mastering complex subjects to developers architecting systems to researchers connecting concepts.

The core insight: learning and ideation aren't linear. They branch, diverge, reconnect. Traditional note apps force hierarchy upfront. Chat interfaces lose structure entirely. BranchBook lets knowledge trees grow naturally as you explore, with AI and manual note-taking working side by side.

## The Problem Space

### What's Broken with Current Tools

**Traditional Note-Taking Apps (Notion, OneNote, Obsidian)**
- **Problem**: Require upfront organization decisions before you understand the topic
- **Problem**: Manual effort to structure and link information
- **Problem**: No conversational exploration - you're on your own to figure things out
- **Problem**: Static content that doesn't help you think through problems
- **Result**: People either over-organize (spending more time arranging than learning) or under-organize (dumping everything into searchable chaos)

**AI Chat Interfaces (ChatGPT, Claude, etc.)**
- **Problem**: Linear conversation threads that become tangled messes
- **Problem**: Context pollution - subtopic discussions contaminate main topic context
- **Problem**: Ephemeral - close the tab and your learning disappears
- **Problem**: No structure emerges - just an endless scroll of Q&A
- **Problem**: Impossible to navigate back to specific discussions
- **Result**: People learn in the moment but retain nothing, can't review, can't build on previous sessions

**The Core Tension**: Note apps lack conversational exploration. Chat apps lack structure and permanence. Users are forced to choose between fluid thinking and organized knowledge.

**The Manual Workaround**: Copy-paste from chat to notes. This is tedious, breaks flow, and most people just don't do it. The tools don't talk to each other.

### How BranchBook Solves This

**Unified Workspace**
- Notes and AI conversation live side-by-side in every node
- No copying between tools - they're the same tool
- Write directly or discuss with AI, fluidly switching between both
- Structure emerges from exploration rather than requiring upfront planning

**Natural Branching**
- When discussion diverts to a subtopic, create a child node
- Each branch maintains only relevant context
- No more scrolling through tangled conversation threads
- Visual tree shows how your understanding developed

**Context Isolation**
- Each node is a focused conversation about one thing
- Child nodes inherit just enough parent context to make sense
- No pollution from unrelated discussions
- AI responses stay relevant without dragging in everything

**Automatic Knowledge Capture**
- Conversations become notes without manual effort
- AI responses can be instantly formatted as note content
- Entire node discussions can be summarized into structured notes
- Learning becomes documentation automatically

**Persistent & Navigable**
- Everything is saved and structured
- Tree view provides hierarchical navigation
- Search finds specific discussions instantly
- Return weeks later and pick up where you left off

## Core Concept

**Workspace**: A container for multiple independent explorations (e.g., "Operating Systems," "Cool Ideas," "Q1 Product Planning")

**Root Nodes**: Independent topic starting points within a workspace. Each root spawns its own exploration tree with no cross-contamination of context.

**Child Nodes**: Subtopic branches that inherit relevant parent context. Each node is both a conversation space and a note document.

**The Dual Interface**: Every node contains a note editor and AI chat panel working in tandem - write notes directly, discuss with AI, or fluidly move between both.

## Who It's For

**Primary**: Anyone who explores ideas through conversation and needs to capture structured knowledge

- Students learning complex subjects
- Self-learners exploring new domains  
- Developers planning and documenting systems
- Researchers connecting concepts
- Writers developing ideas
- Product managers scoping features
- Anyone who thinks by talking things through

**Core user need**: "I want to explore topics deeply with AI without losing track of what I've learned, and I want my notes to build themselves as I go."

## Key Value Propositions

1. **Non-linear exploration without context pollution** - Branch into subtopics without dragging irrelevant conversation history
2. **Automatic knowledge capture** - Notes emerge from conversations; conversations enhance notes
3. **Flexible organization** - Structure emerges from exploration rather than requiring upfront planning
4. **Dual-mode workflow** - Equally useful for note-takers who want AI assistance and conversationalists who need structure
5. **Persistent learning** - Nothing disappears; everything is navigable and reviewable

## MVP Feature Scope

### Workspace & Structure
- Create workspaces (name + optional description)
- Place multiple independent root nodes per workspace
- Create child nodes (branches) from any existing node
- Tree/outline view toggle for hierarchical navigation
- Context inheritance (children receive relevant parent context, not full history)

### Dual Interface (The Core Innovation)

**Note Editor:**
- Direct text editing for manual note-taking
- Basic formatting (headers, bold, italic, lists, code blocks)
- Insert AI-generated content from chat
- Works independently without requiring chat usage
- Select text to "discuss in new node" (creates branch)

**Chat Panel:**
- Side-by-side AI conversation interface
- Context-aware based on node position and note content
- "Add to notes" button on AI responses
- AI can reference and expand on existing note content
- Clean, focused conversation per node

### Intelligent Branching

**Manual:**
- "Create child node" button always available
- Option to name the new branch
- Choose how many recent messages to carry over

**AI-Assisted:**
- AI suggests branching when subtopic emerges (after 2-3 message exchanges)
- "Move to new node" option for recent discussion
- AI generates suggested name for new branch

### Navigation & Organization
- Navigate between nodes via tree/outline view
- Breadcrumb trail (Root > Child > Grandchild)
- Search across all nodes in workspace
- Collapse/expand node trees in outline view

### Content Transformation
- "Convert to note" on individual AI messages (formats response as clean note content)
- "Summarize node" converts entire conversation into structured notes
- Bidirectional flow: notes inform chat context, chat populates notes

## Explicitly Out of Scope for MVP

**Will be added post-MVP:**
- Cross-node linking between separate trees
- Collaboration/multiplayer features
- Export formats (PDF, presentations, diagrams)
- Quiz generation and derived content
- Custom AI instructions per node
- Version history and rollback
- Node merging or collapsing branches back to parent
- Multiple parent nodes (graph structure vs tree)
- Template system for common note structures

## Design Principles

1. **Equal Partners**: Notes and AI chat are equally important - neither feels tacked on
2. **Low Friction**: Branching and organization emerge naturally from usage, not manual setup
3. **Context Clarity**: Each node knows exactly what context it needs, no more
4. **Flexible Mental Models**: Works for different thinking styles - structured planners and exploratory learners alike
5. **Expansion-Ready**: Architecture supports future features (collaboration, cross-linking, exports) without redesign

## Success Metrics (Post-Launch)

- Average nodes per workspace (indicates depth of exploration)
- Percentage of nodes with both notes and chat content (validates dual interface)
- Branch creation rate (manual vs AI-suggested acceptance)
- Return rate to existing nodes (indicates review/reference value)
- User retention after first week (sticky enough to become habit)

## Technical Considerations for MVP

- Context window management per node
- Real-time sync between note editor and chat context
- Search indexing across conversation and note content
- Smart context summarization for child node inheritance
- Handling deep trees (performance with 50+ nodes)

---

## Product Positioning

**Not**: "AI note-taking app" or "Chat interface with notes"  
**Is**: "Workspace where ideas branch naturally, combining the fluidity of conversation with the permanence of documentation"

**Differentiators:**
- Tree structure that builds itself through exploration
- True parity between notes and AI (not one supporting the other)
- Context isolation prevents the "tangled conversation" problem
- Visual knowledge mapping shows learning paths
- Flexible enough for any domain (education, development, research, ideation)

**Tagline Options:**
- "Think in branches, capture in structure"
- "Where conversations become knowledge"
- "Explore freely, organize naturally"