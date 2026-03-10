import { createServer } from "http";
import next from "next";
import { WebSocketServer } from "ws";
import { parse } from "url";
import { handleWebSocketConnection } from "./lib/ws-handler";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const PORT = parseInt(process.env.PORT || "8080", 10);

const app = next({ dev, hostname, port: PORT });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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

  server.listen(PORT, hostname, () => {
    const authMode = process.env.USE_VERTEX_AI !== "false" ? "Vertex AI" : "Gemini API Key";
    console.log(`\n🕊  CONCORDIA running on http://${hostname}:${PORT}`);
    console.log(`   Auth mode : ${authMode}`);
    console.log(`   Env       : ${process.env.NODE_ENV ?? "development"}\n`);
  });
});
