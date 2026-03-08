# CONCORDIA by TACITUS

**AI-Powered Live Mediation Platform**

Created by **Giulio Catanzariti** — Team [TACITUS.me](https://tacitus.me)

---

## What is CONCORDIA?

CONCORDIA is a real-time AI mediation platform that guides two parties through structured conflict resolution using live audio conversation. An AI mediator listens, speaks, and adapts in real time — extracting psychological indicators, mapping conflict primitives, identifying common ground, and proposing actionable resolution pathways as the parties talk.

The system is built on the **TACITUS ontology** for conflict representation, combining six structured primitive types (Claims, Interests, Constraints, Leverage, Commitments, Events) with real-time psychological profiling to give mediators and parties a live, evolving picture of the dispute.

## How It Works

### Live Mediation Session

Two parties sit in front of the app. The AI mediator guides a structured conversation through six phases:

1. **Opening** — Welcome, ground rules, introductions
2. **Discovery** — Individual statements from each party (one at a time)
3. **Exploration** — Cross-referencing perspectives, identifying patterns and triggers
4. **Negotiation** — Brainstorming options, exploring flexibility
5. **Resolution** — Narrowing down viable pathways, testing agreements
6. **Agreement** — Summarizing outcomes, confirming next steps

### Real-Time Intelligence

As the conversation progresses, the system provides:

- **Psychological Profiles** — Emotional state, engagement level, communication style, cooperativeness, defensiveness, key needs, and risk factors for each party
- **Case Structure** — Claims, Interests, Constraints, Leverage, Commitments, and Events extracted and attributed to each party
- **Common Ground & Tension Points** — Automatically identified areas of agreement and disagreement
- **Resolution Pathways** — Concrete proposals with trade-off analysis drawn from established mediation frameworks

### Multi-Agent Architecture

| Agent | Role |
|-------|------|
| **Listener** | Real-time voice I/O via Gemini Live Audio API. Maintains conversational flow, calls tools to update the workspace UI. |
| **Profiler** | Assesses psychological indicators and emotional state of each party in real time. |
| **Extractor** | Parses transcripts into structured JSON primitives (TACITUS ontology). |
| **Advisor** | Analyzes the case graph to generate pathways, critical questions, and common ground. |

### Additional Tools

- **Advisor Chat** — Ask the Advisor Agent strategic questions about any conflict
- **Audio Transcription** — Record and transcribe audio using Gemini
- **Speech Engine** — Generate natural speech from text for advisor responses
- **Resolution Library** — Reference established mediation frameworks (Principled Negotiation, Transformative, Narrative)

## Architecture

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  (Workspace, Chat, TTS, Transcribe) │
│         ↕ REST + WebSocket          │
├─────────────────────────────────────┤
│         Express.js Backend          │
│   API routes + WebSocket proxy      │
│         ↕ Vertex AI SDK             │
├─────────────────────────────────────┤
│      Google Cloud Vertex AI         │
│  Gemini Live Audio, Flash, TTS      │
└─────────────────────────────────────┘
```

All AI calls are server-side. The frontend communicates with the backend via REST API (`/api/*`) and WebSocket (`/api/live` for live audio sessions). Credentials never reach the browser.

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Express.js with WebSocket support (ws)
- **AI:** Google Gemini via Vertex AI (Live Audio, Flash, TTS)
- **Deployment:** Docker, Google Cloud Run
- **State:** Client-side with localStorage persistence

## Run Locally

**Prerequisites:** Node.js 18+, a Google Cloud service account with Vertex AI API enabled.

```bash
npm install
```

Create a `.env.local` file:

```bash
# Paste your full service account JSON (single line)
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project",...}'
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

Start the backend server (required for API calls):

```bash
npx tsx server.ts
```

In a separate terminal, start the frontend dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Vite dev server proxies `/api/*` requests to the backend on port 8080.

## Deploy with Docker

```bash
docker build -t concordia .

docker run -p 8080:8080 \
  -e GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
  -e GOOGLE_CLOUD_PROJECT=your-project-id \
  -e GOOGLE_CLOUD_LOCATION=us-central1 \
  concordia
```

## Deploy to Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/concordia

# Deploy (pass credentials as env var)
gcloud run deploy concordia \
  --image gcr.io/YOUR_PROJECT/concordia \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT,GOOGLE_CLOUD_LOCATION=us-central1" \
  --set-secrets "GOOGLE_SERVICE_ACCOUNT_JSON=concordia-sa-key:latest"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes* | Full JSON content of your GCP service account key |
| `GOOGLE_CLOUD_PROJECT` | Yes* | Google Cloud project ID |
| `GOOGLE_CLOUD_LOCATION` | No | Vertex AI region (default: `us-central1`) |
| `USE_VERTEX_AI` | No | Set to `false` to use a Gemini API key instead |
| `GEMINI_API_KEY` | No | Required only if `USE_VERTEX_AI=false` |
| `MODEL_LIVE` | No | Live audio model (default: `gemini-2.0-flash-live-001`) |
| `MODEL_TEXT` | No | Text/chat model (default: `gemini-2.0-flash`) |
| `MODEL_TTS` | No | TTS model (default: `gemini-2.5-flash-preview-tts`) |
| `MODEL_TRANSCRIBE` | No | Transcription model (default: `gemini-2.0-flash`) |

\* Not required if `USE_VERTEX_AI=false` and `GEMINI_API_KEY` is provided.

## License

Apache-2.0
