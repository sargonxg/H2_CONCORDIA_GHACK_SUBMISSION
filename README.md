# CONCORDIA

**Real-Time AI Mediation Platform**

> Built for the Google Cloud Hackathon by **Giulio Catanzariti** — [TACITUS](https://tacitus.me)

---

## What is CONCORDIA?

CONCORDIA is a real-time AI mediation platform that guides two parties through structured conflict resolution using live audio conversation. An AI mediator listens, speaks, and adapts in real time — extracting psychological indicators, mapping conflict primitives onto a live knowledge graph, identifying common ground, and proposing actionable resolution pathways as the conversation unfolds.

The system is grounded in the **TACITUS Conflict Grammar**: an eight-primitive ontology (Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives) that turns unstructured speech into a structured, navigable representation of a dispute. Combined with real-time psychological profiling drawn from Thomas-Kilmann conflict modes, Plutchik's emotion wheel, and the Mayer/Davis/Schoorman trust model, CONCORDIA gives mediators and parties a live, evolving picture of their conflict — and a clear path toward resolution.

---

## Improvements Summary (v2)

All improvements were implemented across three development prompts:

| # | Area | Improvement | Files |
|---|------|-------------|-------|
| 1.1 | Transcript | Buffered word-by-word fragments, flushed on `turnComplete`/`toolCall` with `[MM:SS]` timestamps | `workspace/page.tsx` |
| 1.2 | System Instruction | 7-rule turn-taking protocol, 3-round structured Discovery, Exploration cross-referencing, conflict structure announcements | `lib/ai-service.ts` |
| 1.3 | Auto-Extraction | Background extraction every 3 min, duplicate-aware merge, extraction notice toast | `workspace/page.tsx` |
| 1.4 | Transcript Panel | Styled live panel with indigo/sky color-coding, auto-scroll, "Scroll to latest" button, editable textarea fallback | `workspace/page.tsx` |
| 2.1 | Resolution Engine | `analyzePathways()` returns rich `PathwaysResult` with ZOPA, framework fit, executive summary, trade-offs, implementation steps | `lib/ai-service.ts`, `services/gemini-client.ts`, `app/api/analyze/route.ts` |
| 2.2 | Mediator Styles | Professional / Empathic style selector; style-dependent system instruction preamble; auto-sets voice | `workspace/page.tsx`, `lib/ai-service.ts` |
| 2.3 | Profiling Toggle | `profilingEnabled` field on Case; toggle in settings; ON shows EnhancedPartyProfile + EscalationMeter, OFF shows simple cards | `workspace/page.tsx`, `lib/types.ts` |
| 2.4 | Case Summary | `summarizeCase()` in ai-service + `/api/summarize` route + modal with Copy/Export-as-Markdown | `lib/ai-service.ts`, `app/api/summarize/route.ts`, `workspace/page.tsx` |
| 3.1 | Primitive Management | `PrimitiveCluster` type, Auto-Group, per-primitive Pin/Resolve, Merge Duplicates, primitive count in tab label | `workspace/page.tsx`, `lib/types.ts` |
| 3.2 | Timeline | `TimelineEntry` type, Timeline tab with type icons, elapsed timestamps, and filter controls | `workspace/page.tsx`, `lib/types.ts` |
| 3.3 | Export | Export dropdown: JSON, Markdown report, Copy Transcript, Copy Summary | `workspace/page.tsx` |
| 3.4 | Session Polish | Duration timer, milestone toasts, auto-save every 30s, reconnection overlay with attempt count, rate-limit retry (5s/10s/20s) | `workspace/page.tsx`, `services/gemini-client.ts` |
| 3.5 | Graph Polish | Zoom controls (+/−/Fit All), highlight-by-party toggle | `components/workspace/ConflictGraph.tsx` |
| 3.6 | Keyboard Shortcuts | `1-5` switch tabs, `Ctrl+Enter` analyze, `Escape` close modals | `workspace/page.tsx` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 19)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ AudioCtx │  │  D3.js   │  │ Recharts │  │  Transcript   │  │
│  │ PCM 16K  │  │  Force   │  │ Profiles │  │  Panel + TTS  │  │
│  │ Capture  │  │  Graph   │  │ & Gauges │  │  Playback     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │             │              │                 │          │
│       └─────────────┴──────────────┴─────────────────┘         │
│                             │ WebSocket + REST                  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│            CLOUD RUN (single container, port 8080)              │
│  ┌──────────────────────────┼───────────────────────────────┐   │
│  │          server.ts (HTTP + WebSocket)                    │   │
│  │                          │                               │   │
│  │  ┌───────────────────┐   │  ┌──────────────────────────┐ │   │
│  │  │  Next.js App      │   │  │     ws-handler.ts        │ │   │
│  │  │  Router           │   │  │  ┌─────────────────────┐ │ │   │
│  │  │  /api/extract     │   │  │  │  Gemini Live Audio  │ │ │   │
│  │  │  /api/analyze     │   │  │  │  ┌─────────────────┐│ │ │   │
│  │  │  /api/chat        │   │  │  │  │ Affective Dialog││ │ │   │
│  │  │  /api/summarize   │   │  │  │  │ Proactive Audio ││ │ │   │
│  │  │  /api/transcribe  │   │  │  │  │ Tool Calling ×7 ││ │ │   │
│  │  │  /api/tts         │   │  │  │  │ Session Resume  ││ │ │   │
│  │  │  /api/research    │   │  │  │  │ Context Compress││ │ │   │
│  │  └───────────────────┘   │  │  │  └─────────────────┘│ │ │   │
│  │                          │  │  └─────────────────────┘ │ │   │
│  │                          ↓  │     ↕ bidirectional      │ │   │
│  │                  Gemini 2.5 Flash   Audio + Tool Calls  │ │   │
│  │                  (text/extraction)  + State Updates     │ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

