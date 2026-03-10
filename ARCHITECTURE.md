# CONCORDIA — Architecture

> Detailed technical reference for the CONCORDIA AI mediation platform.

---

## 1. System Architecture

### Single-Container Design

CONCORDIA runs as a single Docker container exposing one port (8080). A single Node.js process (`server.js`, compiled from `server.ts`) handles:

- All HTTP requests via the Next.js App Router (SSR, API routes, static assets)
- WebSocket upgrade requests on `/api/live` via the `ws` library

```
Browser ↔ Cloud Run (single container, port 8080)
              ├─ Next.js App Router (HTTP/SSR/API routes)
              ├─ WebSocket server /api/live (ws)
              └─ @google/genai → Gemini Live Audio API
```

**Why a single container?**

The Gemini Live Audio API requires a persistent bidirectional connection. The WebSocket handler and the Next.js server share the same Node.js event loop and the same HTTP server instance — the `ws` `WebSocketServer` is attached directly to the `http.Server` that Next.js uses. This avoids any cross-process proxying, removes the need for a reverse proxy (nginx), and ensures that session state (the `liveSession` object per WebSocket connection) is always co-located with the WebSocket connection itself.

### Process Startup

```
node server.js
  └─ next().prepare()           # Next.js app initialises
      └─ http.createServer()    # HTTP server
          ├─ Next.js handle()   # All HTTP requests → App Router
          └─ WebSocketServer    # ws upgrade on /api/live
```

`server.ts` is compiled to `server.js` at Docker build time using esbuild with `--bundle`, bundling `ws` and `@google/genai` directly into the output while keeping `next` external (it lives in the standalone `node_modules`).

---

## 2. Data Flow — Live Audio Session

### Step-by-Step

```
1.  Browser opens WebSocket connection to wss://<host>/api/live

2.  server.ts: WebSocketServer receives the upgrade request,
    calls handleWebSocketConnection(ws)

3.  Client sends { type: "start", context, mediatorProfile, partyNames }

4.  ws-handler.ts: calls createLiveSession() in lib/ai-service.ts
    - Authenticates via service account (writes JSON to /tmp, sets
      GOOGLE_APPLICATION_CREDENTIALS) or via GEMINI_API_KEY
    - Opens a Gemini Live Audio session (gemini-live-2.5-flash-native-audio)
    - Registers updateMediationState as a callable tool

5.  Gemini session opens → ws-handler sends { type: "open" } to browser

6.  Audio loop (while session is active):
    Browser:    captures microphone PCM at 16kHz
                → sends { type: "audio", audio: <base64 PCM> } frames
    ws-handler: calls liveSession.sendRealtimeInput({ audio })
    Gemini:     processes audio, generates speech response
                → sends serverContent messages with audio chunks
    ws-handler: forwards { type: "message", data: <gemini message> }
    Browser:    decodes audio chunks, plays via Web Audio API

7.  Tool call flow (state updates):
    Gemini decides to call updateMediationState
    → sends toolCall message to ws-handler
    ws-handler: sets toolCallPending = true (drops audio input to
                prevent 1008 policy violation)
                forwards { type: "message", data: { toolCall: ... } }
    Browser:    React workspace receives the tool call
                → updates LiveMediationState in React state
                → updates conflict graph, party profiles, phase indicator
                → sends { type: "toolResponse", functionResponses: [...] }
    ws-handler: calls liveSession.sendToolResponse(...)
                sets toolCallPending = false (re-enables audio input)

8.  Session resumption:
    Gemini periodically sends sessionResumptionUpdate with a newHandle
    ws-handler: stores latestResumptionHandle
    On disconnect (goAway, close, error):
      tryReconnect() calls connectLiveSession(latestResumptionHandle)
      Up to 3 attempts with exponential backoff (1s, 2s, 4s)
      Browser receives { type: "reconnecting" } / { type: "reconnected" }

9.  Session close:
    Client sends { type: "close" }
    OR ws.on("close") fires (browser tab closed)
    ws-handler: calls liveSession.close(), nulls the session
```

### Keep-Alive

The browser sends `{ type: "ping" }` periodically. The ws-handler responds with `{ type: "pong" }`. This prevents Cloud Run's idle connection timeout from closing the WebSocket before the session ends.

---

## 3. TACITUS Conflict Grammar

The TACITUS ontology represents a conflict as a directed property graph. Every entity is a **Node** of one of 8 primitive types; relationships between nodes are typed **Edges**.

### Primitive Types

