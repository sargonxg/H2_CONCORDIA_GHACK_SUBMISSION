# CONCORDIA

**Real-Time AI Mediation Platform**

> Built for the Google Gemini API Developer Competition by **Giulio Catanzariti** — [TACITUS](https://tacitus.me)

---

## What is CONCORDIA?

CONCORDIA is a real-time AI mediation platform that guides two parties through structured conflict resolution using live audio conversation. An AI mediator listens, speaks, and adapts in real time — extracting psychological indicators, mapping conflict primitives onto a live knowledge graph, identifying common ground, and proposing actionable resolution pathways as the conversation unfolds.

The system is grounded in the **TACITUS Conflict Grammar**: an eight-primitive ontology (Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives) that turns unstructured speech into a structured, navigable representation of a dispute. Combined with real-time psychological profiling drawn from Thomas-Kilmann conflict modes, Plutchik's emotion wheel, and the Mayer/Davis/Schoorman trust model, CONCORDIA gives mediators and parties a live, evolving picture of their conflict — and a clear path toward resolution.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Workspace  │  │  Landing     │  │  Library / Advisor   │   │
│  │  Page       │  │  Page        │  │  Pages               │   │
│  └──────┬──────┘  └──────────────┘  └──────────────────────┘   │
│         │ WebSocket (wss://)                                    │
└─────────┼───────────────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────────────┐
│         │        Node.js Custom Server (server.ts)              │
│  ┌──────▼──────────────────────┐                               │
│  │  WebSocket Handler          │                               │
│  │  (lib/ws-handler.ts)        │◄──── Room Manager             │
│  └──────┬──────────────────────┘      (lib/room-manager.ts)    │
│         │ Google GenAI Live API                                │
│  ┌──────▼──────────────────────┐                               │
│  │  Gemini 2.0 Flash Live      │                               │
│  │  (Multimodal, Real-time)    │                               │
│  └─────────────────────────────┘                               │
│                                                                 │
│  REST API Routes (/app/api/*)                                   │
│  ├── /api/health       ─ health check                          │
│  ├── /api/extract      ─ primitive extraction                   │
│  ├── /api/chat         ─ advisor chat                          │
│  ├── /api/analyze      ─ pathway analysis                      │
│  ├── /api/summarize    ─ session summary                       │
│  ├── /api/transcribe   ─ audio transcription                   │
│  ├── /api/tts          ─ text-to-speech                        │
│  ├── /api/research     ─ grounded research                     │
│  ├── /api/process-document ─ document ingestion               │
│  ├── /api/generate-agreement ─ settlement agreement           │
│  └── /api/live         ─ WebSocket proxy                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Mediation
- **Live AI Mediator** — Gemini 2.0 Flash Live streams real-time audio, speaks to both parties, and adapts its approach based on escalation level and Glasl stage
- **TACITUS Primitive Extraction** — Automatic identification of Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, and Narratives from speech
- **Live Knowledge Graph** — D3-powered force-directed graph showing relationships between all conflict primitives
- **Session Timeline** — Chronological event log with phase transitions, escalation markers, and key moments

### Analysis & Intelligence
- **Escalation Detection** — Real-time Gottman Four Horsemen analysis (blame, contempt, threat, stonewalling) with 0–100 scoring
- **Glasl Stage Mapping** — Seven-stage model automatically detected from conversation indicators
- **Cognitive Distortion Identification** — Detects 10+ distortions (Fundamental Attribution Error, Zero-Sum Thinking, Anchoring, Catastrophizing, etc.)
- **Pathway Analysis** — AI-generated resolution pathways with ZOPA analysis, BATNA assessment, and ranked options
- **31 Theoretical Frameworks** — Fisher & Ury, Lederach, Rosenberg NVC, Shapiro Identity-Based Conflict, solution-focused mediation, and 26 more

### Resolution Tools
- **Blind Bidding** — Smartsettle ONE–inspired RCB algorithm; parties submit confidential value ranges; system settles at overlap midpoint weighted by range width
- **Settlement Agreement Generation** — AI-drafted HTML settlement document with preamble, numbered terms, responsible parties, and deadlines
- **Case Summary** — Comprehensive structured summary with key claims, core interests, areas of agreement, and recommended next steps
- **Caucus Mode** — Private conversations with individual parties during live sessions

### Collaboration
- **Multi-Party Rooms** — Party A creates a room code (e.g., `H7KR2N`); Party B joins on any device via `?join=CODE` URL; both parties share a single Gemini Live session
- **Document Upload** — PDF/text document ingestion; AI extracts key facts and integrates into case context
- **Export Options** — Markdown, JSON, transcript, case summary, settlement agreement

### UX
- **Mobile-First** — Panel tab strip, floating mic FAB, fixed bottom status bar for small screens
- **Demo Mode** — Simulated dispute replay for presentations without live microphone
- **Accessibility** — `focus-visible` rings, `prefers-reduced-motion` support, aria-labels on all icon-only controls

---

## TACITUS Conflict Grammar

| Primitive | Symbol | Description | Example |
|-----------|--------|-------------|---------|
| **Actor** | A | Any party with agency in the dispute | "Alice (claimant)", "ABC Corp (respondent)" |
| **Claim** | C | A stated position or demand | "I am owed $15,000 in unpaid wages" |
| **Interest** | I | The underlying need behind a claim | "Financial stability", "recognition" |
| **Constraint** | K | A hard limit neither party can cross | "Cannot exceed budget cap", "legal deadline" |
| **Leverage** | L | A resource giving bargaining power | "Signed contract", "industry contacts" |
| **Commitment** | O | An agreed action or obligation | "Will deliver by Friday", "pay in instalments" |
| **Event** | E | A historical fact anchoring the dispute | "Contract signed 2023-01-15", "termination date" |
| **Narrative** | N | A story frame each party uses | "I was victimised", "they breached the agreement" |

---

## Theoretical Foundation

| Framework | Author(s) | Year | Applied To |
|-----------|-----------|------|------------|
| Principled Negotiation | Fisher, Ury, Patton | 1981 | Interest excavation, BATNA |
| Conflict Escalation Model | Glasl | 1982 | Stage detection |
| Peacebuilding | Lederach | 1997 | Relationship repair |
| Transformative Mediation | Bush & Folger | 1994 | Empowerment framing |
| Narrative Mediation | Winslade & Monk | 2000 | Story reframing |
| NVC | Rosenberg | 2003 | Emotion/need language |
| Identity-Based Conflict | Shapiro | 2016 | Identity threat detection |
| Solution-Focused | de Shazer / Berg | 1988 | Exception questions |
| Thomas-Kilmann | Thomas & Kilmann | 1974 | Conflict style profiling |
| Gottman Four Horsemen | Gottman | 1994 | Escalation detection |
| … and 21 more | — | — | Full list in `/app/(app)/library` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5.8 |
| UI | React 19, Tailwind CSS 4 |
| Animation | Framer Motion (via `motion`) |
| Charts | Recharts, D3 (force graph) |
| AI | Google Gemini 2.0 Flash Live API (`@google/genai`) |
| Server | Node.js custom server with `ws` WebSocket library |
| Testing | Vitest 4 |
| Icons | Lucide React |
| Fonts | Instrument Serif, DM Sans, JetBrains Mono (Google Fonts) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Google Gemini API key (Gemini 2.0 Flash Live access required)

### Installation

```bash
git clone https://github.com/sargonxg/H2_CONCORDIA_GHACK_SUBMISSION.git
cd H2_CONCORDIA_GHACK_SUBMISSION
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

> **Note:** The application uses `dotenv` and reads `GEMINI_API_KEY` directly. No other environment variables are required.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The custom Node.js server (`server.ts`) handles both Next.js HTTP requests and WebSocket connections on the same port.

### Production Build

```bash
npm run build
node server.js
```

---

## Testing

```bash
# Run all tests (single pass)
npm test

# Run with verbose output (CI mode)
npm run test:ci

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Suites

| File | Coverage |
|------|----------|
| `tests/lib/de-escalation.test.ts` | `detectEscalationLevel`, `getProtocolForEscalation`, `ESCALATION_TRIGGERS`, `COGNITIVE_DISTORTIONS`, `detectGlaslStage` |
| `tests/lib/mediation-library.test.ts` | `FRAMEWORKS` (≥31 entries, all IDs, glaslStages), `getRelevantFrameworks`, `buildFrameworkSnippet` |
| `tests/lib/blind-bidding.test.ts` | `calculateSettlement` RCB algorithm — overlap, gap, weighting, edge cases |
| `tests/lib/room-manager.test.ts` | `createRoom`, `getRoom`, `joinRoom`, `leaveRoom`, `broadcastToRoom`, utilities |
| `tests/lib/export-agreement.test.ts` | `generateAgreementHTML` — valid HTML, party names, terms, disclaimer |
| `tests/api/routes.test.ts` | `/api/health`, `/api/extract`, `/api/chat`, `/api/generate-agreement` |

---

## API Reference

All REST endpoints accept and return JSON unless noted.

### `GET /api/health`
Returns service status.
```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z", "service": "CONCORDIA" }
```

### `POST /api/extract`
Extracts TACITUS primitives from text.
```json
// Request
{ "text": "Alice claims Bob owes her $10,000 for the completed project." }

// Response
{ "result": "{\"actors\": [...], \"primitives\": [...]}" }
```

### `POST /api/chat`
Advisor chat with conversation history.
```json
// Request
{ "message": "What is BATNA?", "history": [], "caseContext": "..." }

// Response
{ "text": "BATNA stands for Best Alternative to a Negotiated Agreement..." }
```

### `POST /api/analyze`
Generates resolution pathways.
```json
// Request
{ "transcript": "...", "caseStructure": "...", "framework": "fisher-ury" }

// Response
{ "result": "{\"executiveSummary\": \"...\", \"pathways\": [...], \"zopaAnalysis\": {...}}" }
```

### `POST /api/summarize`
Summarises a completed session.
```json
// Request
{ "transcript": "...", "actors": [], "primitives": [], "commonGround": [], "tensionPoints": [] }
```

### `POST /api/transcribe`
Transcribes base64-encoded audio.
```json
// Request
{ "base64Audio": "...", "mimeType": "audio/webm" }
// Response
{ "text": "Transcribed speech here." }
```

### `POST /api/tts`
Generates speech audio from text.
```json
// Request
{ "text": "Let's take a moment to breathe.", "voiceName": "Kore" }
// Response
{ "audio": "<base64 PCM>" }
```

### `POST /api/generate-agreement`
Generates a structured settlement agreement.
```json
// Request
{
  "caseTitle": "Employment Dispute",
  "caseType": "Workplace",
  "partyAName": "Alice",
  "partyBName": "Bob",
  "agreements": [{ "topic": "Compensation", "terms": "Payment of $5,000 within 30 days" }],
  "transcript": "..."
}
```

### `POST /api/process-document`
Ingests a document file (multipart/form-data, field: `file`).
```json
// Response
{ "summary": "Document summary with key facts..." }
```

### `WebSocket /api/live`
Bidirectional audio stream. See `lib/ws-handler.ts` for full message protocol.

**Client → Server messages:**
| Type | Payload | Description |
|------|---------|-------------|
| `start` | `{ context, mediatorProfile, partyNames, createRoom?, caseId? }` | Start a new session |
| `join` | `{ roomCode, name }` | Join an existing room as Party B |
| `audio` | `{ audio: base64 }` | Stream PCM audio chunk |
| `toolResponse` | `{ functionResponses }` | Respond to Gemini tool call |
| `context` | `{ text }` | Inject context into live session |
| `ping` | — | Keep-alive |
| `close` | — | End session gracefully |

**Server → Client messages:**
| Type | Payload | Description |
|------|---------|-------------|
| `open` | — | Session ready |
| `roomCreated` | `{ roomCode }` | Room created (Party A) |
| `joined` | `{ partyId }` | Successfully joined room (Party B) |
| `message` | `{ data }` | Gemini response data |
| `reconnecting` | — | Session reconnecting |
| `reconnected` | — | Reconnection successful |
| `error` | `{ error }` | Error message |
| `close` | — | Session ended |

---

## Multi-Party Room Flow

```
Party A (Mediator device)          Party B (Second device)
         │                                  │
         │  Start Session                   │
         │  { createRoom: true }            │
         ▼                                  │
   [Room Created: H7KR2N]                   │
         │                                  │
         │  Share URL:                      │
         │  https://…/workspace?join=H7KR2N │
         │──────────────────────────────────►
         │                                  │
         │                         [Join Screen]
         │                                  │
         │                     { join: "H7KR2N", name: "Bob" }
         │◄─────────────────────────────────│
         │                                  │
   [partyJoined]                    [joined: partyId=B]
         │                                  │
         │◄═══════ Shared Gemini Live Session ════════►
         │                                  │
         │    Audio from either party ─────►│ Gemini processes
         │◄──────────────────── AI audio ──►│ broadcasts to both
```

Room codes use an unambiguous charset (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) to avoid 0/O and 1/I confusion when shared verbally. Rooms auto-expire 15 minutes after creation if Party B never joins.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes with tests: `npm run test:ci`
4. Type-check: `npx tsc --noEmit`
5. Commit with a descriptive message
6. Open a pull request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

CONCORDIA is a **communication facilitation tool**. It does not provide legal, psychological, or therapeutic advice. Outputs should be reviewed by qualified professionals before use in formal proceedings.

---

*CONCORDIA is powered by the [Google Gemini API](https://ai.google.dev/) and built with [Next.js](https://nextjs.org/).*
