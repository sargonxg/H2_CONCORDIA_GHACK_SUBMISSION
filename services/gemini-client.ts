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

    let resolved = false;
    let intentionallyClosed = false;

    const ws = new WebSocket(wsUrl);

    // Keep-alive ping every 25 seconds to prevent proxy/load-balancer timeouts
    let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
    const startKeepAlive = () => {
      keepAliveInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };
    const stopKeepAlive = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    };

    ws.onopen = () => {
      console.log("[Live] WebSocket connected to server");
      ws.send(
        JSON.stringify({
          type: "start",
          context,
          mediatorProfile,
          partyNames,
          createRoom: (callbacks as any).createRoom ?? false,
          caseId: (callbacks as any).caseId,
        }),
      );
      startKeepAlive();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "roomCreated" && !resolved) {
          // Room mode: server created a room, session will open separately
          callbacks.onRoomCreated?.(msg.roomCode);
        } else if (msg.type === "open" && !resolved) {
          resolved = true;
          // Build the session handle object first, resolve the Promise with it,
          // THEN fire onopen — this guarantees sessionRef.current is set in the
          // caller before onopen's startAudioCapture() tries to use it.
          const sessionHandle = {
            sendRealtimeInput: (input: any) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: "audio", audio: input.audio }),
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
            sendContext: (text: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "context", text }));
              }
            },
            startCaucus: (partyId: 'A' | 'B') => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: "caucus", action: "start", partyId }),
                );
              }
            },
            endCaucus: (summary?: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: "caucus", action: "end", summary }),
                );
              }
            },
            setInterruptionMode: (mode: 'normal' | 'crisis') => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: "setInterruptionMode", mode }),
                );
              }
            },
            correctSpeaker: (name: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({ type: "correctSpeaker", name }),
                );
              }
            },
            close: () => {
              intentionallyClosed = true;
              stopKeepAlive();
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "close" }));
              }
              ws.close();
            },
          };
          // Resolve FIRST so the caller's await completes and sessionRef.current
          // is set synchronously in the microtask queue before onopen's
          // startAudioCapture() fires — eliminates the race condition where
          // early audio frames are dropped because the session ref is null.
          resolve(sessionHandle);
          callbacks.onopen?.();
        } else if (msg.type === "reconnected") {
          // Server successfully reconnected the Gemini session via resumption handle
          console.log("[Live] Server reconnected session successfully");
          callbacks.onreconnected?.();
        } else if (msg.type === "message") {
          callbacks.onmessage?.(msg.data);
        } else if (msg.type === "goAway" || msg.type === "reconnecting") {
          console.log(`[Live] Server sent ${msg.type}`);
          callbacks.onreconnecting?.();
        } else if (msg.type === "caucusStarted") {
          console.log(`[Live] Caucus started with Party ${msg.partyId}`);
          callbacks.onCaucusStarted?.(msg.partyId);
        } else if (msg.type === "caucusEnded") {
          console.log("[Live] Caucus ended");
          callbacks.onCaucusEnded?.();
        } else if (msg.type === "interruptionModeChanged") {
          console.log(`[Live] Interruption mode changed to: ${msg.mode}`);
          callbacks.onInterruptionModeChanged?.(msg.mode);
        } else if (msg.type === "silenceDetected") {
          callbacks.onSilenceDetected?.(msg.data);
        } else if (msg.type === "lowAudio") {
          callbacks.onLowAudio?.(msg.data);
        } else if (msg.type === "speakerBalance") {
          callbacks.onSpeakerBalance?.(msg.data);
        } else if (msg.type === "thought") {
          callbacks.onthought?.(msg.text);
        } else if (msg.type === "groundingUpdate") {
          callbacks.onGroundingUpdate?.(msg.data);
        } else if (msg.type === "error") {
          console.error("[Live] Server error:", msg.error);
          if (!resolved) {
            resolved = true;
            stopKeepAlive();
            reject(new Error(msg.error));
          }
          // Don't kill the session — server may auto-reconnect
        } else if (msg.type === "close") {
          stopKeepAlive();
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
        stopKeepAlive();
        reject(new Error("WebSocket connection failed"));
      }
    };

    ws.onclose = (event: CloseEvent) => {
      console.log(`[Live] WebSocket closed: code=${event.code} reason=${event.reason}`);
      stopKeepAlive();
      if (!resolved) {
        resolved = true;
        reject(new Error("WebSocket closed before session started"));
        return;
      }
      if (!intentionallyClosed) {
        // Unexpected close — notify the UI
        callbacks.onclose?.();
      }
    };
  });
};

