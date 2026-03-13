# CONCORDIA — Real-Time AI Mediation Platform

> **CONCORDIA by TACITUS◳** is the first real-time voice AI mediation platform that decomposes conflict into a typed ontology, applies 38 peer-reviewed resolution frameworks, detects emotion from vocal tone, and guides parties to resolution — producing a formal settlement agreement.

Built for the Google Gemini API Developer Competition by **Giulio Catanzariti** — [TACITUS](https://tacitus.me) — [hello@tacitus.me](mailto:hello@tacitus.me)

---

## What Makes CONCORDIA Different

| Capability | How it works |
|-----------|-------------|
| **Real-time voice mediation** | Native audio via Gemini Live Audio API — the AI mediator speaks and listens, not just chats |
| **Affective dialog** | Emotion detection from vocal tone, pace, and tremor — no transcription required |
| **8-primitive conflict ontology** | TACITUS Conflict Grammar maps every utterance to a typed, relational structure |
| **38 peer-reviewed frameworks** | Automatically applied by phase: from Fisher & Ury to Rosenberg NVC to Shapiro Identity |
| **Live D3 knowledge graph** | Force-directed graph of actors, claims, interests, constraints — updates in real time |
| **Pre-session intake** | 5-step wizard with document upload, AI briefing extraction, power assessment |
| **Multi-party rooms** | Separate devices via 6-character room codes; both parties share one Gemini Live session |
| **Blind bidding settlement** | Smartsettle-inspired RCB algorithm for numerical issues — parties submit ranges privately |
| **Settlement agreement export** | Professional HTML document with preview modal, Print/PDF, Download HTML, Copy Text |

---

## Architecture

```
Browser(s) ──WebSocket──┐
                        ├── Cloud Run (server.ts) ──── Gemini Live Audio API
Browser(s) ──WebSocket──┘    │
                             │  Room Manager (affective dialog,
Next.js App Router           │  proactive audio,
│  /api/extract              │  tool calling ×7,
│  /api/analyze              │  VAD tuning,
│  /api/chat                 │  session resumption,
│  /api/generate-agreement   │  context compression)
│  /api/process-document     │
│  /api/common-ground  ──────┘
│  /api/summarize
│  /api/tts               Gemini 2.5 Flash
│  /api/research          (text extraction,
└  /api/transcribe         analysis, agreement)
```

---

## Features

### Pre-Session

- **5-step structured intake wizard** — case setup, party info, power assessment, document upload, ground rules
- **Document upload** — `.pdf`, `.txt`, `.docx` ingested with AI briefing extraction; key facts integrated into mediator context
- **Party initial statements** — each party sets goals, priorities, and non-negotiables before session
- **Power dynamics assessment** — structured pre-session radar across economic, legal, informational, and social dimensions
- **Ground rules acknowledgment** — consent and confidentiality acknowledgment before audio starts

### Live Mediation

- **Real-time voice** — Gemini Live Audio API; AI mediator speaks and listens to both parties simultaneously
- **Affective Dialog** — emotion detection from vocal tone, pace, tremor (no text transcription required for affect)
- **Proactive Audio** — intelligent co-listening mode when parties talk to each other between AI turns
- **VAD tuning** — `END_SENSITIVITY_LOW`, 2.5 s silence threshold, `NO_INTERRUPTION` mode
- **6-phase progression** — Opening → Discovery → Exploration → Negotiation → Resolution → Agreement
- **MI Change Talk / Sustain Talk detection** — motivational interviewing signals tracked in real time
- **ORID questioning sequence** — Objective, Reflective, Interpretive, Decisional questions by phase
- **Speaker disambiguation protocol** — shared microphone mode handles "Was that Party A or Party B?"
- **Caucus mode** — private AI conversation with individual parties; joint session resumable
- **Real-time context feedback loop** — extracted primitives and background analysis injected into live session

### Conflict Intelligence

- **TACITUS ontology** — 8-primitive extraction: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
- **Live D3 force-directed knowledge graph** — primitives and their relationships rendered as interactive network
- **Thomas-Kilmann profiling** — conflict style (competing, collaborating, compromising, avoiding, accommodating)
- **Plutchik emotion wheel** — emotional state and intensity (1–10) per party per snapshot
- **Mayer/Davis/Schoorman trust model** — ability, benevolence, integrity dimensions tracked separately
- **Glasl stage detection** — 9-stage escalation model with automatic stage classification
- **10 cognitive distortion patterns** — Fundamental Attribution Error, Zero-Sum Thinking, Anchoring, Catastrophizing, and 6 more
- **Power dynamics radar** — live multi-dimensional power assessment chart
- **Impasse detection** — 7 breaking techniques suggested on repeated-position signals
- **Emotion timeline** — Recharts line chart of emotional intensity trajectory for both parties
- **Background common ground analysis** — parallel ZOPA hints computed after each extraction cycle (debounced 30 s)

### Resolution Tools

- **Resolution pathway analysis** — AI-generated options with framework fit scoring and feasibility ratings
- **ZOPA analysis** — Zone of Possible Agreement with flexibility ranges per issue
- **Blind bidding** — parties submit private value ranges; RCB algorithm settles at overlap midpoint weighted by range width
- **Settlement agreement generation** — AI-drafted structured document
  - Preview modal with rendered HTML iframe
  - "Print / Save as PDF" — opens browser print dialog
  - "Download HTML" — saves file directly to disk
  - "Copy Text" — plain-text version to clipboard
- **Case summary export** — JSON, Markdown, full transcript

### Multi-Party

- **Shared device mode** — both parties at one computer; speaker disambiguation via protocol
- **Separate devices** — Party A creates room; Party B joins via `?join=XXXXXX` URL
- **6-character room codes** — unambiguous charset (no 0/O or 1/I confusion when read aloud)
- **Observer mode** — read-only session monitoring

---

## TACITUS Conflict Grammar

The eight primitives of the TACITUS ontology turn unstructured speech into a structured, queryable representation of a dispute.

| Primitive | Symbol | Subtypes | Description | Example |
|-----------|--------|----------|-------------|---------|
| **Actor** | A | disputant, representative, witness, stakeholder, institution | Any party with agency | "Alice (claimant)", "ABC Corp" |
| **Claim** | C | position, demand, assertion, accusation | A stated position or demand | "I am owed $15,000 in unpaid wages" |
| **Interest** | I | economic, relational, identity, procedural, principle | The underlying need behind a claim | "Financial stability", "recognition" |
| **Constraint** | K | legal, financial, temporal, relational, logistical | A hard limit neither party can cross | "Cannot exceed budget cap" |
| **Leverage** | L | legal, financial, relational, reputational, informational | A resource giving bargaining power | "Signed contract", "industry contacts" |
| **Commitment** | O | offer, concession, promise, agreement, condition | An agreed action or obligation | "Will deliver by Friday" |
| **Event** | E | incident, decision, communication, action, omission | A historical fact anchoring the dispute | "Contract signed 2023-01-15" |
| **Narrative** | N | grievance, justification, reframe, identity, victimhood | A story frame each party uses | "I was victimised", "they breached the agreement" |

---

## Theoretical Foundation — 38 Frameworks

| # | ID | Name | Key Theorists | Year | Tradition | CONCORDIA Application |
|---|-----|------|--------------|------|-----------|----------------------|
| 1 | `fisher-ury` | Principled Negotiation | Fisher, Ury, Patton | 1981 | negotiation | Interest excavation, BATNA |
| 2 | `ury-past-no` | Breakthrough Negotiation | William Ury | 1991 | negotiation | Breakthrough barrier techniques |
| 3 | `lederach` | Conflict Transformation | John Paul Lederach | 1997 | transformation | Relationship repair framing |
| 4 | `glasl` | 9-Stage Escalation Model | Friedrich Glasl | 1982 | escalation | Stage detection, de-escalation trigger |
| 5 | `zartman` | Ripeness Theory | I. William Zartman | 2000 | analysis | Negotiation readiness scoring |
| 6 | `bush-folger` | Transformative Mediation | Bush & Folger | 2005 | transformation | Empowerment and recognition |
| 7 | `winslade-monk` | Narrative Mediation | Winslade & Monk | 2000 | mediation | Story reframing techniques |
| 8 | `thomas-kilmann` | Conflict Mode Instrument | Thomas & Kilmann | 1974 | psychology | Conflict style profiling |
| 9 | `gottman` | Four Horsemen of Conflict | John Gottman | 1994 | psychology | Escalation detection (blame, contempt, threat, stonewalling) |
| 10 | `moore` | Circle of Conflict | Christopher W. Moore | 2014 | analysis | Conflict source categorisation |
| 11 | `mayer` | Wheel of Conflict | Bernard Mayer | 2012 | analysis | Multi-source conflict mapping |
| 12 | `deutsch` | Cooperative vs. Competitive | Morton Deutsch | 1973 | analysis | Interdependence framing |
| 13 | `schelling` | Strategy of Conflict | Thomas C. Schelling | 1960 | negotiation | Game theory and focal points |
| 14 | `pruitt-kim` | Dual Concern Model | Pruitt & Kim | 2004 | negotiation | Concern-balance strategy selection |
| 15 | `galtung` | Structural Violence Triangle | Johan Galtung | 1996 | transformation | Root cause and structural analysis |
| 16 | `batna-protocol` | BATNA Analysis Protocol | Fisher & Ury / CONCORDIA | 1981 | negotiation | Best alternative assessment |
| 17 | `active-listening` | Active Listening Toolkit | Rogers, Gordon, Bolton | 1980 | mediation | Reflective listening prompts |
| 18 | `reframing` | Reframing Techniques | Fisher & Ury / Winslade | 1990 | mediation | Reframe hostile statements |
| 19 | `power-balancing` | Power Balancing Methods | Haynes, Moore, Mayer | 1993 | mediation | Power imbalance correction |
| 20 | `de-escalation` | De-escalation Playbook | Ury, Glasl, Patterson | 2000 | mediation | Real-time de-escalation moves |
| 21 | `curle` | Conflict Progression Model | Adam Curle | 1971 | transformation | Conflict stage progression |
| 22 | `coleman` | The Five Percent | Peter T. Coleman | 2011 | analysis | Intractable conflict patterns |
| 23 | `ury-brett-goldberg` | Interest-Rights-Power | Ury, Brett, Goldberg | 1988 | analysis | Dispute system design |
| 24 | `argyris` | Ladder of Inference | Chris Argyris | 1970 | psychology | Assumption surfacing |
| 25 | `rosenberg-nvc` | Nonviolent Communication | Marshall B. Rosenberg | 1999 | mediation | Emotion/need language translation |
| 26 | `stone-difficult-conversations` | Three Conversations Model | Stone, Patton, Heen | 1999 | psychology | What happened / feelings / identity |
| 27 | `lewicki-trust-repair` | Trust Repair & Rebuilding | Lewicki & Tomlinson | 2006 | psychology | Trust rebuilding steps |
| 28 | `shapiro-identity` | Negotiating the Nonnegotiable | Daniel L. Shapiro | 2016 | psychology | Identity threat detection |
| 29 | `solution-focused` | Solution-Focused Brief Approach | de Shazer & Berg | 1985 | mediation | Exception and scaling questions |
| 30 | `mnookin-beyond-winning` | Tension Management Framework | Mnookin, Peppet, Tulumello | 2000 | negotiation | Tension diagnosis |
| 31 | `follett-integration` | Creative Integration | Mary Parker Follett | 1924 | transformation | Win-win integration |
| 32 | `circle-process` | Circle Process | Kay Pranis | 2005 | mediation | Restorative circle facilitation |
| 33 | `appreciative-inquiry` | Appreciative Inquiry (4-D) | Cooperrider & Srivastva | 1987 | transformation | Strengths-based reframing |
| 34 | `collaborative-law` | Collaborative Law / Practice | Stuart Webb | 1990 | negotiation | Collaborative legal process |
| 35 | `dialogic-od` | Dialogic Organization Development | Bushe & Marshak | 2015 | transformation | Conversational change |
| 36 | `riskin-grid` | Riskin Grid (Mediator Orientations) | Leonard Riskin | 1996 | mediation | Mediator style selection |
| 37 | `interest-based-relational` | Interest-Based Relational Approach | Fisher & Brown | 1988 | negotiation | Relationship-first negotiation |
| 38 | `cross-cultural-mediation` | Cross-Cultural Conflict Resolution | Kevin Avruch | 1998 | mediation | Cultural frame adaptation |

Full framework entries (principles, techniques, diagnostic questions) are in `lib/mediation-library.ts` and browsable at `/library`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router, Turbopack), React 19, TypeScript 5.8, Tailwind CSS 4 |
| **Animation** | Framer Motion (via `motion` package) |
| **Visualization** | D3.js (conflict knowledge graph), Recharts (emotion timeline, power map, party profiles) |
| **Backend** | Custom Node.js HTTP + WebSocket server (`server.ts`), Room Manager (`lib/room-manager.ts`) |
| **AI** | `@google/genai` — Gemini Live Audio, Gemini 2.5 Flash, Gemini TTS |
| **Icons** | Lucide React |
| **Fonts** | Instrument Serif, DM Sans, JetBrains Mono (Google Fonts) |
| **Testing** | Vitest 4, @testing-library/react |
| **Infrastructure** | Docker, Google Cloud Run |

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- A **Google Gemini API key** with Gemini Live Audio access

