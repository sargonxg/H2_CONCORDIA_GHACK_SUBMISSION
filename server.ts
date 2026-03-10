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

  // WebSocket server on /api/live — same port, same container
  const wss = new WebSocketServer({ server, path: "/api/live" });
  wss.on("connection", handleWebSocketConnection);

  server.listen(PORT, hostname, () => {
    console.log(`CONCORDIA running on port ${PORT}`);
    console.log(
      `Vertex AI: ${process.env.USE_VERTEX_AI !== "false" ? "enabled" : "disabled"}`,
    );
  });
});
