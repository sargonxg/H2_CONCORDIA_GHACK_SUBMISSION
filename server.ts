import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import {
  createLiveSession,
  transcribeAudio,
  generateSpeech,
  chatWithAdvisor,
  analyzePathways,
  extractPrimitives,
  researchGrounding,
} from "./aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.json({ limit: "50mb" }));

// ── REST API Routes ──

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const text = await chatWithAdvisor(message, history);
    res.json({ text });
  } catch (error: any) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const { base64Audio, mimeType } = req.body;
    const text = await transcribeAudio(base64Audio, mimeType);
    res.json({ text });
  } catch (error: any) {
    console.error("Transcribe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    const audio = await generateSpeech(text, voiceName);
    res.json({ audio });
  } catch (error: any) {
    console.error("TTS error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/extract", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await extractPrimitives(text);
    res.json({ result });
  } catch (error: any) {
    console.error("Extract error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { transcript, caseStructure } = req.body;
    const result = await analyzePathways(transcript, caseStructure);
    res.json({ result });
  } catch (error: any) {
    console.error("Analyze error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/research", async (req, res) => {
  try {
    const { query } = req.body;
    const result = await researchGrounding(query);
    res.json(result);
  } catch (error: any) {
    console.error("Research error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── WebSocket for Live Audio Sessions ──

const wss = new WebSocketServer({ server, path: "/api/live" });

wss.on("connection", (ws: WebSocket) => {
  let liveSession: any = null;
  let sessionClosing = false;
  let latestResumptionHandle: string | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 3;
  // Store params for reconnection
  let sessionParams: {
    context: string;
    mediatorProfile: any;
    partyNames: any;
  } | null = null;

  const tryReconnect = (reason: string) => {
    if (sessionClosing || !latestResumptionHandle) return false;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`[Live] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached after ${reason}`);
      sessionClosing = true;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "close" }));
      }
      return false;
    }
    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 4000);
    console.log(`[Live] ${reason}, reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "reconnecting" }));
    }
    setTimeout(() => {
      if (!sessionClosing) {
        connectLiveSession(latestResumptionHandle!);
      }
    }, delay);
    return true;
  };

  const connectLiveSession = async (resumptionHandle?: string) => {
    const params = sessionParams!;
    try {
      liveSession = await createLiveSession(
        {
          onopen: () => {
            console.log("[Live] Session opened" + (resumptionHandle ? " (resumed)" : ""));
            reconnectAttempts = 0; // Reset on successful connection
            if (ws.readyState === WebSocket.OPEN) {
              if (resumptionHandle) {
                ws.send(JSON.stringify({ type: "reconnected" }));
              } else {
                ws.send(JSON.stringify({ type: "open" }));
              }
            }
          },
          onmessage: (message: any) => {
            if (sessionClosing) return;

            // Track session resumption handles for reconnection
            // Only update when session is resumable (not during function calls or generation)
            if (message.sessionResumptionUpdate) {
              if (message.sessionResumptionUpdate.resumable && message.sessionResumptionUpdate.newHandle) {
                latestResumptionHandle = message.sessionResumptionUpdate.newHandle;
              }
            }

            // Handle goAway: server is about to disconnect, reconnect proactively
            if (message.goAway) {
              console.log("[Live] Received goAway, will reconnect");
              tryReconnect("goAway received");
              return;
            }

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "message", data: message }));
            }
          },
          onerror: (err: any) => {
            console.error("[Live] Session error:", err);
            if (!tryReconnect("session error")) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    error: String(err?.message || err),
                  }),
                );
              }
            }
          },
          onclose: (e: any) => {
            console.log(`[Live] Session closed by server (code=${e?.code} reason=${e?.reason || "none"})`);
            if (!tryReconnect("unexpected close")) {
              sessionClosing = true;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "close" }));
              }
            }
          },
        },
        params.context,
        params.mediatorProfile,
        params.partyNames,
        resumptionHandle,
      );
    } catch (err: any) {
      console.error("[Live] Failed to create session:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "error",
            error: `Failed to connect to Live API: ${err?.message || err}`,
          }),
        );
      }
    }
  };

  ws.on("message", async (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "start") {
        sessionClosing = false;
        latestResumptionHandle = null;
        sessionParams = {
          context: msg.context || "",
          mediatorProfile: msg.mediatorProfile || {
            voice: "Zephyr",
            approach: "Facilitative",
          },
          partyNames: msg.partyNames || {
            partyA: "Party A",
            partyB: "Party B",
          },
        };
        await connectLiveSession(msg.resumptionHandle);
      } else if (msg.type === "audio" && !sessionClosing) {
        if (!liveSession) return; // Session not ready yet, drop frame
        try {
          liveSession.sendRealtimeInput({
            media: msg.media,
          });
        } catch (e) {
          // Session may have closed
        }
      } else if (
        msg.type === "toolResponse" &&
        liveSession &&
        !sessionClosing
      ) {
        try {
          liveSession.sendToolResponse({
            functionResponses: msg.functionResponses,
          });
        } catch (e) {
          // Session may have closed
        }
      } else if (msg.type === "close") {
        sessionClosing = true;
        if (liveSession) {
          try {
            liveSession.close();
          } catch (e) {
            // ignore
          }
          liveSession = null;
        }
      } else if (msg.type === "ping") {
        // Keep-alive ping from client — respond with pong
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  });

  ws.on("close", () => {
    sessionClosing = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
      liveSession = null;
    }
  });
});

// ── Static Files & SPA Fallback ──

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = parseInt(process.env.PORT || "8080", 10);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CONCORDIA server listening on port ${PORT}`);
  console.log(
    `Vertex AI: ${process.env.USE_VERTEX_AI !== "false" ? "enabled" : "disabled"}`,
  );
});
