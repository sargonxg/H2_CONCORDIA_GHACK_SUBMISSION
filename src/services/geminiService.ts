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
    const ws = new WebSocket(`${protocol}//${location.host}/api/live`);

    let resolved = false;

    ws.onopen = () => {
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
          resolve({
            sendRealtimeInput: (input: any) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "audio", media: input.media }));
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
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "close" }));
              }
              ws.close();
            },
          });
        } else if (msg.type === "message") {
          callbacks.onmessage?.(msg.data);
        } else if (msg.type === "goAway") {
          // Server is about to disconnect but will reconnect automatically
          console.log("[Live] Server sent goAway, reconnection in progress...");
          callbacks.onreconnecting?.();
        } else if (msg.type === "reconnecting") {
          // Server is reconnecting with session resumption
          console.log("[Live] Server is reconnecting session...");
          callbacks.onreconnecting?.();
        } else if (msg.type === "error") {
          if (!resolved) {
            resolved = true;
            reject(new Error(msg.error));
          }
          callbacks.onerror?.(new Error(msg.error));
        } else if (msg.type === "close") {
          callbacks.onclose?.();
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    ws.onerror = (err: Event) => {
      if (!resolved) {
        resolved = true;
        reject(new Error("WebSocket connection failed"));
      }
      callbacks.onerror?.(err);
    };

    ws.onclose = () => {
      if (!resolved) {
        resolved = true;
        reject(new Error("WebSocket closed before session started"));
      }
      callbacks.onclose?.();
    };
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
