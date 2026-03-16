import { createServer } from "http";
import next from "next";
import { WebSocket, WebSocketServer } from "ws";
import { parse } from "url";
import { handleWebSocketConnection } from "./lib/ws-handler";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const PORT = parseInt(process.env.PORT || "8080", 10);

function validateEnvironment() {
  const useVertexAI = process.env.USE_VERTEX_AI !== "false";
  const warnings: string[] = [];
  const errors: string[] = [];

  if (useVertexAI) {
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
      !process.env.GOOGLE_APPLICATION_CREDENTIALS
    ) {
      errors.push(
        "Vertex AI mode requires GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS",
      );
    }
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      warnings.push("GOOGLE_CLOUD_PROJECT not set — using default");
    }
  } else {
    if (!process.env.GEMINI_API_KEY) {
      errors.push("API key mode requires GEMINI_API_KEY");
    }
  }

  // Warn about deprecated model strings
  const modelLive = process.env.MODEL_LIVE || "";
  if (modelLive.includes("09-2025") || modelLive.includes("preview-native-audio-09")) {
    errors.push(
      `MODEL_LIVE is set to deprecated model "${modelLive}" which is being removed March 19, 2026. ` +
      `Update to "gemini-live-2.5-flash-native-audio" (Vertex AI) or "gemini-2.5-flash-native-audio-preview-12-2025" (API key).`
    );
  }

  if (errors.length > 0) {
    console.error("❌ Configuration errors:");
    errors.forEach((e) => console.error(`   ${e}`));
    console.error("\nSee .env.example for required variables.\n");
    process.exit(1);
  }

  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn(`⚠️  ${w}`));
  }
}

const app = next({ dev, hostname, port: PORT });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  validateEnvironment();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Use noServer mode so we can selectively route WebSocket upgrades.
  // This prevents the ws library from rejecting Next.js HMR connections
  // (which go to /_next/webpack-hmr) with a 400 status.
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", handleWebSocketConnection);

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "");
    if (pathname === "/api/live") {
      wss.handleUpgrade(req, socket as any, head, (client) => {
        wss.emit("connection", client, req);
      });
    }
    // All other upgrade requests (e.g. Next.js HMR /_next/webpack-hmr)
    // are intentionally NOT handled here — Next.js registers its own
    // upgrade listener inside app.prepare() and will pick them up.
  });

  const shutdown = async () => {
    console.log("\n🕊  CONCORDIA shutting down gracefully...");

    // Notify and close all active WebSocket connections
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "close" }));
        client.close(1001, "Server shutting down");
      }
    });

    // Close HTTP server (stops accepting new connections)
    server.close(() => {
      console.log("   HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10 s if graceful shutdown stalls
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  server.listen(PORT, hostname, () => {
    const authMode =
      process.env.USE_VERTEX_AI !== "false" ? "Vertex AI" : "Gemini API Key";
    console.log(`\n🕊  CONCORDIA running on http://${hostname}:${PORT}`);
    console.log(`   Auth mode : ${authMode}`);
    console.log(`   Env       : ${process.env.NODE_ENV ?? "development"}\n`);
  });
});
