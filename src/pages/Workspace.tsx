import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  Square,
  Activity,
  Database,
  FileText,
  Search,
  Plus,
  Trash2,
  FolderOpen,
  ChevronLeft,
  UserPlus,
  Network,
  CheckCircle2,
  Circle,
  Settings2,
  Lightbulb,
  Shield,
  Heart,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Brain,
  Target,
  MessageCircle,
} from "lucide-react";
import {
  getLiveSession,
  extractPrimitives,
  researchGrounding,
  analyzePathways,
} from "../services/geminiService";

type Actor = { id: string; name: string; role: string };
type PrimitiveType =
  | "Claim"
  | "Interest"
  | "Constraint"
  | "Leverage"
  | "Commitment"
  | "Event";
type Primitive = {
  id: string;
  type: PrimitiveType;
  actorId: string;
  description: string;
};

type PartyProfile = {
  emotionalState: string;
  engagementLevel: string;
  communicationStyle: string;
  cooperativeness: number;
  defensiveness: number;
  keyNeeds: string[];
  riskFactors: string[];
};

type Case = {
  id: string;
  title: string;
  updatedAt: string;
  transcript: string;
  actors: Actor[];
  primitives: Primitive[];
  partyAName: string;
  partyBName: string;
};

const PRIMITIVE_TYPES: PrimitiveType[] = [
  "Claim",
  "Interest",
  "Constraint",
  "Leverage",
  "Commitment",
  "Event",
];

const PHASES = [
  "Opening",
  "Discovery",
  "Exploration",
  "Negotiation",
  "Resolution",
  "Agreement",
];

const EMOTION_COLORS: Record<string, string> = {
  Calm: "text-emerald-400",
  Anxious: "text-amber-400",
  Defensive: "text-orange-400",
  Angry: "text-red-400",
  Frustrated: "text-orange-500",
  Hopeful: "text-sky-400",
  Resigned: "text-gray-400",
  Guarded: "text-yellow-500",
  Open: "text-emerald-300",
  Distressed: "text-red-500",
};