### Local Development

```bash
git clone https://github.com/sargonxg/H2_CONCORDIA_GHACK_SUBMISSION.git
cd H2_CONCORDIA_GHACK_SUBMISSION
npm install
cp .env.example .env          # then add your GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The custom server handles both HTTP and WebSocket on the same port.

### Docker

```bash
docker build -t concordia .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key concordia
```

### Cloud Run Deploy

```bash
gcloud run deploy concordia \
  --source . \
  --port 8080 \
  --set-env-vars GEMINI_API_KEY=your_key \
  --allow-unauthenticated
```

---

## Testing

```bash
npm test              # 10+ test files, 40+ tests (single pass)
npm run test:watch    # watch mode
npm run test:coverage # coverage report
npm run test:ci       # verbose, for CI
```

### Test Suites

| File | What is tested |
|------|---------------|
| `tests/lib/de-escalation.test.ts` | `detectEscalationLevel`, `getProtocolForEscalation`, `ESCALATION_TRIGGERS`, `COGNITIVE_DISTORTIONS`, `detectGlaslStage` |
| `tests/lib/mediation-library.test.ts` | `FRAMEWORKS` (38 entries, all IDs, glaslStages), `getRelevantFrameworks`, `buildFrameworkSnippet` |
| `tests/lib/blind-bidding.test.ts` | `calculateSettlement` RCB algorithm — overlap, gap, weighting, edge cases |
| `tests/lib/room-manager.test.ts` | `createRoom`, `getRoom`, `joinRoom`, `leaveRoom`, `broadcastToRoom` |
| `tests/lib/export-agreement.test.ts` | `generateAgreementHTML`, `formatAgreementAsText` — valid HTML, party names, terms, disclaimer, plain text |
| `tests/lib/export.test.ts` | `exportAsMarkdown`, `exportAsJSON`, `downloadFile` |
| `tests/lib/utils.test.ts` | `safeJsonParse` and utility helpers |
| `tests/types/types.test.ts` | Type contracts for `Case`, `Actor`, `Primitive`, `EmotionSnapshot`, `Agreement`, `EscalationFlag`, `PowerDynamics` |
| `tests/api/routes.test.ts` | `/api/health`, `/api/extract`, `/api/chat`, `/api/common-ground`, `/api/generate-agreement` |
| `tests/api/health.test.ts` | Health endpoint contract |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes (non-Vertex) | Google Gemini API key |
| `GOOGLE_CLOUD_PROJECT` | Yes (Vertex AI) | GCP project ID for Vertex AI |
| `GOOGLE_CLOUD_LOCATION` | No | Vertex AI region (default: `us-central1`) |
| `PORT` | No | Server port (default: `8080`) |

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

---

## API Reference

All REST endpoints accept and return JSON unless noted.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health check |
| `/api/extract` | POST | TACITUS primitive extraction from transcript text |
| `/api/analyze` | POST | Resolution pathway analysis with framework scoring |
| `/api/chat` | POST | Advisor chat with conversation history |
| `/api/summarize` | POST | Structured session summary generation |
| `/api/transcribe` | POST | Base64 audio transcription |
| `/api/tts` | POST | Text-to-speech (Gemini TTS, Kore voice) |
| `/api/research` | POST | Grounded fact-checking via Google Search |
| `/api/process-document` | POST | Document ingestion and AI briefing extraction |
| `/api/generate-agreement` | POST | AI-drafted settlement agreement |
| `/api/common-ground` | POST | Background ZOPA and common ground analysis |
| `/api/live` | WebSocket | Bidirectional Gemini Live Audio proxy |

### `GET /api/health`
```json
{ "status": "ok", "timestamp": "2026-03-13T00:00:00.000Z", "service": "CONCORDIA" }
```

### `POST /api/extract`
```json
// Request
{ "text": "Alice claims Bob owes her $10,000 for the completed project." }
// Response
{ "result": "{\"actors\": [...], \"primitives\": [...]}" }
```

### `POST /api/analyze`
```json
// Request
{ "transcript": "...", "caseStructure": "...", "framework": "fisher-ury" }
// Response
{ "result": "{\"executiveSummary\": \"...\", \"pathways\": [...], \"zopaAnalysis\": {...}}" }
```

### `POST /api/chat`
```json
// Request
{ "message": "What is BATNA?", "history": [], "caseContext": "..." }
// Response
{ "text": "BATNA stands for Best Alternative to a Negotiated Agreement..." }
```

### `POST /api/generate-agreement`
```json
// Request
{
  "caseTitle": "Employment Dispute",
  "caseType": "Workplace",
  "partyAName": "Alice",
  "partyBName": "Bob",
  "agreements": [{ "topic": "Compensation", "terms": "Payment of $5,000 within 30 days", "conditions": [] }],
  "transcript": "...",
  "commonGround": [...],
  "context": "..."
}
```

### `POST /api/common-ground`
```json
// Request
{ "transcript": "...", "primitives": [...], "actors": [...] }
// Response
{ "commonGroundItems": [...], "zopaHints": [...], "readinessScore": 72 }
```

### `WebSocket /api/live`

**Client → Server:**

| Type | Payload | Description |
|------|---------|-------------|
| `start` | `{ context, mediatorProfile, partyNames, createRoom?, caseId? }` | Start a new session |
| `join` | `{ roomCode, name }` | Join an existing room as Party B |
| `audio` | `{ audio: base64 }` | Stream PCM audio chunk |
| `toolResponse` | `{ functionResponses }` | Respond to Gemini tool call |
| `context` | `{ text }` | Inject context into live session |
| `ping` | — | Keep-alive |
| `close` | — | End session gracefully |

**Server → Client:**

| Type | Payload | Description |
|------|---------|-------------|
| `open` | — | Session ready |
| `roomCreated` | `{ roomCode }` | Room code for Party B to join |
| `joined` | `{ partyId }` | Successfully joined room |
| `message` | `{ data }` | Gemini response data (audio, tool calls, transcripts) |
| `reconnecting` | — | Session reconnecting |
| `reconnected` | — | Reconnection successful |
| `error` | `{ error }` | Error message |
| `close` | — | Session ended |

---

## Multi-Party Room Flow

```
Party A (Mediator device)              Party B (Second device)
         │                                      │
         │  Start Session                       │
         │  { createRoom: true }                │
         ▼                                      │
  [Room Created: H7KR2N]                        │
         │                                      │
         │  Share URL:                          │
         │  https://…/workspace?join=H7KR2N ───►│
         │                                      │
         │                           [Join Screen]
         │                                      │
         │              { join: "H7KR2N", name: "Bob" }
         │◄─────────────────────────────────────│
         │                                      │
  [partyJoined]                        [joined: partyId=B]
         │                                      │
         │◄═══════ Shared Gemini Live Session ══════►