| Type | Subtypes | Key Properties |
|------|----------|----------------|
| **Actor** | individual, group, organization, state | name, stance, powerLevel (1-5) |
| **Claim** | position, demand, assertion, accusation | content, status (active/withdrawn/acknowledged/disputed), confidence (0-1) |
| **Interest** | substantive, procedural, psychological, relational | content, priority (critical/important/desirable), visibility (stated/implicit/hidden) |
| **Constraint** | legal, financial, temporal, organizational, cultural, emotional | content, rigidity (hard/soft/negotiable) |
| **Leverage** | coercive, reward, legitimate, expert, referent, informational | content, strength (1-5) |
| **Commitment** | promise, agreement, concession, threat, ultimatum | content, status (proposed/accepted/rejected/conditional/fulfilled/broken), bindingness (moral/legal/social) |
| **Event** | trigger, escalation, de-escalation, turning-point, deadline, milestone | content, timestamp, impact (high/medium/low) |
| **Narrative** | origin-story, grievance, justification, aspiration, identity-claim, counter-narrative | content, framing (victim/hero/villain/mediator/neutral), emotionalTone |

### Edge Types

**Actor-to-primitive** (ownership / attribution):

| Edge | Meaning |
|------|---------|
| `MAKES` | Actor makes a Claim |
| `HAS` | Actor has an Interest |
| `FACES` | Actor faces a Constraint |
| `WIELDS` | Actor wields Leverage |
| `GIVES` | Actor gives a Commitment |
| `NARRATES` | Actor tells a Narrative |

**Cross-primitive** (semantic relationships):

| Edge | Meaning |
|------|---------|
| `OPPOSES` | Two primitives are in direct opposition |
| `ALIGNS_WITH` | Two primitives are compatible or reinforcing |
| `CONFLICTS_WITH` | General incompatibility |
| `BLOCKS` | One primitive prevents another |
| `SUPPORTS` | One primitive strengthens another |
| `ADDRESSES` | One primitive responds to or resolves another |
| `TRIGGERS` | One primitive (typically Event) causes another |
| `FRAMES` | Narrative reframes interpretation of another primitive |
| `CONTRADICTS` | One primitive logically contradicts another |

### JSON Wire Format (extracted by `/api/extract`)

```json
{
  "actors": [
    { "id": "a1", "name": "Alice", "role": "Employee", "data": { "type": "individual", "stance": "assertive", "powerLevel": 3 } }
  ],
  "primitives": [
    { "id": "p1", "type": "Claim", "actorId": "a1", "description": "Demands back pay for overtime", "data": { "type": "demand", "status": "active", "confidence": 0.9 } },
    { "id": "p2", "type": "Interest", "actorId": "a1", "description": "Financial security", "data": { "type": "substantive", "priority": "critical", "visibility": "implicit" } }
  ]
}
```

---

## 4. AI Agent Roles

### Listener (Gemini Live Audio)

The Listener is the conversational core of a live mediation session. It:

- Connects to the Gemini Live Audio API (`gemini-live-2.5-flash-native-audio`)
- Receives real-time microphone audio from the browser and generates spoken responses
- Maintains session context: mediation phase, party names, mediator profile (voice, approach style)
- Calls the `updateMediationState` tool after significant exchanges to push structured updates to the workspace UI
- Implements the six-phase mediation script (Opening → Discovery → Exploration → Negotiation → Resolution → Agreement)
- Supports session resumption via Gemini's resumption handle mechanism

The `updateMediationState` tool schema includes: current phase, target actor, current action description, missing ontology items, structured items list, party profiles for both parties, common ground array, and tension points array.

### Profiler (embedded in Listener tool)

The Profiler assessment is embedded in the `updateMediationState` tool's party profile schema. For each party the Listener populates:

- **Emotional state** (free text) and **emotional intensity** (Plutchik 1-10 scale)
- **Emotional trajectory**: escalating / stable / de-escalating
- **Conflict style** (Thomas-Kilmann): Competing, Collaborating, Compromising, Avoiding, Accommodating
- **Trust toward other party** (Mayer/Davis/Schoorman): ability score, benevolence score, integrity score (each 0-100)
- **Risk assessment**: escalation risk, withdrawal risk, bad faith risk, impasse risk (each 0-100)
- **Communication style**, **cooperativeness**, **defensiveness**, **key needs**, **risk factors**

### Extractor (`/api/extract`)

The Extractor is a stateless API endpoint. It accepts a transcript string and returns a structured TACITUS JSON object (actors + primitives). It uses `gemini-2.0-flash` with a detailed system prompt describing all 8 primitive types and their valid subtypes, instructing the model to extract every identifiable primitive and assign each to an actor. The response is parsed and validated before being returned.