function GaugeBar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function PartyCard({
  name,
  profile,
  side,
}: {
  name: string;
  profile: PartyProfile | null;
  side: "A" | "B";
}) {
  const borderColor =
    side === "A"
      ? "border-sky-500/40 shadow-sky-500/5"
      : "border-violet-500/40 shadow-violet-500/5";
  const accentColor = side === "A" ? "#0ea5e9" : "#8b5cf6";
  const bgGlow =
    side === "A"
      ? "from-sky-500/5 to-transparent"
      : "from-violet-500/5 to-transparent";
  const emotionColor = profile
    ? EMOTION_COLORS[profile.emotionalState] || "text-gray-400"
    : "text-gray-500";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-b ${bgGlow} bg-[var(--color-surface)] border ${borderColor} rounded-xl p-4 shadow-lg flex-1 min-w-0`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: accentColor }}
        >
          {side}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{name}</h3>
          {profile && (
            <span className={`text-[10px] font-mono uppercase ${emotionColor}`}>
              {profile.emotionalState} / {profile.communicationStyle}
            </span>
          )}
        </div>
      </div>

      {profile ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <GaugeBar
              value={profile.cooperativeness}
              color="#10b981"
              label="Cooperativeness"
            />
            <GaugeBar
              value={profile.defensiveness}
              color="#ef4444"
              label="Defensiveness"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
              Engagement:
            </span>
            <span
              className={`text-[10px] font-bold ${
                profile.engagementLevel === "High"
                  ? "text-emerald-400"
                  : profile.engagementLevel === "Medium"
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {profile.engagementLevel}
            </span>
          </div>

          {profile.keyNeeds.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Underlying Needs
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.keyNeeds.map((need, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-white"
                  >
                    {need}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.riskFactors.length > 0 && (
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Risk
                Factors
              </div>
              <div className="flex flex-wrap gap-1">
                {profile.riskFactors.map((risk, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400"
                  >
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-[var(--color-text-muted)] italic py-4 text-center">
          Awaiting session data...
        </div>
      )}
    </motion.div>
  );
}

export default function Workspace() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("IDLE");
  const [research, setResearch] = useState<any>(null);
  const [pathways, setPathways] = useState<any>(null);
  const [mediatorProfile, setMediatorProfile] = useState({
    voice: "Zephyr",
    approach: "Facilitative",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "transcript" | "structure" | "pathways"
  >("transcript");

  const [liveMediationState, setLiveMediationState] = useState<{
    phase: string;
    targetActor: string;
    currentAction: string;
    missingItems: string[];
    structuredItems: { topic: string; summary: string; actor: string }[];
    partyProfiles: {
      partyA: PartyProfile | null;
      partyB: PartyProfile | null;
    };
    commonGround: string[];
    tensionPoints: string[];
  } | null>(null);

  const [demoMode, setDemoMode] = useState(false);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sessionRef = useRef<any>(null);
  const sessionClosingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Shared playback AudioContext and queue for sequential audio playback
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const playbackTimeRef = useRef(0);

  const activeCaseIdRef = useRef<string | null>(null);
  activeCaseIdRef.current = activeCaseId;

  useEffect(() => {
    const saved = localStorage.getItem("concordia_cases");
    if (saved) {
      setCases(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("concordia_cases", JSON.stringify(cases));
  }, [cases]);

  const createNewCase = () => {
    const newCase: Case = {
      id: Date.now().toString(),
      title: "New Mediation Case",
      updatedAt: new Date().toISOString(),
      transcript: "",
      actors: [
        { id: "a1", name: "Party A", role: "Disputant" },
        { id: "a2", name: "Party B", role: "Disputant" },
      ],
      primitives: [],
      partyAName: "Party A",
      partyBName: "Party B",
    };
    setCases([newCase, ...cases]);
    setActiveCaseId(newCase.id);
  };

  const activeCase = cases.find((c) => c.id === activeCaseId);

  const updateActiveCase = (updates: Partial<Case>) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === activeCaseId
          ? { ...c, ...updates, updatedAt: new Date().toISOString() }
          : c,
      ),
    );
  };

  const isSessionOpen = () => {
    return sessionRef.current && !sessionClosingRef.current;
  };

  const startSession = async () => {
    try {
      setStatus("CONNECTING");
      sessionClosingRef.current = false;

      const currentGraphContext = JSON.stringify(
        {
          actors: activeCase?.actors,
          primitives: activeCase?.primitives,
        },
        null,
        2,
      );

      const session = await getLiveSession(
        {
          onopen: () => {
            setStatus("LIVE");
            setIsRecording(true);
            startAudioCapture();
          },
          onmessage: async (message: any) => {
            if (sessionClosingRef.current) return;

            const base64Audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }

            // Get transcription text from the outputTranscription or model text parts
            const aiText =
              message.serverContent?.outputTranscription?.text ||
              message.serverContent?.modelTurn?.parts?.[0]?.text;
            // Get user's spoken text from input transcription
            const userText =
              message.serverContent?.inputTranscription?.text;

            if (aiText && activeCaseIdRef.current) {
              setCases((prev) =>
                prev.map((c) =>
                  c.id === activeCaseIdRef.current
                    ? {
                        ...c,
                        transcript:
                          c.transcript +
                          (c.transcript ? "\n\n" : "") +
                          "[Concordia]: " +
                          aiText,
                      }
                    : c,
                ),
              );
            }
            if (userText && activeCaseIdRef.current) {
              setCases((prev) =>
                prev.map((c) =>
                  c.id === activeCaseIdRef.current
                    ? {
                        ...c,
                        transcript:
                          c.transcript +
                          (c.transcript ? "\n\n" : "") +
                          "[Speaker]: " +
                          userText,
                      }
                    : c,
                ),
              );
            }

            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                const responses = functionCalls.map((call: any) => {
                  if (call.name === "updateMediationState") {
                    const args = call.args;
                    setLiveMediationState({
                      phase: args.phase || "Opening",
                      targetActor: args.targetActor || "Both",
                      currentAction:
                        args.currentAction || "Analyzing conversation...",
                      missingItems: args.missingItems || [],
                      structuredItems: args.structuredItems || [],
                      partyProfiles: {
                        partyA: args.partyProfiles?.partyA || null,
                        partyB: args.partyProfiles?.partyB || null,
                      },
                      commonGround: args.commonGround || [],
                      tensionPoints: args.tensionPoints || [],
                    });
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "UI updated successfully" },
                    };
                  }
                  return {
                    id: call.id,
                    name: call.name,
                    response: { error: "Unknown function" },
                  };
                });

                if (isSessionOpen()) {
                  try {
                    sessionRef.current.sendToolResponse({
                      functionResponses: responses,
                    });
                  } catch (e) {
                    console.warn("Failed to send tool response:", e);
                  }
                }
              }
            }
          },
          onclose: () => {
            sessionClosingRef.current = true;
            setStatus("DISCONNECTED");
            setIsRecording(false);
            stopAudioCapture();
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            // Don't kill the session — the server/client reconnection logic will handle it
          },
          onreconnecting: () => {
            // Server or client is auto-reconnecting — keep UI alive, keep audio capture running
            setStatus("RECONNECTING");
          },
          onreconnected: () => {
            // Session was successfully restored after a disconnect
            console.log("Session reconnected successfully");
            setStatus("LIVE");
            setIsRecording(true);
            // Restart audio capture if it was stopped
            if (!processorRef.current) {
              startAudioCapture();
            }
          },
        },
        currentGraphContext,
        mediatorProfile,
        {
          partyA: activeCase?.partyAName || "Party A",
          partyB: activeCase?.partyBName || "Party B",
        },
      );
      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to start session:", error);
      setStatus("ERROR");
    }
  };

  const stopSession = () => {
    sessionClosingRef.current = true;
    stopAudioCapture();
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session:", e);
      }
      sessionRef.current = null;
    }
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsRecording(false);
    setDemoMode(false);
    setStatus("IDLE");

    if (activeCase?.transcript) {
      handleSimulateExtraction();
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    // Process in chunks of 8192 to avoid stack overflow from spread operator
    for (let i = 0; i < bytes.length; i += 8192) {
      const chunk = bytes.subarray(i, Math.min(i + 8192, bytes.length));
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Resume AudioContext in case browser suspended it
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }

        const base64 = arrayBufferToBase64(pcm16.buffer);

        if (isSessionOpen()) {
          try {
            sessionRef.current.sendRealtimeInput({
              media: { data: base64, mimeType: "audio/pcm;rate=16000" },
            });
          } catch (e) {
            // Session closed mid-send, ignore
          }
        }
      };
    } catch (err) {
      console.error("Error capturing audio:", err);
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (playbackContextRef.current) {
      try { playbackContextRef.current.close(); } catch (_) {}
      playbackContextRef.current = null;
      playbackTimeRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const getPlaybackContext = () => {
    if (!playbackContextRef.current || playbackContextRef.current.state === "closed") {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      playbackTimeRef.current = 0;
    }
    return playbackContextRef.current;
  };

  const playAudio = (base64Data: string) => {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const floatData = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        floatData[i] = pcm16[i] / 0x7fff;
      }

      // Schedule on the shared AudioContext for sequential playback
      const ctx = getPlaybackContext();
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Schedule this chunk right after the previous one finishes
      const now = ctx.currentTime;
      const startTime = Math.max(now, playbackTimeRef.current);
      source.start(startTime);
      playbackTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  const startDemoSession = () => {
    setDemoMode(true);
    setIsRecording(true);
    setStatus("DEMO");

    const partyA = activeCase?.partyAName || "Party A";
    const partyB = activeCase?.partyBName || "Party B";

    const demoScript = [
      {
        delay: 0,
        transcript: `[Concordia]: Welcome to this mediation session. I'm here to help ${partyA} and ${partyB} work through your concerns in a safe, structured environment. Let me start by setting some ground rules: we'll maintain mutual respect, one person speaks at a time, and everything discussed here is confidential.`,
        state: {
          phase: "Opening",
          targetActor: "Both",
          currentAction: "Setting ground rules and establishing safe space",
          missingItems: [
            `${partyA}'s opening statement`,
            `${partyB}'s opening statement`,
            "Core dispute details",
            "Timeline of events",
          ],
          structuredItems: [],
          partyProfiles: {
            partyA: {
              emotionalState: "Guarded",
              engagementLevel: "Medium",
              communicationStyle: "Assertive",
              cooperativeness: 45,
              defensiveness: 55,
              keyNeeds: ["Recognition", "Fairness"],
              riskFactors: ["Fixed position"],
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "Medium",
              communicationStyle: "Passive",
              cooperativeness: 50,
              defensiveness: 60,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk"],
            },
          },
          commonGround: [],
          tensionPoints: [],
        },
      },
      {
        delay: 4000,
        transcript: `[Concordia]: ${partyA}, could you please start by telling me, in your own words, what brought you here today?`,
        state: {
          phase: "Discovery",
          targetActor: partyA,
          currentAction: `Inviting ${partyA} to share their perspective first`,
          missingItems: [
            `${partyA}'s narrative`,
            `${partyB}'s narrative`,
            "Emotional dimensions",
            "History of resolution attempts",
          ],
          structuredItems: [
            {
              topic: "Session opened",
              summary: "Ground rules established, both parties present",
              actor: "Concordia",
            },
          ],
          partyProfiles: {
            partyA: {
              emotionalState: "Guarded",
              engagementLevel: "High",
              communicationStyle: "Assertive",
              cooperativeness: 48,
              defensiveness: 52,
              keyNeeds: ["Recognition", "Fairness"],
              riskFactors: ["Fixed position"],
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "Medium",
              communicationStyle: "Passive",
              cooperativeness: 50,
              defensiveness: 60,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk"],
            },
          },
          commonGround: [],
          tensionPoints: [],
        },
      },
      {
        delay: 8000,
        transcript: `[Speaker]: The main issue is that we had an agreement about responsibilities, but it hasn't been honored. I feel like my contributions are being overlooked and the terms we initially set have shifted without my input.`,
        state: {
          phase: "Discovery",
          targetActor: partyA,
          currentAction: `Processing ${partyA}'s opening statement, identifying claims and emotions`,
          missingItems: [
            `${partyB}'s perspective`,
            "Specific agreement details",
            "Timeline of changes",
            "Impact assessment",
          ],
          structuredItems: [
            {
              topic: "Session opened",
              summary: "Ground rules established",
              actor: "Concordia",
            },
            {
              topic: "Broken agreement",
              summary: `${partyA} claims responsibilities agreement not honored`,
              actor: partyA,
            },
            {
              topic: "Feeling overlooked",
              summary: `${partyA} feels contributions are not recognized`,
              actor: partyA,
            },
          ],
          partyProfiles: {
            partyA: {
              emotionalState: "Frustrated",
              engagementLevel: "High",
              communicationStyle: "Assertive",
              cooperativeness: 42,
              defensiveness: 65,
              keyNeeds: ["Recognition", "Fairness", "Respect"],
              riskFactors: ["Escalation tendency", "Fixed position"],
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "Medium",
              communicationStyle: "Passive",
              cooperativeness: 50,
              defensiveness: 60,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk"],
            },
          },
          commonGround: [],
          tensionPoints: [
            "Disputed agreement terms",
            "Perceived lack of recognition",
          ],
        },
      },
      {
        delay: 13000,
        transcript: `[Concordia]: I hear you, ${partyA}. It sounds like you're feeling frustrated because commitments that were important to you haven't been upheld. That's a valid concern. ${partyB}, I'd like to hear your perspective. How do you see the situation?`,
        state: {
          phase: "Discovery",
          targetActor: partyB,
          currentAction: `Validated ${partyA}'s emotions, pivoting to ${partyB} for their narrative`,
          missingItems: [
            `${partyB}'s full perspective`,
            "Specific agreement details from both sides",
            "What resolution attempts were made",
          ],
          structuredItems: [
            {
              topic: "Session opened",
              summary: "Ground rules established",
              actor: "Concordia",
            },
            {
              topic: "Broken agreement",
              summary: `${partyA} claims responsibilities agreement not honored`,
              actor: partyA,
            },
            {
              topic: "Feeling overlooked",
              summary: `${partyA} feels contributions are not recognized`,
              actor: partyA,
            },
            {
              topic: "Emotional validation",
              summary: `Concordia acknowledged ${partyA}'s frustration`,
              actor: "Concordia",
            },
          ],
          partyProfiles: {
            partyA: {
              emotionalState: "Frustrated",
              engagementLevel: "High",
              communicationStyle: "Assertive",
              cooperativeness: 48,
              defensiveness: 58,
              keyNeeds: ["Recognition", "Fairness", "Respect"],
              riskFactors: ["Escalation tendency"],
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "High",
              communicationStyle: "Passive",
              cooperativeness: 52,
              defensiveness: 55,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk", "Avoidance"],
            },
          },
          commonGround: [
            "Both parties acknowledge an agreement existed",
          ],
          tensionPoints: [
            "Disputed agreement terms",
            "Perceived lack of recognition",
          ],
        },
      },
      {
        delay: 18000,
        transcript: `[Speaker]: I understand their frustration, but the situation changed. New constraints came up that made the original plan unworkable. I tried to adapt, but I didn't know how to bring it up without causing conflict. I do value what they contribute.`,
        state: {
          phase: "Exploration",
          targetActor: "Both",
          currentAction: "Cross-referencing both narratives, identifying shared values and communication gaps",
          missingItems: [
            "Nature of the new constraints",
            "Why communication broke down",
            "What a workable arrangement looks like for both",
          ],
          structuredItems: [
            {
              topic: "Session opened",
              summary: "Ground rules established",
              actor: "Concordia",
            },
            {
              topic: "Broken agreement",
              summary: `${partyA} claims responsibilities agreement not honored`,
              actor: partyA,
            },
            {
              topic: "Feeling overlooked",
              summary: `${partyA} feels contributions are not recognized`,
              actor: partyA,
            },
            {
              topic: "Changed circumstances",
              summary: `${partyB} says new constraints made original plan unworkable`,
              actor: partyB,
            },
            {
              topic: "Communication gap",
              summary: `${partyB} feared raising the issue would cause conflict`,
              actor: partyB,
            },
            {
              topic: "Mutual value",
              summary: `${partyB} explicitly values ${partyA}'s contributions`,
              actor: partyB,
            },
          ],
          partyProfiles: {
            partyA: {
              emotionalState: "Open",
              engagementLevel: "High",
              communicationStyle: "Analytical",
              cooperativeness: 62,
              defensiveness: 40,
              keyNeeds: ["Recognition", "Fairness", "Communication"],
              riskFactors: ["May fixate on original terms"],
            },
            partyB: {
              emotionalState: "Hopeful",
              engagementLevel: "High",
              communicationStyle: "Collaborative",
              cooperativeness: 68,
              defensiveness: 35,
              keyNeeds: ["Autonomy", "Flexibility", "Harmony"],
              riskFactors: ["Conflict avoidance may mask issues"],
            },
          },
          commonGround: [
            "Both acknowledge an agreement existed",
            `${partyB} values ${partyA}'s contributions`,
            "Both want a workable arrangement going forward",
          ],
          tensionPoints: [
            "Communication breakdown around changing terms",
            "Unilateral decision-making",
          ],
        },
      },
      {
        delay: 24000,
        transcript: `[Concordia]: This is very promising. I'm noticing that you both actually share a core value here: you both want a fair arrangement that works. The challenge seems to be around communication when circumstances change. ${partyA}, how would you feel about establishing a process where changes are discussed before they're implemented?`,
        state: {
          phase: "Negotiation",
          targetActor: partyA,
          currentAction: "Testing a process-based solution that addresses both parties' needs",
          missingItems: [
            "Specific process for handling changes",
            "Frequency of check-ins",
            "How to handle urgent changes",
          ],
          structuredItems: [
            {
              topic: "Session opened",
              summary: "Ground rules established",
              actor: "Concordia",
            },
            {
              topic: "Broken agreement",
              summary: `${partyA} claims responsibilities agreement not honored`,
              actor: partyA,
            },
            {
              topic: "Changed circumstances",
              summary: `${partyB} says new constraints made original plan unworkable`,
              actor: partyB,
            },
            {
              topic: "Communication gap",
              summary: `${partyB} feared raising the issue would cause conflict`,
              actor: partyB,
            },
            {
              topic: "Mutual value",
              summary: `${partyB} explicitly values ${partyA}'s contributions`,
              actor: partyB,
            },
            {
              topic: "Shared value identified",
              summary: "Both want fairness and a workable arrangement",
              actor: "Both",
            },
            {
              topic: "Process proposal",
              summary: "Concordia suggests a change-discussion protocol",
              actor: "Concordia",
            },
          ],
          partyProfiles: {
            partyA: {
              emotionalState: "Hopeful",
              engagementLevel: "High",
              communicationStyle: "Collaborative",
              cooperativeness: 72,
              defensiveness: 28,
              keyNeeds: ["Process", "Transparency", "Recognition"],
              riskFactors: [],
            },
            partyB: {
              emotionalState: "Hopeful",
              engagementLevel: "High",
              communicationStyle: "Collaborative",
              cooperativeness: 75,
              defensiveness: 25,
              keyNeeds: ["Flexibility", "Harmony", "Structure"],
              riskFactors: [],
            },
          },
          commonGround: [
            "Both want a fair, workable arrangement",
            `${partyB} values ${partyA}'s contributions`,
            "Both open to establishing a communication process",
            "Both want to prevent future misunderstandings",
          ],
          tensionPoints: ["Details of implementation still to be negotiated"],
        },
      },
    ];

    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= demoScript.length) {
        demoTimersRef.current.forEach(clearTimeout);
        demoTimersRef.current = [];
        return;
      }
      const step = demoScript[stepIndex];
      if (activeCaseIdRef.current) {
        setCases((prev) =>
          prev.map((c) =>
            c.id === activeCaseIdRef.current
              ? {
                  ...c,
                  transcript:
                    c.transcript +
                    (c.transcript ? "\n\n" : "") +
                    step.transcript,
                }
              : c,
          ),
        );
      }
      setLiveMediationState(step.state as any);
      stepIndex++;
    };

    // Run first step immediately
    runStep();

    // Schedule remaining steps
    demoTimersRef.current = [];
    demoScript.slice(1).forEach((step) => {
      const timer = setTimeout(() => {
        runStep();
      }, step.delay);
      demoTimersRef.current.push(timer);
    });

    // Auto-stop after the last step
    const endTimer = setTimeout(() => {
      setStatus("DEMO COMPLETE");
    }, demoScript[demoScript.length - 1].delay + 2000);
    demoTimersRef.current.push(endTimer);
  };

  const handleSimulateExtraction = async () => {
    if (!activeCase?.transcript) return;
    setStatus("ANALYZING");
    try {
      const resultStr = await extractPrimitives(activeCase.transcript);
      const result = JSON.parse(resultStr);

      let newActors = [...activeCase.actors];
      let newPrimitives = [...activeCase.primitives];

      result.actors?.forEach((a: any) => {
        if (
          !newActors.find(
            (existing) =>
              existing.name.toLowerCase() === a.name.toLowerCase(),
          )
        ) {
          newActors.push({
            id: Date.now().toString() + Math.random(),
            name: a.name,
            role: a.role || "Unknown",
          });
        }
      });

      result.primitives?.forEach((p: any) => {
        const actor = newActors.find(
          (a) => a.name.toLowerCase() === p.actorName?.toLowerCase(),
        );
        const actorId = actor ? actor.id : newActors[0]?.id;
        if (actorId) {
          newPrimitives.push({
            id: Date.now().toString() + Math.random(),
            type: PRIMITIVE_TYPES.includes(p.type as PrimitiveType)
              ? p.type
              : "Claim",
            actorId,
            description: p.description,
          });
        }
      });

      updateActiveCase({ actors: newActors, primitives: newPrimitives });

      const currentGraphContext = JSON.stringify(
        { actors: newActors, primitives: newPrimitives },
        null,
        2,
      );

      const [researchRes, pathwaysResStr] = await Promise.all([
        researchGrounding(activeCase.transcript),
        analyzePathways(activeCase.transcript, currentGraphContext),
      ]);

      setResearch(researchRes);
      try {
        setPathways(JSON.parse(pathwaysResStr));
      } catch (e) {
        console.error("Failed to parse pathways", e);
      }

      setStatus("IDLE");
      setActiveTab("pathways");
    } catch (err) {
      console.error("Extraction error:", err);
      setStatus("ERROR");
    }
  };

  const addActor = () => {
    updateActiveCase({
      actors: [
        ...activeCase!.actors,
        { id: Date.now().toString(), name: "New Actor", role: "Role" },
      ],
    });
  };
  const updateActor = (id: string, updates: Partial<Actor>) => {
    updateActiveCase({
      actors: activeCase!.actors.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    });
  };
  const deleteActor = (id: string) => {
    updateActiveCase({
      actors: activeCase!.actors.filter((a) => a.id !== id),
      primitives: activeCase!.primitives.filter((p) => p.actorId !== id),
    });
  };

  const addPrimitive = (actorId: string) => {
    updateActiveCase({
      primitives: [
        ...activeCase!.primitives,
        {
          id: Date.now().toString(),
          type: "Claim",
          actorId,
          description: "New description",
        },
      ],
    });
  };
  const updatePrimitive = (id: string, updates: Partial<Primitive>) => {
    updateActiveCase({
      primitives: activeCase!.primitives.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    });
  };
  const deletePrimitive = (id: string) => {
    updateActiveCase({
      primitives: activeCase!.primitives.filter((p) => p.id !== id),
    });
  };

  // ─── CASE LIST VIEW ───
  if (!activeCaseId) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-[var(--color-bg)]">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-[var(--color-accent)]" />
            Mediation Cases
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 max-w-xl">
            Each case represents a mediation session between two parties.
            Create a new case to begin a guided conflict resolution process.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <button
            onClick={createNewCase}
            className="h-52 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-xl flex flex-col items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all hover:shadow-lg hover:shadow-[var(--color-accent)]/5"
          >
            <Plus className="w-8 h-8 mb-3" />
            <span className="font-medium">New Mediation</span>
            <span className="text-xs mt-1 opacity-60">
              Two-party conflict resolution
            </span>
          </button>

          {cases.map((c) => (
            <div
              key={c.id}
              className="h-52 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-accent)]/30 transition-all cursor-pointer group relative"
              onClick={() => setActiveCaseId(c.id)}
            >
              <div className="flex items-start justify-between mb-auto">
                <h3 className="font-semibold text-lg line-clamp-2 pr-4">
                  {c.title}
                </h3>
                <FolderOpen className="w-5 h-5 text-[var(--color-accent)] shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mt-4 space-y-1.5">
                <p className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  {c.partyAName || "Party A"} vs {c.partyBName || "Party B"}
                </p>
                <p className="flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" /> {c.primitives.length}{" "}
                  Primitives
                </p>
                <p className="text-xs mt-3 opacity-50">
                  Updated: {new Date(c.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCases(cases.filter((x) => x.id !== c.id));
                }}
                className="absolute bottom-4 right-4 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const presentTypes = new Set(activeCase?.primitives.map((p) => p.type));
  const healthScore = Math.round(
    (presentTypes.size / PRIMITIVE_TYPES.length) * 100,
  );
  const currentPhaseIdx = PHASES.indexOf(
    liveMediationState?.phase || "Opening",
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg)]">
      {/* ─── TOP BAR ─── */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveCaseId(null)}
            className="p-2 hover:bg-[var(--color-surface-hover)] rounded-md text-[var(--color-text-muted)] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              value={activeCase?.title}
              onChange={(e) => updateActiveCase({ title: e.target.value })}
              className="text-xl font-bold tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 w-full max-w-md"
            />
            <div className="flex items-center gap-3 mt-1">
              <input
                value={activeCase?.partyAName}
                onChange={(e) =>
                  updateActiveCase({ partyAName: e.target.value })
                }
                className="text-xs bg-transparent border-b border-sky-500/30 focus:border-sky-500 focus:outline-none text-sky-400 font-mono w-24 px-1"
                placeholder="Party A"
              />
              <span className="text-xs text-[var(--color-text-muted)]">vs</span>
              <input
                value={activeCase?.partyBName}
                onChange={(e) =>
                  updateActiveCase({ partyBName: e.target.value })
                }
                className="text-xs bg-transparent border-b border-violet-500/30 focus:border-violet-500 focus:outline-none text-violet-400 font-mono w-24 px-1"
                placeholder="Party B"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-[var(--color-surface-hover)] rounded-md text-[var(--color-text-muted)] hover:text-white transition-colors"
              title="Mediator Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>

            {showSettings && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-4 z-50">
                <h3 className="text-sm font-semibold mb-3">
                  Mediator Profile
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1">
                      Voice
                    </label>
                    <select
                      value={mediatorProfile.voice}
                      onChange={(e) =>
                        setMediatorProfile({
                          ...mediatorProfile,
                          voice: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm p-1.5 focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="Zephyr">Zephyr (Calm, Neutral)</option>
                      <option value="Kore">Kore (Empathetic, Warm)</option>
                      <option value="Puck">Puck (Direct, Clear)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-muted)] block mb-1">
                      Approach
                    </label>
                    <select
                      value={mediatorProfile.approach}
                      onChange={(e) =>
                        setMediatorProfile({
                          ...mediatorProfile,
                          approach: e.target.value,
                        })
                      }
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-sm p-1.5 focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="Facilitative">
                        Facilitative (Guide process)
                      </option>
                      <option value="Evaluative">
                        Evaluative (Assess merits)
                      </option>
                      <option value="Transformative">
                        Transformative (Empowerment)
                      </option>
                      <option value="Narrative">
                        Narrative (Deconstruct stories)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm font-mono bg-[var(--color-bg)] px-3 py-1.5 rounded-md border border-[var(--color-border)]">
            <span
              className={`w-2 h-2 rounded-full ${
                demoMode
                  ? "bg-amber-500 animate-pulse"
                  : status === "RECONNECTING"
                    ? "bg-yellow-500 animate-pulse"
                    : isRecording
                      ? "bg-red-500 animate-pulse"
                      : status === "ANALYZING"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-gray-500"
              }`}
            ></span>
            {status}
          </div>

          {isRecording ? (
            <button
              onClick={stopSession}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 shadow-lg shadow-red-500/10"
            >
              <Square className="w-4 h-4" />
              End Session
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={startSession}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-lg shadow-[var(--color-accent)]/20"
              >
                <Mic className="w-4 h-4" />
                Start Live Session
              </button>
              <button
                onClick={startDemoSession}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-sm"
                title="Run a simulated demo session"
              >
                <Activity className="w-4 h-4" />
                Demo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── LIVE PHASE PROGRESS BAR ─── */}
      {(isRecording || liveMediationState) && (
        <div className="px-6 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-1">
            {PHASES.map((phase, idx) => (
              <div key={phase} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all ${
                    idx === currentPhaseIdx
                      ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/30"
                      : idx < currentPhaseIdx
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                  }`}
                >
                  {idx < currentPhaseIdx ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : idx === currentPhaseIdx ? (
                    <Activity className="w-3 h-3 animate-pulse" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                  {phase}
                </div>
                {idx < PHASES.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 ${
                      idx < currentPhaseIdx
                        ? "bg-emerald-500/30"
                        : "bg-[var(--color-border)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── LIVE MEDIATOR ACTION BANNER ─── */}
      <AnimatePresence>
        {isRecording && liveMediationState && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 shrink-0"
          >
            <div className="mt-3 p-3 bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] mb-0.5">
                  Mediator Focus
                </div>
                <p className="text-sm text-white truncate">
                  {liveMediationState.currentAction}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <MessageCircle className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">
                  Addressing:{" "}
                </span>
                <span className="text-xs font-bold text-white">
                  {liveMediationState.targetActor}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* ─── LEFT: Party Profiles ─── */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          <PartyCard
            name={activeCase?.partyAName || "Party A"}
            profile={liveMediationState?.partyProfiles?.partyA || null}
            side="A"
          />
          <PartyCard
            name={activeCase?.partyBName || "Party B"}
            profile={liveMediationState?.partyProfiles?.partyB || null}
            side="B"
          />

          {/* Common Ground */}
          {liveMediationState &&
            liveMediationState.commonGround.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-surface)] border border-emerald-500/20 rounded-xl p-4"
              >
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Common Ground
                </h3>
                <ul className="space-y-1.5">
                  {liveMediationState.commonGround.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-emerald-100 flex items-start gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

          {/* Tension Points */}
          {liveMediationState &&
            liveMediationState.tensionPoints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-surface)] border border-red-500/20 rounded-xl p-4"
              >
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Tension Points
                </h3>
                <ul className="space-y-1.5">
                  {liveMediationState.tensionPoints.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-red-100 flex items-start gap-1.5"
                    >
                      <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

          {/* Missing Items */}
          {liveMediationState &&
            liveMediationState.missingItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-surface)] border border-amber-500/20 rounded-xl p-4"
              >
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Still Needed
                </h3>
                <ul className="space-y-1.5">
                  {liveMediationState.missingItems.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-amber-100 flex items-start gap-1.5"
                    >
                      <Circle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
        </div>

        {/* ─── CENTER: Tabbed Content ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-1 mb-3 shrink-0">
            {(
              [
                {
                  id: "transcript" as const,
                  label: "Live Transcript",
                  icon: FileText,
                },
                {
                  id: "structure" as const,
                  label: "Case Structure",
                  icon: Database,
                },
                {
                  id: "pathways" as const,
                  label: "Resolution Pathways",
                  icon: Lightbulb,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--color-accent)] text-white shadow-md shadow-[var(--color-accent)]/20"
                      : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TRANSCRIPT TAB ── */}
          {activeTab === "transcript" && (
            <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col overflow-hidden">
              <textarea
                value={activeCase?.transcript}
                onChange={(e) =>
                  updateActiveCase({ transcript: e.target.value })
                }
                placeholder={`Enter initial context here, or start the Live Session to begin mediation between ${activeCase?.partyAName || "Party A"} and ${activeCase?.partyBName || "Party B"}...`}
                className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm leading-relaxed text-white placeholder-[var(--color-text-muted)] font-mono"
              />
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-end">
                <button
                  onClick={handleSimulateExtraction}
                  disabled={
                    !activeCase?.transcript || status === "ANALYZING"
                  }
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-[var(--color-accent)]/20"
                >
                  <Target className="w-4 h-4" />
                  Analyze & Find Pathways
                </button>
              </div>
            </div>
          )}

          {/* ── STRUCTURE TAB ── */}
          {activeTab === "structure" && (
            <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-full">
                  <div className="text-xs font-mono text-[var(--color-text-muted)]">
                    Ontology Health
                  </div>
                  <div className="flex gap-1">
                    {PRIMITIVE_TYPES.map((type) => (
                      <div
                        key={type}
                        title={type}
                        className="flex items-center justify-center"
                      >
                        {presentTypes.has(type) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-[var(--color-border)]" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-mono font-bold text-[var(--color-accent)]">
                    {healthScore}%
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {activeCase?.actors.map((actor) => (
                  <div
                    key={actor.id}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2 flex-1 mr-4">
                        <input
                          value={actor.name}
                          onChange={(e) =>
                            updateActor(actor.id, {
                              name: e.target.value,
                            })
                          }
                          className="bg-transparent font-semibold text-white focus:outline-none border-b border-transparent focus:border-[var(--color-accent)] px-1 w-1/3"
                          placeholder="Name"
                        />
                        <input
                          value={actor.role}
                          onChange={(e) =>
                            updateActor(actor.id, {
                              role: e.target.value,
                            })
                          }
                          className="bg-transparent text-sm text-[var(--color-text-muted)] focus:outline-none border-b border-transparent focus:border-[var(--color-accent)] px-1 flex-1"
                          placeholder="Role / Stance"
                        />
                      </div>
                      <button
                        onClick={() => deleteActor(actor.id)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 pl-4 border-l-2 border-[var(--color-surface-hover)]">
                      {activeCase.primitives
                        .filter((p) => p.actorId === actor.id)
                        .map((prim) => (
                          <div
                            key={prim.id}
                            className="flex items-start gap-2 group"
                          >
                            <select
                              value={prim.type}
                              onChange={(e) =>
                                updatePrimitive(prim.id, {
                                  type: e.target.value as PrimitiveType,
                                })
                              }
                              className="bg-[var(--color-surface)] text-xs font-mono p-1 rounded border border-[var(--color-border)] text-[var(--color-accent)] focus:outline-none cursor-pointer"
                            >
                              {PRIMITIVE_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <input
                              value={prim.description}
                              onChange={(e) =>
                                updatePrimitive(prim.id, {
                                  description: e.target.value,
                                })
                              }
                              className="bg-transparent text-sm flex-1 focus:outline-none border-b border-transparent focus:border-[var(--color-accent)] px-1 text-white"
                              placeholder="Description..."
                            />
                            <button
                              onClick={() => deletePrimitive(prim.id)}
                              className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      <button
                        onClick={() => addPrimitive(actor.id)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-white flex items-center gap-1 mt-3 py-1 px-2 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Primitive
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addActor}
                  className="w-full py-4 border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg text-sm text-[var(--color-text-muted)] hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Add Actor
                </button>
              </div>
            </div>
          )}

          {/* ── PATHWAYS TAB ── */}
          {activeTab === "pathways" && (
            <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {pathways ? (
                  <div className="space-y-8">
                    {pathways.commonGround &&
                      pathways.commonGround.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4" /> Common Ground
                          </h3>
                          <div className="space-y-2">
                            {pathways.commonGround.map(
                              (item: string, i: number) => (
                                <div
                                  key={i}
                                  className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-sm text-white flex items-start gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                  {item}
                                </div>
                              ),
                            )}
                          </div>
                        </motion.div>
                      )}

                    {pathways.criticalQuestions &&
                      pathways.criticalQuestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Target className="w-4 h-4" /> Critical Questions
                          </h3>
                          <div className="space-y-2">
                            {pathways.criticalQuestions.map(
                              (item: string, i: number) => (
                                <div
                                  key={i}
                                  className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm text-white flex items-start gap-2"
                                >
                                  <span className="text-amber-500 font-bold shrink-0">
                                    Q{i + 1}.
                                  </span>
                                  {item}
                                </div>
                              ),
                            )}
                          </div>
                        </motion.div>
                      )}

                    {pathways.pathways && pathways.pathways.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="text-sm font-bold text-[var(--color-accent)] mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <TrendingUp className="w-4 h-4" /> Resolution
                          Pathways
                        </h3>
                        <div className="space-y-2">
                          {pathways.pathways.map(
                            (item: string, i: number) => (
                              <div
                                key={i}
                                className="bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-lg p-3 text-sm text-white flex items-start gap-2"
                              >
                                <Lightbulb className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
                                {item}
                              </div>
                            ),
                          )}
                        </div>
                      </motion.div>
                    )}

                    {pathways.psychologicalDynamics &&
                      pathways.psychologicalDynamics.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h3 className="text-sm font-bold text-violet-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Brain className="w-4 h-4" /> Psychological
                            Dynamics
                          </h3>
                          <div className="space-y-2">
                            {pathways.psychologicalDynamics.map(
                              (item: string, i: number) => (
                                <div
                                  key={i}
                                  className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-sm text-white flex items-start gap-2"
                                >
                                  <Activity className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                                  {item}
                                </div>
                              ),
                            )}
                          </div>
                        </motion.div>
                      )}
                  </div>
                ) : research ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white leading-relaxed">
                      {research.text}
                    </p>
                    {research.chunks && research.chunks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <h4 className="text-xs font-semibold uppercase mb-2 text-[var(--color-text-muted)]">
                          Sources
                        </h4>
                        <ul className="space-y-1">
                          {research.chunks.map(
                            (chunk: any, idx: number) => (
                              <li
                                key={idx}
                                className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer truncate"
                              >
                                {chunk.web?.title || chunk.web?.uri}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                    <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">
                      No analysis yet
                    </p>
                    <p className="text-xs mt-1 opacity-60">
                      Run a live session or enter context and click "Analyze"
                      to generate resolution pathways
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Live Structured Items ─── */}
        {liveMediationState &&
          liveMediationState.structuredItems.length > 0 && (
            <div className="w-64 shrink-0 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 overflow-y-auto">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5 sticky top-0 bg-[var(--color-surface)] pb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live Findings
              </h3>
              <div className="space-y-2">
                {liveMediationState.structuredItems.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={idx}
                    className="bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-semibold text-white">
                        {item.topic}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[var(--color-surface-hover)] rounded text-[var(--color-text-muted)]">
                        {item.actor}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                      {item.summary}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