// ── Room join (separate device) ───────────────────────────────────────────────
export const joinRoomSession = (
  roomCode: string,
  name: string,
  callbacks: {
    onJoined?: (partyId: string) => void;
    onPartyJoined?: (partyId: string, name: string) => void;
    onmessage?: (data: any) => void;
    onclose?: () => void;
    onerror?: (err: string) => void;
  },
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${location.host}/api/live`;
    let resolved = false;

    const ws = new WebSocket(wsUrl);
    let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", roomCode: roomCode.toUpperCase(), name }));
      keepAliveInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25000);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "joined" && !resolved) {
          resolved = true;
          const handle = {
            sendRealtimeInput: (input: any) => {
              if (ws.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ type: "audio", audio: input.audio }));
            },
            sendToolResponse: (resp: any) => {
              if (ws.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ type: "toolResponse", functionResponses: resp.functionResponses }));
            },
            sendContext: (text: string) => {
              if (ws.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ type: "context", text }));
            },
            close: () => {
              if (keepAliveInterval) clearInterval(keepAliveInterval);
              if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "close" }));
              ws.close();
            },
          };
          resolve(handle);
          callbacks.onJoined?.(msg.partyId);
        } else if (msg.type === "partyJoined") {
          callbacks.onPartyJoined?.(msg.partyId, msg.name);
        } else if (msg.type === "message") {
          callbacks.onmessage?.(msg.data);
        } else if (msg.type === "error") {
          if (!resolved) { resolved = true; reject(new Error(msg.error)); }
          callbacks.onerror?.(msg.error);
        } else if (msg.type === "close") {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
          callbacks.onclose?.();
        }
      } catch (e) {
        console.error("Room WS parse error:", e);
      }
    };

    ws.onerror = () => {
      if (!resolved) { resolved = true; reject(new Error("Room WebSocket failed")); }
    };
    ws.onclose = () => {
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (!resolved) { resolved = true; reject(new Error("Room WebSocket closed")); }
      else callbacks.onclose?.();
    };
  });
};

// ── REST API helpers ──

async function apiPost(endpoint: string, body: any, retries = 3): Promise<any> {
  const delays = [5000, 10000, 20000];
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < retries) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
      continue;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `API error ${res.status}`);
    }
    return res.json();
  }
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
  caseContext?: string,
): Promise<string> => {
  const data = await apiPost("/api/chat", { message, history, caseContext });
  return data.text;
};

// ── Pathway Analysis ──

export const analyzePathways = async (
  transcript: string,
  caseStructure: string,
  framework?: string,
): Promise<string> => {
  const data = await apiPost("/api/analyze", { transcript, caseStructure, framework });
  return data.result;
};

// ── Case Summary ──

export const summarizeCase = async (caseData: {
  transcript: string;
  actors: any[];
  primitives: any[];
  commonGround: string[];
  tensionPoints: string[];
}): Promise<string> => {
  const data = await apiPost("/api/summarize", caseData);
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

// ── Document Processing ──

export const processDocument = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/process-document', { method: 'POST', body: formData });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).error || `Upload failed: ${res.status}`); }
  return (await res.json()).summary;
};

// ── Settlement Agreement ──

export const generateAgreementDoc = async (data: any): Promise<any> => {
  return (await apiPost('/api/generate-agreement', data)).agreement;
};

// ── Background Common Ground Analysis ──

export const analyzeCommonGround = async (data: {
  transcript: string;
  primitives: any[];
  actors: any[];
}): Promise<{ commonGround: string[]; tensionPoints: string[]; zopaHints: string[] }> => {
  return apiPost("/api/common-ground", data);
};