A single Node.js process (`server.ts` → compiled `server.js`) runs both the Next.js App Router for HTTP requests and a WebSocket server on `/api/live` for live audio sessions. All AI calls happen server-side — credentials never reach the browser.

---

## Features

### Core Mediation
- **Live Audio Mediation** — Two-party sessions with a real-time AI mediator voice (Gemini Live Audio API)
- **7-Rule Turn-Taking Protocol** — Structured 3-round Discovery, phase-aware Exploration cross-referencing, and conflict structure announcements baked into the system instruction
- **Buffered Transcript** — Word-by-word fragments buffered and flushed on `turnComplete`/`toolCall` with `[MM:SS]` timestamps; color-coded live panel (indigo = Concordia, sky = Speaker)
- **Continuous Background Extraction** — Auto-extracts TACITUS primitives every 3 minutes during live sessions; duplicate-aware merge; subtle extraction notice toast
- **TACITUS Conflict Grammar** — 8 primitive types extracted in real time from live transcript

### Analysis & Resolution
- **Conflict Knowledge Graph** — D3 force-directed graph of all conflict primitives, updated live as the AI speaks; zoom controls (+/−/Fit All); highlight-by-party mode
- **Psychological Profiling** — Per-party emotional state, conflict style (Thomas-Kilmann), trust scores (Mayer/Davis/Schoorman), and risk assessment (toggleable)
- **Escalation Meter** — Live semicircle gauge tracking session tension
- **Resolution Pathways** — Rich AI-generated proposals with trade-offs per party, feasibility rating, implementation steps, and framework tagging
- **ZOPA Analysis** — Automatic identification of the Zone of Possible Agreement with visual range bars
- **Framework Fit Scoring** — Ranks 6+ mediation frameworks (0–100) and lets you re-run analysis locked to a single framework
- **Psychological Dynamics** — Surface hidden dynamics from the conversation (attribution errors, identity threat, power asymmetries)
- **Case Summary** — Generate a structured markdown summary with session overview, key claims, core interests, agreements, tensions, and recommended next steps; copyable or exportable as `.md`

### Case Structure
- **Per-Primitive Pin & Resolve** — Star-pin important primitives (sorted to top); mark resolved (strikethrough); both persisted in case state
- **Auto-Group** — Clusters primitives by actor + keyword; creates `PrimitiveCluster` records
- **Merge Duplicates** — Detects near-duplicate primitives (>60% word overlap, same type) and removes them
- **Primitive Count in Tab Label** — Live count badge: "Case Structure (14)"

### Session Management
- **Session Duration Timer** — Live `MM:SS` counter in the status bar; milestone toasts at 3 min, 10 min, 15 min
- **Auto-save** — Writes case state to `localStorage` every 30 seconds during live sessions
- **Rate Limit Retry** — API calls automatically retry up to 3 times on 429 with exponential backoff (5s, 10s, 20s)
- **Reconnection Overlay** — Yellow banner with attempt counter shown during WebSocket reconnects
- **Timeline Tab** — Chronological event log (utterance, extraction, phase-change, escalation, common-ground, reflection) with type icons, elapsed timestamps, and filter controls