### Advisor (`/api/analyze`, `/api/chat`)

The Advisor operates on a complete case snapshot (actors + primitives + transcript). It:

- Generates concrete resolution pathways with trade-off analysis
- Identifies the Zone of Possible Agreement (ZOPA) by comparing Claims and Interests
- Proposes critical questions the mediator should ask
- Draws on 30+ established frameworks (Fisher & Ury, Lederach, Glasl escalation model, etc.)
- Supports conversational follow-up via `/api/chat` for strategic advice on any conflict scenario

---

## 5. Component Hierarchy

```
app/
├─ layout.tsx                    Root layout — ToastProvider, global styles
├─ page.tsx                      Landing page
├─ demo/
│   └─ page.tsx                  Interactive demo with synthetic data, no API needed
├─ (app)/
│   ├─ layout.tsx                App shell layout
│   ├─ workspace/
│   │   └─ page.tsx              Main live mediation workspace
│   ├─ chat/
│   │   └─ page.tsx              Advisor chat interface
│   ├─ transcribe/
│   │   └─ page.tsx              Audio transcription tool
│   ├─ tts/
│   │   └─ page.tsx              Text-to-speech engine
│   ├─ library/
│   │   └─ page.tsx              Resolution framework library
│   └─ how-it-works/
│       └─ page.tsx              Platform guide
└─ api/
    ├─ health/route.ts           GET  → { status, timestamp }
    ├─ chat/route.ts             POST → advisor chat completion
    ├─ extract/route.ts          POST → TACITUS primitive extraction
    ├─ analyze/route.ts          POST → pathway & ZOPA analysis
    ├─ transcribe/route.ts       POST → audio transcription
    ├─ tts/route.ts              POST → speech synthesis (audio/mpeg)
    └─ research/route.ts         POST → conflict research grounding

components/
├─ ErrorBoundary.tsx             React error boundary with fallback UI
├─ Toast.tsx                     Toast notification system + ToastProvider context
├─ LoadingSpinner.tsx            Reusable loading indicator
├─ LoadingStates.tsx             Skeleton loading states for workspace panels
└─ workspace/
    ├─ ConflictGraph.tsx         D3 force-directed graph of conflict primitives and edges
    ├─ EscalationMeter.tsx       Semicircle gauge showing real-time session tension
    ├─ EnhancedPartyProfile.tsx  Per-party profile card with trust radar and risk bars
    └─ OntologyHealthCheck.tsx   Radar chart showing coverage of 8 primitive types

lib/
├─ ai-service.ts                 GoogleGenAI client, model config, createLiveSession()
├─ ws-handler.ts                 WebSocket connection handler, session lifecycle
├─ types.ts                      Full TypeScript types for TACITUS ontology
└─ de-escalation.ts              De-escalation detection utilities

hooks/
└─ (custom React hooks for workspace state, WebSocket, audio)

services/
└─ (client-side service layer)
```

---

## 6. Cloud Run Configuration Rationale

| Flag | Value | Rationale |
|------|-------|-----------|
| `--timeout` | `3600` (60 min) | Live mediation sessions run 10–60 minutes. Cloud Run's default 60-second timeout would terminate active sessions. |
| `--session-affinity` | enabled | Each WebSocket connection holds an in-memory `liveSession` object. If a client reconnects to a different instance, the session is lost. Session affinity ensures the client always hits the same container. |
| `--concurrency` | `100` | Each mediation session = approximately 1 WebSocket connection. Node.js handles WebSocket I/O asynchronously; 100 concurrent connections per instance is conservative and safe. |
| `--memory` | `1Gi` | Audio processing (base64 encoding/decoding of PCM chunks) and the Node.js runtime with bundled `@google/genai` require more than the 512Mi default. |
| `--max-instances` | `10` | Pre-revenue cost control. At 100 concurrency per instance, this supports up to 1,000 simultaneous sessions. |
| `--cpu` | `1` | Sufficient for WebSocket proxying and API calls. CPU is not the bottleneck — network I/O is. |
| `--allow-unauthenticated` | set | Public-facing platform. Cloud Run handles TLS termination. |
| Scale to zero | default | No cost when idle. Cold start for this container is approximately 2 seconds. |
| `--source .` | set | Uses Cloud Build to build the Docker image from the repo root, pushing to Artifact Registry automatically. |

**Service account credentials** are stored in Google Cloud Secret Manager as `concordia-sa-key` and injected via `--set-secrets`. The server writes the JSON to `/tmp/gcloud-credentials.json` at startup and sets `GOOGLE_APPLICATION_CREDENTIALS` — this is the pattern required by the Google Auth library when credentials are passed as an environment variable string rather than a mounted file.

