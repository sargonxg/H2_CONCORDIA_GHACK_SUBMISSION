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

  ws.on("message", async (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "start") {
        sessionClosing = false;
        const { context, mediatorProfile, partyNames } = msg;

        liveSession = await createLiveSession(
          {
            onopen: () => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "open" }));
              }
            },
            onmessage: (message: any) => {
              if (sessionClosing) return;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "message", data: message }));
              }
            },
            onerror: (err: any) => {
              console.error("Live session error:", err);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    error: String(err?.message || err),
                  }),
                );
              }
            },
            onclose: () => {
              sessionClosing = true;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "close" }));
              }
            },
          },
          context || "",
          mediatorProfile || { voice: "Zephyr", approach: "Facilitative" },
          partyNames || { partyA: "Party A", partyB: "Party B" },
        );
      } else if (msg.type === "audio" && liveSession && !sessionClosing) {
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