### Export
- **Export Dropdown** — JSON case export, Markdown report, Copy Transcript, Copy Summary — all from a single toolbar button

### UX
- **Mediator Styles** — Professional (Zephyr voice) or Empathic (Kore voice) — changes system instruction preamble and AI personality
- **Keyboard Shortcuts** — `1-5` switch tabs; `Ctrl+Enter` → Analyze; `Escape` → close modals
- **Advisor Chat** — Ask the AI strategic questions about any conflict scenario
- **Audio Transcription** — Record and transcribe audio via Gemini
- **Text-to-Speech** — Generate natural mediator voice from text
- **Resolution Library** — Reference guide to 30+ established mediation frameworks
- **Session Resumption** — Automatic reconnection with resumption handles if the Gemini session drops
- **Demo Mode** — Full interactive UI at `/demo` with no API keys required

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **Backend** | Express-style HTTP server + `ws` WebSocket library (`server.ts`) |
| **AI** | `@google/genai` — Gemini Live Audio, Gemini Flash (text), Gemini TTS |
| **Visualization** | D3.js (conflict graph), Recharts (party profile charts) |
| **Infrastructure** | Docker (multi-stage, standalone), Google Cloud Run |

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/demo` | Interactive demo — no API keys needed |
| `/workspace` | Live mediation workspace (requires credentials) |
| `/chat` | Advisor chat |
| `/transcribe` | Audio transcription |
| `/tts` | Text-to-speech engine |
| `/library` | Resolution framework library (30+ frameworks) |
| `/how-it-works` | Platform guide |

---

## Local Development

**Prerequisites:** Node.js 20+

```bash
npm install

# Create .env.local with your credentials (see .env.example)
cp .env.example .env.local
# Edit .env.local — add GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_CLOUD_PROJECT
# OR set USE_VERTEX_AI=false and GEMINI_API_KEY for simpler setup

npm run dev
# → http://localhost:8080
```

The `npm run dev` command runs `tsx server.ts`, which starts both the Next.js dev server and the WebSocket server on port 8080 in a single process.

> The demo at `/demo` works without any API keys — good for exploring the UI.

---

## Testing

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests cover:
- **De-escalation engine** — trigger pattern detection, protocol selection, Glasl stage assessment
- **Mediation library** — framework integrity, primitive mappings, relevance scoring
- **Export utilities** — markdown and JSON output correctness
- **API routes** — health check, response shapes
- **Type contracts** — structural validation of all TACITUS primitives

---

## Docker Build & Run

```bash
docker build -t concordia .

docker run -p 8080:8080 -e GEMINI_API_KEY=your-key-here concordia
```

For Vertex AI mode:

```bash
docker run -p 8080:8080 \
  -e GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  -e GOOGLE_CLOUD_PROJECT=your-project-id \
  concordia
```

The Dockerfile uses a three-stage build: deps → builder (Next.js standalone + esbuild bundle of `server.ts`) → minimal Alpine runner.

---

## Cloud Run Deploy

```bash
gcloud run deploy concordia \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout=3600 \
  --session-affinity \
  --max-instances=10 \
  --concurrency=100 \
  --memory=1Gi \
  --cpu=1 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "GOOGLE_SERVICE_ACCOUNT_JSON=concordia-sa-key:latest"