---

## 7. Security Considerations

- **Credentials never reach the browser.** All AI API calls are made server-side. The service account JSON and API key are only accessible to the Node.js process inside the container.
- **Secret Manager.** In production, `GOOGLE_SERVICE_ACCOUNT_JSON` is stored in GCP Secret Manager and injected at runtime via Cloud Run's `--set-secrets` flag, not baked into the Docker image.
- **Temporary credential file.** The service account JSON is written to `/tmp` (ephemeral, container-local) at process startup. The file path is set in `GOOGLE_APPLICATION_CREDENTIALS` for the Google Auth library.
- **Input validation.** API route handlers validate request bodies before passing data to the AI models. The Zod library is available for schema validation of structured inputs.
- **WebSocket message parsing.** All WebSocket messages are parsed inside a `try/catch`. Unknown message types are silently ignored.
- **Audio gating.** Audio frames are dropped (`toolCallPending = true`) while a Gemini tool call is in flight, preventing the 1008 policy violation that occurs when audio input is sent during a tool call.
- **Non-root container user.** The Dockerfile creates a `nextjs` system user (uid 1001) and runs the server process as that user, not as root.
- **No client-side secrets.** The `/demo` route uses only synthetic in-memory data. It makes no API calls and requires no credentials.

---

## 8. State Management

CONCORDIA uses no external state management library (no Redux, no Zustand, no server-side sessions beyond the WebSocket connection).

| State Type | Mechanism |
|-----------|-----------|
| **Live mediation state** (`LiveMediationState`) | React `useState` in the workspace page, updated by incoming WebSocket tool call messages |
| **Case data** (actors, primitives, transcript) | React `useState` + persisted to `localStorage` under a case ID key |
| **Party profiles** | Embedded in `LiveMediationState`, updated via Gemini tool calls |
| **Session configuration** (mediator voice, approach, party names) | React `useState`, read from form inputs before session start |
| **Toast notifications** | React Context (`ToastProvider`) in root layout |
| **Audio playback queue** | `useRef` holding a `AudioContext` and audio chunk queue in the workspace hook |

Cases are serialised to `localStorage` as JSON. The library page reads all stored cases for the case list view. There is no backend database — the platform is intentionally stateless on the server side.

---

## 9. WebSocket Protocol

All messages are JSON, sent over the WebSocket at `ws[s]://<host>/api/live`.

### Client → Server

| `type` | Payload | Description |
|--------|---------|-------------|
| `start` | `{ context, mediatorProfile, partyNames, resumptionHandle? }` | Open a new live session. `mediatorProfile` includes voice name and approach style. `resumptionHandle` is provided when resuming a dropped session. |
| `audio` | `{ audio: <base64 PCM 16kHz mono> }` | Audio frame from the microphone. Dropped server-side while `toolCallPending` is true. |
| `toolResponse` | `{ functionResponses: [{ id, name, response }] }` | Response to a Gemini tool call (e.g. after processing `updateMediationState`). Re-enables audio input. |
| `close` | — | Gracefully close the Gemini session. |
| `ping` | — | Keep-alive. Server responds with `{ type: "pong" }`. |

### Server → Client

| `type` | Payload | Description |
|--------|---------|-------------|
| `open` | — | Gemini session successfully opened. |
| `message` | `{ data: <GeminiMessage> }` | Forwarded Gemini API message (serverContent with audio chunks, toolCall, sessionResumptionUpdate, etc.). |
| `reconnecting` | — | Session dropped; server is attempting to reconnect using the resumption handle. |
| `reconnected` | — | Session successfully resumed. |
| `close` | — | Session closed (max reconnect attempts reached or graceful close). |
| `error` | `{ error: string }` | Unrecoverable error. |
| `pong` | — | Response to client ping. |

### Gemini Message Structure (within `{ type: "message", data: ... }`)

The `data` field is a raw Gemini Live API response object. The browser workspace hooks inspect:

- `data.serverContent.modelTurn.parts` — audio chunks (base64 PCM) and text transcripts
- `data.toolCall.functionCalls` — array of `{ id, name, args }` for `updateMediationState`
- `data.sessionResumptionUpdate.newHandle` — stored client-side for reconnection
- `data.goAway` — server-initiated disconnect warning

---

CONCORDIA by **TACITUS** — [tacitus.me](https://tacitus.me) — [hello@tacitus.me](mailto:hello@tacitus.me)