```

Room codes use an unambiguous charset (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) — no 0/O or 1/I confusion when shared verbally. Rooms auto-expire 15 minutes after creation if Party B never joins.

---

## Technical Notes

### Gemini Live API — Speaker Diarization

The Gemini Live API does not provide explicit speaker diarization in real-time streaming mode. With `enableAffectiveDialog: true`, the model distinguishes speakers by vocal characteristics (pitch, timbre, pace). The speaker disambiguation protocol in the system instruction handles uncertainty: "Was that Party A or Party B?" For post-session analysis, Gemini 2.5 Flash performs speaker diarization on the full audio recording.

### Background Analysis Architecture

Common ground analysis runs as a fire-and-forget API call after each extraction cycle, debounced at 30 seconds and non-blocking. Results are merged into `liveMediationState` and injected into the live session via `sendContext` — the AI mediator receives background analysis results and can reference them naturally mid-session.

### Emotion Timeline Data Flow

```
Live Audio → Gemini (affective dialog) → updateMediationState tool call
  → partyProfiles.partyA.emotionalState, emotionalIntensity, emotionalTrajectory
  → EmotionSnapshot captured → emotionTimeline[] in Case
  → EmotionTimeline.tsx (Recharts LineChart)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes with tests: `npm run test:ci`
4. Type-check: `npx tsc --noEmit`
5. Lint: `npm run lint`
6. Commit with a descriptive message
7. Open a pull request

---

## License

Apache-2.0 — see [LICENSE](LICENSE) for details.

**CONCORDIA is a communication facilitation tool. It does not provide legal, psychological, or therapeutic advice. Outputs should be reviewed by qualified professionals before use in formal proceedings.**

---

*CONCORDIA by TACITUS◳ — Making conflict computable enough for better human judgment*

[tacitus.me](https://tacitus.me) · [hello@tacitus.me](mailto:hello@tacitus.me)