```

---

## Why Cloud Run?

| Reason | Detail |
|--------|--------|
| **WebSocket support** | Cloud Run supports long-lived HTTP/2 and WebSocket connections out of the box |
| **Same Google network** | Vertex AI calls stay within Google's internal network — low latency, no egress cost |
| **Scale to zero** | Zero cost when idle; instances spin up in ~2 seconds |
| **Session affinity** | Reconnecting clients hit the same container instance, preserving in-memory WebSocket state |
| **Managed TLS + routing** | No nginx, no load balancer config needed |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes* | Full JSON content of a GCP service account key (single line). Required IAM role: `roles/aiplatform.user` |
| `GOOGLE_CLOUD_PROJECT` | Yes* | Google Cloud project ID (must have Vertex AI API enabled) |
| `GOOGLE_CLOUD_LOCATION` | No | Vertex AI region (default: `us-central1`) |
| `USE_VERTEX_AI` | No | Set to `false` to use Gemini Developer API instead of Vertex AI |
| `GEMINI_API_KEY` | If no SA | Gemini Developer API key — required when `USE_VERTEX_AI=false` |
| `MODEL_LIVE` | No | Override live audio model (default: `gemini-live-2.5-flash-native-audio`) |
| `MODEL_TEXT` | No | Override text/chat model (default: `gemini-2.0-flash`) |
| `MODEL_TTS` | No | Override TTS model (default: `gemini-2.5-flash-preview-tts`) |
| `MODEL_TRANSCRIBE` | No | Override transcription model (default: `gemini-2.0-flash`) |
| `PORT` | No | Server port (default: `8080`) |
| `NODE_ENV` | No | Set to `production` in deployed environments |

\* Not required when `USE_VERTEX_AI=false` and `GEMINI_API_KEY` is set.

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check → `{ status: "ok", timestamp }` |
| `/api/chat` | POST | Advisor agent chat |
| `/api/extract` | POST | Extract TACITUS conflict primitives from transcript |
| `/api/analyze` | POST | Analyze resolution pathways and ZOPA |
| `/api/transcribe` | POST | Transcribe audio (multipart/form-data) |
| `/api/tts` | POST | Generate speech from text |
| `/api/research` | POST | Research grounding for conflict context |
| `/api/live` | WS | WebSocket endpoint for live audio mediation sessions |

<details>
<summary><code>POST /api/extract</code> — Extract TACITUS primitives</summary>

**Request:**
```json
{
  "text": "Alice says she needs the project completed by Friday because her client has a hard deadline. Bob argues that's impossible given the current team capacity."
}
```

**Response:**
```json
{
  "result": {
    "actors": [
      { "name": "Alice", "role": "Project Manager", "type": "individual", "stance": "Firm on deadline", "powerLevel": 3 },
      { "name": "Bob", "role": "Team Lead", "type": "individual", "stance": "Pushing back on timeline", "powerLevel": 3 }
    ],
    "primitives": [
      { "primitiveType": "Claim", "actorName": "Alice", "description": "Project must be completed by Friday", "subType": "demand", "status": "active", "confidence": 0.9 },
      { "primitiveType": "Constraint", "actorName": "Alice", "description": "Client has a hard deadline", "subType": "temporal", "rigidity": "hard" },
      { "primitiveType": "Constraint", "actorName": "Bob", "description": "Current team capacity insufficient", "subType": "organizational", "rigidity": "soft" },
      { "primitiveType": "Interest", "actorName": "Alice", "description": "Maintaining client relationship and trust", "subType": "relational", "priority": "critical", "visibility": "implicit" }
    ]
  }
}
```
</details>

<details>
<summary><code>POST /api/analyze</code> — Analyze resolution pathways</summary>

**Request:**
```json
{
  "transcript": "Full session transcript...",
  "caseStructure": "{ \"actors\": [...], \"primitives\": [...] }",
  "framework": "Fisher & Ury"
}
```

**Response:**
```json
{
  "result": {
    "executiveSummary": "Both parties share an interest in project success...",
    "zopaExists": true,
    "zopaDescription": "Agreement likely achievable if scope is reduced...",
    "pathways": [
      {
        "title": "Phased Delivery with Milestone Reviews",
        "description": "Deliver a core subset by Friday, remainder by following Wednesday.",
        "framework": "Fisher & Ury",
        "feasibility": 78,
        "tradeOffsPartyA": ["Partial delivery may disappoint client"],
        "tradeOffsPartyB": ["Requires overtime for two days"],
        "implementationSteps": ["Define MVP scope today", "Client call Thursday", "Review Friday"]
      }
    ]
  }
}
```
</details>

---

## TACITUS Conflict Grammar

The TACITUS ontology represents conflict as a directed graph of 8 primitive types:

| Primitive | Subtypes | Description |
|-----------|----------|-------------|
| **Actor** | individual, group, organization, state | The parties to the conflict |
| **Claim** | position, demand, assertion, accusation | What parties say they want or assert |
| **Interest** | substantive, procedural, psychological, relational | Underlying needs behind positions |
| **Constraint** | legal, financial, temporal, organizational, cultural, emotional | Hard and soft limits on resolution space |
| **Leverage** | coercive, reward, legitimate, expert, referent, informational | Sources of power each party holds |
| **Commitment** | promise, agreement, concession, threat, ultimatum | Binding or conditional acts |
| **Event** | trigger, escalation, de-escalation, turning-point, deadline, milestone | Key moments in the conflict timeline |
| **Narrative** | origin-story, grievance, justification, aspiration, identity-claim, counter-narrative | Frames and stories that shape perception |

**Edge types** connecting primitives: `OPPOSES`, `ALIGNS_WITH`, `CONFLICTS_WITH`, `BLOCKS`, `SUPPORTS`, `ADDRESSES`, `TRIGGERS`, `FRAMES`, `CONTRADICTS`

**Actor-to-primitive edges**: `MAKES` (claim), `HAS` (interest), `FACES` (constraint), `WIELDS` (leverage), `GIVES` (commitment), `NARRATES` (narrative)

---

## Theoretical Foundation

CONCORDIA's mediation intelligence draws on 35+ peer-reviewed frameworks spanning six decades of conflict resolution research:

| Tradition | Key Theorists | CONCORDIA Application |
|-----------|---------------|----------------------|
| **Interest-Based** | Fisher, Ury, Patton (1981) | Position→Interest reframing, BATNA analysis, ZOPA detection |
| **Transformative** | Bush & Folger (1994) | Empowerment + recognition moves, identity threat detection |
| **Narrative** | Winslade & Monk (2000) | Dominant narrative identification, story externalization |
| **Escalation** | Glasl (1982) | 9-stage assessment, stage-appropriate intervention selection |
| **Ripeness** | Zartman (2000) | Mutually hurting stalemate detection, readiness scoring |
| **Social Psychology** | Deutsch (1973), Pruitt (1983) | Cooperative process induction, dual concern mapping |
| **Structural** | Galtung (1969), Curle (1971) | ABC triangle analysis, power-awareness assessment |
| **Cognitive** | Argyris (1970s), Kahneman (2011) | Ladder of inference, cognitive bias detection |
| **Complexity** | Coleman (2011) | Intractability detection, attractor perturbation |
| **Communication** | Gottman (1994) | Four Horsemen detection, repair attempt recognition |

---

## Multi-Agent Architecture

| Agent | Role | AI Model |
|-------|------|----------|
| **Listener** | Real-time voice I/O. Drives the mediation conversation, calls `updateMediationState` tool to push structured updates to the workspace UI | Gemini Live Audio |
| **Profiler** | Assesses psychological indicators per party: emotional state (Plutchik), conflict style (Thomas-Kilmann), trust dimensions (Mayer/Davis/Schoorman), risk scores | Gemini Flash (via tool call in live session) |
| **Extractor** | Parses transcript text into TACITUS JSON primitives via `/api/extract` | Gemini Flash |
| **Advisor** | Generates resolution pathways, critical questions, ZOPA analysis, and strategic recommendations via `/api/analyze` and `/api/chat` | Gemini Flash |

---

## Mediation Phases

The AI mediator guides sessions through six structured phases:

1. **Opening** — Welcome, ground rules, introductions, setting the tone
2. **Discovery** — Individual statements from each party (one at a time, uninterrupted)
3. **Exploration** — Cross-referencing perspectives, identifying patterns, surfacing triggers
4. **Negotiation** — Brainstorming options, exploring trade-offs, testing flexibility
5. **Resolution** — Narrowing viable pathways, testing draft agreements
6. **Agreement** — Summarising outcomes, confirming next steps, closing

---

## Mediation Frameworks

CONCORDIA draws on 30+ established frameworks, including:

Fisher & Ury Principled Negotiation, Lederach Peacebuilding, Glasl Escalation Model, Zartman Ripeness Theory, Thomas-Kilmann Conflict Modes, Bush & Folger Transformative Mediation, Winslade & Monk Narrative Mediation, Gottman Four Horsemen, Mayer/Davis/Schoorman Trust Model, Lewicki Trust Repair, Ury's Getting Past No, and more.

---

## Demo

The `/demo` route provides a fully interactive version of the workspace UI populated with synthetic data. No API keys or Google Cloud credentials are required. Use it to explore the conflict graph, party profiles, escalation meter, and resolution pathway display before configuring live credentials.

---

## Health Check

```bash
curl https://your-cloud-run-url/api/health
# → {"status":"ok","timestamp":"2026-03-10T..."}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Run tests: `npm test`
4. Ensure linting passes: `npm run lint`
5. Submit a PR with a clear description of what you changed and why

### Development Conventions

- TypeScript strict mode
- All new features require tests
- New mediation frameworks must include: `id`, `corePrinciples`, `keyTechniques`, `diagnosticQuestions`, `glaslStages`, `tacitusPrimitives`
- UI components go in `components/workspace/`
- All AI service functions go in `lib/ai-service.ts`

---

## License

Apache-2.0

---

CONCORDIA by **TACITUS** — [tacitus.me](https://tacitus.me) — [hello@tacitus.me](mailto:hello@tacitus.me)
