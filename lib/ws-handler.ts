import { WebSocket } from "ws";
import { createLiveSession } from "./ai-service";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  broadcastToRoom,
} from "./room-manager";
import { randomUUID } from "crypto";
import type { CaucusState, SpeakerTurn, SilenceEvent } from "./types";

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

  // ── Room mode state ──────────────────────────────────────────────────────
  let roomId: string | null = null;
  const clientId = randomUUID();

  // ── Caucus mode state ────────────────────────────────────────────────────
  let caucusState: CaucusState = { active: false, partyId: null, startedAt: null };
  let mainSession: any = null; // stores the shared session while caucus is active
  let mainResumptionHandle: string | null = null;

  // ── Output deduplication (prevents repetition loops) ──
  const recentOutputs: string[] = [];
  const MAX_RECENT_OUTPUTS = 5;

  const isDuplicateOutput = (text: string): boolean => {
    if (!text || text.length < 20) return false;
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
    const isDupe = recentOutputs.some((recent) => {
      const recentNorm = recent.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
      return normalized === recentNorm ||
             (normalized.length > 30 && recentNorm.startsWith(normalized.slice(0, 30)));
    });
    if (!isDupe) {
      recentOutputs.push(normalized);
      if (recentOutputs.length > MAX_RECENT_OUTPUTS) recentOutputs.shift();
    }
    return isDupe;
  };

  // ── Speaker balance tracking ─────────────────────────────────────────────
  const speakerTurns: SpeakerTurn[] = [];
  let currentSpeaker: string | null = null;
  let currentSpeakerStart: number = 0;
  const SPEAKER_BALANCE_RATIO = 3; // warn if one party speaks 3x more

  const trackSpeakerTurn = (speaker: string) => {
    const now = Date.now();
    if (currentSpeaker && currentSpeaker !== speaker) {
      // End the previous speaker's turn
      const turn: SpeakerTurn = {
        speaker: currentSpeaker,
        startTime: currentSpeakerStart,
        endTime: now,
        durationMs: now - currentSpeakerStart,
      };
      speakerTurns.push(turn);
      checkSpeakerBalance();
    }
    if (currentSpeaker !== speaker) {
      currentSpeaker = speaker;
      currentSpeakerStart = now;
    }
  };

  const checkSpeakerBalance = () => {
    if (!sessionParams?.partyNames || !liveSession) return;
    const { partyA, partyB } = sessionParams.partyNames;
    const aDuration = speakerTurns
      .filter((t) => t.speaker === partyA)
      .reduce((sum, t) => sum + t.durationMs, 0);
    const bDuration = speakerTurns
      .filter((t) => t.speaker === partyB)
      .reduce((sum, t) => sum + t.durationMs, 0);

    if (aDuration === 0 || bDuration === 0) return;
    const ratio = Math.max(aDuration, bDuration) / Math.min(aDuration, bDuration);

    if (ratio >= SPEAKER_BALANCE_RATIO) {
      const dominant = aDuration > bDuration ? partyA : partyB;
      const quiet = aDuration > bDuration ? partyB : partyA;
      console.log(`[Live] Speaker imbalance: ${dominant} has spoken ${ratio.toFixed(1)}x more than ${quiet}`);
      try {
        liveSession.sendClientContent({
          turns: [{
            role: "user",
            parts: [{
              text: `[SYSTEM CONTEXT UPDATE] Speaker balance alert: ${dominant} has spoken approximately ${ratio.toFixed(1)}x more than ${quiet}. Consider directing your next question to ${quiet} to ensure balanced participation.`,
            }],
          }],
          turnComplete: true,
        });
      } catch (e) {
        console.warn("[Live] Failed to inject speaker balance note:", e);
      }
      // Send balance update to client
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "speakerBalance",
          data: {
            [partyA]: aDuration,
            [partyB]: bDuration,
            ratio: ratio.toFixed(1),
            dominant,
          },
        }));
      }
    }
  };

  // ── Silence tracking ─────────────────────────────────────────────────────
  let lastAudioTime: number = Date.now();
  let lastModelOutputHadQuestion = false;
  let silenceTimer5s: ReturnType<typeof setTimeout> | null = null;
  let silenceTimer15s: ReturnType<typeof setTimeout> | null = null;

  const resetSilenceTracking = () => {
    lastAudioTime = Date.now();
    if (silenceTimer5s) { clearTimeout(silenceTimer5s); silenceTimer5s = null; }
    if (silenceTimer15s) { clearTimeout(silenceTimer15s); silenceTimer15s = null; }

    // Start new silence timers
    silenceTimer5s = setTimeout(() => {
      if (sessionClosing || !liveSession) return;
      const silenceDuration = Date.now() - lastAudioTime;
      if (silenceDuration >= 5000) {
        const event: SilenceEvent = {
          durationMs: silenceDuration,
          afterQuestion: lastModelOutputHadQuestion,
          suggestedAction: lastModelOutputHadQuestion
            ? "Party may be reflecting — hold space"
            : "Consider a gentle prompt to re-engage",
        };
        console.log(`[Live] Silence detected: ${silenceDuration}ms (afterQuestion=${event.afterQuestion})`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "silenceDetected", data: event }));
        }
      }
    }, 5000);

    silenceTimer15s = setTimeout(() => {
      if (sessionClosing || !liveSession) return;
      const silenceDuration = Date.now() - lastAudioTime;
      if (silenceDuration >= 15000) {
        console.log(`[Live] Extended silence (${silenceDuration}ms) — injecting gentle prompt`);
        try {
          liveSession.sendClientContent({
            turns: [{
              role: "user",
              parts: [{
                text: `[SYSTEM CONTEXT UPDATE] Extended silence detected (${Math.round(silenceDuration / 1000)}s). The parties may need a gentle prompt or the conversation may have reached a natural pause. Consider checking in with a brief, warm prompt like "Take your time" or redirecting to the next topic.`,
              }],
            }],
            turnComplete: true,
          });
        } catch (e) {
          console.warn("[Live] Failed to inject silence prompt:", e);
        }
      }
    }, 15000);
  };

  // ── Audio level monitoring (RMS) ─────────────────────────────────────────
  const LOW_AUDIO_THRESHOLD = 0.005; // RMS threshold for "too quiet"
  let lowAudioWarningCount = 0;
  const MAX_LOW_AUDIO_WARNINGS = 3; // Don't spam warnings

  const computeRMS = (base64Audio: string): number => {
    try {
      const buffer = Buffer.from(base64Audio, "base64");
      // Assume 16-bit PCM audio
      let sumSquares = 0;
      const sampleCount = Math.floor(buffer.length / 2);
      if (sampleCount === 0) return 0;
      for (let i = 0; i < buffer.length - 1; i += 2) {
        const sample = buffer.readInt16LE(i) / 32768; // normalize to -1..1
        sumSquares += sample * sample;
      }
      return Math.sqrt(sumSquares / sampleCount);
    } catch {
      return 0;
    }
  };

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

  const connectLiveSession = async (
    resumptionHandle?: string,
    caucusConfig?: { partyId: 'A' | 'B' },
  ) => {
    const params = sessionParams!;
    try {
      liveSession = await createLiveSession(
        {
          onopen: () => {
            console.log("[Live] Session opened" + (resumptionHandle ? " (resumed)" : "") + (caucusConfig ? ` (caucus party${caucusConfig.partyId})` : ""));
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

            // Gate audio when a tool call is pending — prevents 1008 policy violation.
            // Safety: auto-clear after 8 s in case the browser never sends a tool response
            // (e.g. tab hidden, JS freeze) — avoids permanently blocking the audio stream.
            if (message.toolCall) {
              console.log("[Live] Tool call received, gating audio input");
              toolCallPending = true;
              setTimeout(() => {
                if (toolCallPending) {
                  console.warn("[Live] Tool response not received within 8s — re-enabling audio");
                  toolCallPending = false;
                }
              }, 8000);
            }

            // Handle thinking content — log and forward thought summaries to frontend
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.thought) {
                  console.log('[Live] Model thought:', part.text?.substring(0, 200));
                  // Forward thought summaries to frontend for the Mediator Playbook panel
                  if (part.text && ws.readyState === WebSocket.OPEN) {
                    const thoughtMsg = { type: "thought", text: part.text };
                    if (roomId) {
                      const room = getRoom(roomId);
                      if (room) broadcastToRoom(room, thoughtMsg);
                    } else {
                      ws.send(JSON.stringify(thoughtMsg));
                    }
                  }
                }
              }
            }

            // Log barge-in events for debugging
            if (message.serverContent?.interrupted) {
              console.log("[Live] Barge-in: user interrupted model generation");
            }

            // ── Speaker tracking from input transcription ──
            if (message.serverContent?.inputTranscription?.text) {
              const transcript = message.serverContent.inputTranscription.text;
              // Try to detect speaker from transcript content (model often prefixes with name)
              if (sessionParams?.partyNames) {
                const { partyA, partyB } = sessionParams.partyNames;
                if (transcript.toLowerCase().includes(partyA.toLowerCase())) {
                  trackSpeakerTurn(partyA);
                } else if (transcript.toLowerCase().includes(partyB.toLowerCase())) {
                  trackSpeakerTurn(partyB);
                }
              }
            }

            // ── Track if model output contains a question (for silence detection) ──
            if (message.serverContent?.outputTranscription?.text) {
              const outText = message.serverContent.outputTranscription.text;
              lastModelOutputHadQuestion = outText.includes("?");

              // Detect repetition loop and break it
              if (isDuplicateOutput(outText) && outText.length > 30) {
                console.warn("[Live] Repetition loop detected — injecting correction");
                try {
                  liveSession.sendClientContent({
                    turns: [{ role: "user", parts: [{
                      text: "[SYSTEM ALERT: You are repeating yourself. STOP. Say something completely new. Ask a NEW question you have not asked before. Do NOT repeat ground rules or greetings.]"
                    }] }],
                    turnComplete: true,
                  });
                } catch (e) {
                  console.warn("[Live] Failed to inject repetition correction:", e);
                }
              }
            }

            // ── Speaker identification from tool calls ──
            if (message.toolCall?.functionCalls) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === "speakerIdentified" && fc.args?.speaker) {
                  trackSpeakerTurn(fc.args.speaker);
                }
              }
            }

            // ── Google Search grounding metadata ──
            if (message.serverContent?.groundingMetadata) {
              const { webSearchQueries, groundingChunks, groundingSupports } =
                message.serverContent.groundingMetadata;
              const groundingMsg = {
                type: "groundingUpdate",
                data: {
                  queries: webSearchQueries,
                  sources: groundingChunks,
                  supports: groundingSupports,
                },
              };
              // Send to frontend alongside the regular message
              if (roomId) {
                const room = getRoom(roomId);
                if (room) broadcastToRoom(room, groundingMsg);
              } else if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(groundingMsg));
              }
            }

            // Log message types for debugging
            const types = [];
            if (message.serverContent) types.push("serverContent");
            if (message.toolCall) types.push("toolCall");
            if (message.sessionResumptionUpdate) types.push("sessionResumption");
            if (message.goAway) types.push("goAway");
            if (message.serverContent?.groundingMetadata) types.push("grounding");
            // Log activity/speech detection events for VAD tuning
            if (message.serverContent?.interrupted) {
              types.push("interrupted");
            }
            if (message.serverContent?.turnComplete) {
              types.push("turnComplete");
            }
            if (types.length > 0) console.log(`[Live] Gemini msg: ${types.join(", ")}`);

            // In room mode: broadcast to ALL room clients; otherwise 1:1
            if (roomId) {
              const room = getRoom(roomId);
              if (room) {
                broadcastToRoom(room, { type: "message", data: message });
              }
            } else if (ws.readyState === WebSocket.OPEN) {
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
            const code = e?.code ?? "?";
            const reason = e?.reason || "none";
            // Common close codes:
            //   1000 = normal closure    1001 = going away
            //   1006 = abnormal (no close frame received — network drop)
            //   1008 = policy violation  (e.g. audio sent during tool call)
            //   1011 = internal server error (config rejected, quota, etc.)
            console.log(`[Live] Session closed — code=${code} reason="${reason}"`);
            if (code === 1011 || (code !== 1000 && code !== 1001)) {
              console.warn(`[Live] Abnormal close (${code}) — check API key, model access, and session config`);
            }
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
        caucusConfig,
      );
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      console.error("[Live] Failed to create session:", errMsg);

      // ── Graceful fallback: if 1008 policy violation, retry with minimal config ──
      // This catches cases where a feature (like googleSearch combined with
      // functionDeclarations) is rejected by the model version.
      if (errMsg.includes("1008") || errMsg.includes("policy") || errMsg.includes("not supported")) {
        console.warn("[Live] Session rejected — retrying with minimal config (no googleSearch)...");
        try {
          liveSession = await createLiveSession(
            {
              onopen: () => {
                console.log("[Live] Session opened (fallback mode — no Google Search)");
                reconnectAttempts = 0;
                toolCallPending = false;
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "open" }));
                  ws.send(JSON.stringify({ type: "featureUnavailable", feature: "googleSearch" }));
                }
              },
              onmessage: (message: any) => {
                if (sessionClosing) return;
                if (message.sessionResumptionUpdate) {
                  if (message.sessionResumptionUpdate.resumable && message.sessionResumptionUpdate.newHandle) {
                    latestResumptionHandle = message.sessionResumptionUpdate.newHandle;
                  }
                }
                if (message.goAway) { tryReconnect("goAway received"); return; }
                if (message.toolCall) {
                  toolCallPending = true;
                  setTimeout(() => { if (toolCallPending) { toolCallPending = false; } }, 8000);
                }
                if (message.serverContent?.interrupted) {
                  console.log("[Live] Barge-in: user interrupted model generation");
                }
                const types: string[] = [];
                if (message.serverContent) types.push("serverContent");
                if (message.toolCall) types.push("toolCall");
                if (types.length > 0) console.log(`[Live] Gemini msg (fallback): ${types.join(", ")}`);
                if (roomId) {
                  const room = getRoom(roomId);
                  if (room) broadcastToRoom(room, { type: "message", data: message });
                } else if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "message", data: message }));
                }
              },
              onerror: (e: any) => {
                console.error("[Live] Fallback session error:", e);
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "error", error: String(e?.message || e) }));
                }
              },
              onclose: (e: any) => {
                console.log(`[Live] Fallback session closed — code=${e?.code ?? "?"}`);
                sessionClosing = true;
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "close" }));
                }
              },
            },
            params.context,
            params.mediatorProfile,
            params.partyNames,
            resumptionHandle,
            caucusConfig,
            true, // skipGoogleSearch — fallback mode
          );
        } catch (fallbackErr: any) {
          console.error("[Live] Fallback also failed:", fallbackErr);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "error",
              error: `Failed to connect to Live API (even after fallback): ${fallbackErr?.message || fallbackErr}`,
            }));
          }
        }
        return;
      }

      // Non-policy error — report directly
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "error",
          error: `Failed to connect to Live API: ${errMsg}`,
        }));
      }
    }
  };

  ws.on("message", async (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "join") {
        // ── Room join: Party B (or observer) connects to existing room ──
        const code: string = (msg.roomCode || "").toUpperCase();
        const room = getRoom(code);
        if (!room) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "error", error: `Room ${code} not found` }));
          }
          return;
        }
        // Determine party: first joiner after creator is B, rest are observers
        const existingParties = Array.from(room.clients.values()).map((c) => c.partyId);
        const partyId: "A" | "B" | "observer" = existingParties.includes("B") ? "observer" : "B";
        roomId = code;
        joinRoom(code, clientId, ws, partyId, msg.name || "Party B");
        // Attach to room's shared Gemini session
        liveSession = room.geminiSession;
        sessionClosing = false;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "joined", roomCode: code, partyId, name: msg.name }));
        }
        broadcastToRoom(room, {
          type: "partyJoined",
          partyId,
          name: msg.name || "Party B",
        }, clientId);

      } else if (msg.type === "start") {
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

        // ── Room creation mode ──────────────────────────────────────────────
        if (msg.createRoom) {
          const room = createRoom(msg.caseId || "unknown");
          roomId = room.id;
          joinRoom(room.id, clientId, ws, "A", msg.partyNames?.partyA || "Party A");
          room.sessionParams = sessionParams;
          await connectLiveSession(msg.resumptionHandle);
          // geminiSession will be stored on room after connect
          room.geminiSession = liveSession;
          // Override open callback to include roomCode
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "roomCreated", roomCode: room.id }));
          }
        } else {
          await connectLiveSession(msg.resumptionHandle);
        }
      } else if (msg.type === "audio" && !sessionClosing) {
        // Drop audio frames while a tool call is pending to prevent 1008 errors
        if (!liveSession || toolCallPending) return;

        // Reset silence tracking on each audio frame
        resetSilenceTracking();

        // Audio level monitoring (RMS)
        if (msg.audio && lowAudioWarningCount < MAX_LOW_AUDIO_WARNINGS) {
          const rms = computeRMS(msg.audio);
          if (rms > 0 && rms < LOW_AUDIO_THRESHOLD) {
            lowAudioWarningCount++;
            console.log(`[Live] Low audio level detected: RMS=${rms.toFixed(4)} (warning ${lowAudioWarningCount}/${MAX_LOW_AUDIO_WARNINGS})`);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "lowAudio",
                data: { rms, warningCount: lowAudioWarningCount },
              }));
            }
          } else if (rms >= LOW_AUDIO_THRESHOLD) {
            // Reset warning count when audio is good
            lowAudioWarningCount = 0;
          }
        }

        try {
          liveSession.sendRealtimeInput({
            audio: msg.audio,
          });
        } catch (e) {
          // Session may have closed
        }
      } else if (msg.type === "caucus" && liveSession && !sessionClosing) {
        // ── Caucus mode: start or end private session ──
        if (msg.action === "start" && !caucusState.active) {
          const partyId: 'A' | 'B' = msg.partyId || 'A';
          console.log(`[Live] Starting caucus with Party ${partyId}`);
          caucusState = { active: true, partyId, startedAt: new Date().toISOString() };

          // Save main session and its resumption handle
          mainSession = liveSession;
          mainResumptionHandle = latestResumptionHandle;

          // Notify client
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "caucusStarted", partyId }));
          }

          // Open a new Gemini Live session with caucus instruction
          await connectLiveSession(undefined, { partyId });
        } else if (msg.action === "end" && caucusState.active) {
          console.log(`[Live] Ending caucus with Party ${caucusState.partyId}`);

          // Collect caucus summary to inject back into main session
          const caucusSummary = msg.summary || "Caucus session completed. No specific summary provided.";

          // Close caucus session
          try { liveSession.close(); } catch (e) { /* ignore */ }

          // Restore main session
          liveSession = mainSession;
          latestResumptionHandle = mainResumptionHandle;
          mainSession = null;
          mainResumptionHandle = null;

          // If main session was lost, reconnect
          if (!liveSession && latestResumptionHandle) {
            await connectLiveSession(latestResumptionHandle);
          }

          // Inject caucus summary into main session
          if (liveSession) {
            try {
              liveSession.sendClientContent({
                turns: [{
                  role: "user",
                  parts: [{
                    text: `[SYSTEM CONTEXT UPDATE] Private caucus with Party ${caucusState.partyId} has concluded. Summary: ${caucusSummary}. You are now back in the joint session with both parties.`,
                  }],
                }],
                turnComplete: true,
              });
            } catch (e) {
              console.warn("[Live] Failed to inject caucus summary:", e);
            }
          }

          caucusState = { active: false, partyId: null, startedAt: null };
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "caucusEnded" }));
          }
        }
      } else if (msg.type === "correctSpeaker" && liveSession && !sessionClosing) {
        // ── Speaker correction from frontend ──
        const speakerName = msg.name;
        if (speakerName) {
          trackSpeakerTurn(speakerName);
          try {
            liveSession.sendClientContent({
              turns: [{
                role: "user",
                parts: [{
                  text: `[SYSTEM CONTEXT UPDATE] Speaker correction: The current speaker is ${speakerName}. Please update your speaker tracking accordingly.`,
                }],
              }],
              turnComplete: true,
            });
          } catch (e) {
            console.warn("[Live] Failed to send speaker correction:", e);
          }
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
      } else if (msg.type === "context" && liveSession && !sessionClosing) {
        // Mid-session context injection — send text without interrupting audio
        try {
          liveSession.sendClientContent({
            turns: [{ role: "user", parts: [{ text: msg.text }] }],
            turnComplete: true,
          });
        } catch (e) {
          console.warn("[Live] Failed to inject context:", e);
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
    // Clean up silence timers
    if (silenceTimer5s) { clearTimeout(silenceTimer5s); silenceTimer5s = null; }
    if (silenceTimer15s) { clearTimeout(silenceTimer15s); silenceTimer15s = null; }
    // Clean up caucus session if active
    if (caucusState.active && mainSession) {
      try { mainSession.close(); } catch (e) { /* ignore */ }
      mainSession = null;
    }
    // Room mode: leave room (room manager handles cleanup)
    if (roomId) {
      leaveRoom(roomId, clientId);
      roomId = null;
    } else if (liveSession) {
      // 1:1 mode: close session directly
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
      liveSession = null;
    }
  });
}
