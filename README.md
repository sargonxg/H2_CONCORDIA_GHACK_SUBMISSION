# CONCORDIA

**Real-Time AI Mediation Platform**

> Built for the Google Cloud Hackathon by **Giulio Catanzariti** — [TACITUS](https://tacitus.me)

---

## What is CONCORDIA?

CONCORDIA is a real-time AI mediation platform that guides two parties through structured conflict resolution using live audio conversation. An AI mediator listens, speaks, and adapts in real time — extracting psychological indicators, mapping conflict primitives onto a live knowledge graph, identifying common ground, and proposing actionable resolution pathways as the conversation unfolds.

The system is grounded in the **TACITUS Conflict Grammar**: an eight-primitive ontology (Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives) that turns unstructured speech into a structured, navigable representation of a dispute. Combined with real-time psychological profiling drawn from Thomas-Kilmann conflict modes, Plutchik's emotion wheel, and the Mayer/Davis/Schoorman trust model, CONCORDIA gives mediators and parties a live, evolving picture of their conflict — and a clear path toward resolution.

---

## Architecture

```
Browser ↔ Cloud Run (single container, port 8080)
              ├─ Next.js App Router (HTTP/SSR/API routes)
              ├─ WebSocket server /api/live (ws)
              └─ @google/genai → Gemini Live Audio API
```

A single Node.js process (`server.ts` → compiled `server.js`) runs both the Next.js App Router for HTTP requests and a WebSocket server on `/api/live` for live audio sessions. All AI calls happen server-side — credentials never reach the browser.

---

## Features

- **Live Audio Mediation** — Two-party sessions with a real-time AI mediator voice (Gemini Live Audio API)
- **Conflict Knowledge Graph** — D3 force-directed graph of all conflict primitives, updated live as the AI speaks
- **Psychological Profiling** — Per-party emotional state, conflict style (Thomas-Kilmann), trust scores (Mayer/Davis/Schoorman), and risk assessment
- **TACITUS Conflict Grammar** — 8 primitive types extracted in real time from live transcript
- **Escalation Meter** — Live semicircle gauge tracking session tension
- **Resolution Pathways** — AI-generated proposals with trade-off analysis drawn from 30+ mediation frameworks
- **ZOPA Analysis** — Automatic identification of the Zone of Possible Agreement
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

## License

Apache-2.0

---

CONCORDIA by **TACITUS** — [tacitus.me](https://tacitus.me) — [hello@tacitus.me](mailto:hello@tacitus.me)
