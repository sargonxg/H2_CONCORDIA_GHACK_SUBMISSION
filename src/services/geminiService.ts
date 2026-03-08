// Frontend service — all AI calls go through our backend API.
// Live audio uses WebSocket; everything else uses REST.

// ── Live Audio Session (WebSocket proxy) ──

export const getLiveSession = (
  callbacks: any,
  context: string = "",
  mediatorProfile: any = { voice: "Zephyr", approach: "Facilitative" },
  partyNames: { partyA: string; partyB: string } = {
    partyA: "Party A",
    partyB: "Party B",
  },
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${location.host}/api/live`;

    let ws: WebSocket;
    let resolved = false;
    let intentionallyClosed = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    // The session handle returned to the caller — wraps the WebSocket
    let sessionHandle: any = null;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        reconnectAttempts = 0; // Reset on successful connection
        ws.send(
          JSON.stringify({
            type: "start",
            context,
            mediatorProfile,
            partyNames,
          }),
        );
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "open" && !resolved) {
            resolved = true;
            callbacks.onopen?.();
            sessionHandle = {
              sendRealtimeInput: (input: any) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({ type: "audio", media: input.media }),
                  );
                }
              },
              sendToolResponse: (resp: any) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "toolResponse",
                      functionResponses: resp.functionResponses,
                    }),
                  );
                }
              },
              close: () => {
                intentionallyClosed = true;
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "close" }));
                }
                ws.close();
              },
            };
            resolve(sessionHandle);
          } else if (msg.type === "reconnected") {
            // Server successfully reconnected the Gemini session
            console.log("[Live] Server reconnected session successfully");
            callbacks.onreconnected?.();
          } else if (msg.type === "message") {
            callbacks.onmessage?.(msg.data);
          } else if (msg.type === "goAway") {
            console.log(
              "[Live] Server sent goAway, reconnection in progress...",
            );
            callbacks.onreconnecting?.();
          } else if (msg.type === "reconnecting") {
            console.log("[Live] Server is reconnecting session...");
            callbacks.onreconnecting?.();
          } else if (msg.type === "error") {
            if (!resolved) {
              resolved = true;
              reject(new Error(msg.error));
            }
            // Don't call onerror for recoverable errors — the server may reconnect
            console.error("[Live] Server error:", msg.error);
          } else if (msg.type === "close") {
            callbacks.onclose?.();
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e);
        }
      };

      ws.onerror = (err: Event) => {
        console.error("[Live] WebSocket error:", err);
        if (!resolved) {
          resolved = true;
          reject(new Error("WebSocket connection failed"));
        }
        // Don't call callbacks.onerror here — onclose will fire next and handle reconnection
      };

      ws.onclose = () => {
        if (intentionallyClosed) {
          // User explicitly stopped the session
          callbacks.onclose?.();
          return;
        }

        if (!resolved) {
          resolved = true;
          reject(new Error("WebSocket closed before session started"));
          return;
        }

        // Unexpected close — attempt client-side WebSocket reconnection
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 8000);
          console.log(
            `[Live] WebSocket closed unexpectedly, reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
          );
          callbacks.onreconnecting?.();
          setTimeout(() => {
            if (!intentionallyClosed) {
              connectWs();
            }
          }, delay);
        } else {
          console.error("[Live] Max reconnection attempts reached");
          callbacks.onclose?.();
        }
      };
    };

    connectWs();
  });
};

// ── REST API helpers ──

async function apiPost(endpoint: string, body: any): Promise<any> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Transcription ──

export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string,
): Promise<string> => {
  const data = await apiPost("/api/transcribe", { base64Audio, mimeType });
  return data.text;
};

// ── Text-to-Speech ──

export const generateSpeech = async (
  text: string,
  voiceName: string = "Kore",
): Promise<string | undefined> => {
  const data = await apiPost("/api/tts", { text, voiceName });
  return data.audio;
};

// ── Advisor Chat ──

export const chatWithAdvisor = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
): Promise<string> => {
  const data = await apiPost("/api/chat", { message, history });
  return data.text;
};

// ── Pathway Analysis ──

export const analyzePathways = async (
  transcript: string,
  caseStructure: string,
): Promise<string> => {
  const data = await apiPost("/api/analyze", { transcript, caseStructure });
  return data.result;
};

// ── Primitive Extraction ──

export const extractPrimitives = async (text: string): Promise<string> => {
  const data = await apiPost("/api/extract", { text });
  return data.result;
};

// ── Research Grounding ──

export const researchGrounding = async (
  query: string,
): Promise<{ text: string; chunks: any }> => {
  return apiPost("/api/research", { query });
};
