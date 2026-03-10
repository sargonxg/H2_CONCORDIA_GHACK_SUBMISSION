import { WebSocket } from "ws";
import { createLiveSession } from "./ai-service";

export function handleWebSocketConnection(ws: WebSocket) {
  let liveSession: any = null;
  let sessionClosing = false;
  let toolCallPending = false;
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
            reconnectAttempts = 0;
            toolCallPending = false;
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

            // Gate audio when a tool call is pending — prevents 1008 policy violation
            if (message.toolCall) {
              console.log("[Live] Tool call received, gating audio input");
              toolCallPending = true;
            }

            // Log message types for debugging
            const types = [];
            if (message.serverContent) types.push("serverContent");
            if (message.toolCall) types.push("toolCall");
            if (message.sessionResumptionUpdate) types.push("sessionResumption");
            if (message.goAway) types.push("goAway");
            if (types.length > 0) console.log(`[Live] Gemini msg: ${types.join(", ")}`);

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
        // Drop audio frames while a tool call is pending to prevent 1008 errors
        if (!liveSession || toolCallPending) return;
        try {
          liveSession.sendRealtimeInput({
            audio: msg.audio,
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
        } finally {
          console.log("[Live] Tool response sent, re-enabling audio input");
          toolCallPending = false;
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
}
