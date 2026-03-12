"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  X,
  BookOpen,
  Clock,
  Download,
  Star,
  History,
  Filter,
  GitMerge,
  Timer,
} from "lucide-react";
import {
  getLiveSession,
  extractPrimitives,
  researchGrounding,
  analyzePathways,
  summarizeCase,
} from "@/services/gemini-client";
import type { Actor, Primitive, PrimitiveType, Case, LiveMediationState, OntologyStats, PartyProfile, GapNotification, CaseSummary, TimelineEntry, PrimitiveCluster, Agreement, EscalationFlag, SolutionProposal, PowerDynamics, ImpasseEvent } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";
import { exportAsMarkdown, exportAsJSON, downloadFile } from "@/lib/export";
import { useConflictGraph } from "@/hooks/useConflictGraph";
import ConflictGraph from "@/components/workspace/ConflictGraph";
import OntologyHealthCheck from "@/components/workspace/OntologyHealthCheck";
import EnhancedPartyProfile from "@/components/workspace/EnhancedPartyProfile";
import EscalationMeter from "@/components/workspace/EscalationMeter";
import { ErrorPanel } from "@/components/ErrorPanel";
import SessionControls from "@/components/workspace/SessionControls";
import LiveStatusBar from "@/components/workspace/LiveStatusBar";
import TranscriptPanel from "@/components/workspace/TranscriptPanel";
import AgreementTracker from "@/components/workspace/AgreementTracker";
import MediatorPlaybook from "@/components/workspace/MediatorPlaybook";
import KeyboardShortcutsHelp from "@/components/workspace/KeyboardShortcutsHelp";
import PowerMap from "@/components/workspace/PowerMap";

const PRIMITIVE_TYPES: PrimitiveType[] = [
  "Actor",
  "Claim",
  "Interest",
  "Constraint",
  "Leverage",
  "Commitment",
  "Event",
  "Narrative",
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

function safeLocalStorageSet(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed:", e);
    // If quota exceeded, prune oldest cases
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      const raw = localStorage.getItem("concordia_cases");
      const cases = raw ? JSON.parse(raw) : [];
      if (Array.isArray(cases) && cases.length > 5) {
        localStorage.setItem(
          "concordia_cases",
          JSON.stringify(cases.slice(0, 5)),
        );
      }
    }
  }
}

// ── Bidirectional Context Summary ────────────────────────────────────────────
// Builds a structured text summary of the current conflict state to inject back
// into the live session so the model can reference its own structural analysis.
function buildContextSummary(
  activeCase: Case,
  mediationState: LiveMediationState | null,
  agreements: Agreement[],
): string {
  const sections: string[] = [];

  // 1. Extracted primitives by type
  const primsByType = PRIMITIVE_TYPES.reduce((acc, type) => {
    const prims = activeCase.primitives.filter((p) => p.type === type);
    if (prims.length > 0) {
      const actorMap: Record<string, string> = {};
      activeCase.actors.forEach((a) => { actorMap[a.id] = a.name; });
      acc.push(
        `${type}s (${prims.length}):\n${prims
          .map((p) => `  - [${actorMap[p.actorId] ?? p.actorId}] ${p.description}${p.resolved ? " (RESOLVED)" : ""}${p.pinned ? " ★" : ""}`)
          .join("\n")}`,
      );
    }
    return acc;
  }, [] as string[]);

  if (primsByType.length > 0) {
    sections.push(`EXTRACTED CONFLICT STRUCTURE:\n${primsByType.join("\n\n")}`);
  }

  // 2. Common ground and tensions
  if (mediationState?.commonGround?.length) {
    sections.push(`COMMON GROUND IDENTIFIED:\n${mediationState.commonGround.map((g) => `  ✓ ${g}`).join("\n")}`);
  }
  if (mediationState?.tensionPoints?.length) {
    sections.push(`ACTIVE TENSION POINTS:\n${mediationState.tensionPoints.map((t) => `  ⚡ ${t}`).join("\n")}`);
  }

  // 3. Agreements reached
  if (agreements.length > 0) {
    sections.push(
      `AGREEMENTS REACHED:\n${agreements
        .map((a) => `  ✓ ${a.topic}: ${a.terms} [A:${a.partyAAccepts ? "Yes" : "Pending"} B:${a.partyBAccepts ? "Yes" : "Pending"}]`)
        .join("\n")}`,
    );
  }

  // 4. Ontology gaps
  const ontStats: Record<string, number> = {};
  PRIMITIVE_TYPES.forEach((t) => {
    ontStats[t] = activeCase.primitives.filter((p) => p.type === t).length;
  });
  const gaps = PRIMITIVE_TYPES.filter((t) => ontStats[t] === 0);
  if (gaps.length > 0) {
    sections.push(
      `ONTOLOGY GAPS (missing primitives):\n  ${gaps.join(", ")}\n  → Please ask targeted questions to fill these gaps.`,
    );
  }

  // 5. Party imbalance check
  const actors = activeCase.actors;
  if (actors.length >= 2) {
    const a1Count = activeCase.primitives.filter((p) => p.actorId === actors[0].id).length;
    const a2Count = activeCase.primitives.filter((p) => p.actorId === actors[1].id).length;
    if (a1Count > 0 && a2Count > 0) {
      const ratio = Math.max(a1Count, a2Count) / Math.min(a1Count, a2Count);
      if (ratio > 2) {
        const underRepresented = a1Count < a2Count ? actors[0].name : actors[1].name;
        sections.push(
          `⚠️ EXTRACTION IMBALANCE: ${underRepresented} is under-represented (${Math.min(a1Count, a2Count)} vs ${Math.max(a1Count, a2Count)} primitives). Give them more airtime.`,
        );
      }
    }
  }

  return sections.join("\n\n");
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
    style: "professional" as "professional" | "empathic",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "transcript" | "structure" | "pathways" | "graph" | "timeline"
  >("transcript");
  const [selectedFramework, setSelectedFramework] = useState("");
  const [expandedPathways, setExpandedPathways] = useState<Set<number>>(new Set([0]));
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<CaseSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [reconnectCount, setReconnectCount] = useState(0);
  const [sessionToast, setSessionToast] = useState<string | null>(null);
  const [highlightActorId, setHighlightActorId] = useState<string | null>(null);

  const [liveMediationState, setLiveMediationState] = useState<LiveMediationState | null>(null);
  const [gapNotifications, setGapNotifications] = useState<GapNotification[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [escalationScore, setEscalationScore] = useState(0);
  const [activeProposal, setActiveProposal] = useState<SolutionProposal | null>(null);
  const [escalationBanner, setEscalationBanner] = useState<EscalationFlag | null>(null);
  const [caucusMode, setCaucusMode] = useState<'joint' | 'partyA' | 'partyB'>('joint');
  const [powerDynamics, setPowerDynamics] = useState<PowerDynamics | null>(null);
  const [impasseEvents, setImpasseEvents] = useState<ImpasseEvent[]>([]);
  const [impaseBanner, setImpaseBanner] = useState<ImpasseEvent | null>(null);

  const [demoMode, setDemoMode] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [connectionLostBanner, setConnectionLostBanner] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sessionRef = useRef<any>(null);
  const sessionClosingRef = useRef(false);
  const toolCallPendingRef = useRef(false);
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

  // Transcript buffering — accumulate word-by-word fragments, flush on turnComplete
  const aiTranscriptBuffer = useRef<string>("");
  const userTranscriptBuffer = useRef<string>("");
  const sessionStartTimeRef = useRef<number>(0);

  // Continuous extraction during live sessions
  const autoExtractionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoExtractLengthRef = useRef<number>(0);
  const sessionDurationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const extractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExtractedPosRef = useRef(0);
  // Impasse detection — tracks when the last new primitive was extracted
  const lastNewPrimitiveTimeRef = useRef<number>(Date.now());

  // Styled transcript panel
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [extractionNotice, setExtractionNotice] = useState(false);

  // Keep a ref-mirror of cases to avoid stale closures in interval callbacks
  const casesRef = useRef(cases);
  casesRef.current = cases;

  // Ref-mirrors for context injection (avoids stale closures in async callbacks)
  const agreementsRef = useRef(agreements);
  agreementsRef.current = agreements;
  const liveMediationStateRef = useRef(liveMediationState);
  liveMediationStateRef.current = liveMediationState;
  const lastContextInjectionRef = useRef<number>(0);
  const MIN_INJECTION_INTERVAL = 60000; // inject at most once per minute

  useEffect(() => {
    const saved = localStorage.getItem("concordia_cases");
    if (saved) {
      const parsed = safeJsonParse(saved, null);
      if (Array.isArray(parsed)) setCases(parsed);
    }
  }, []);

  useEffect(() => {
    safeLocalStorageSet("concordia_cases", cases);
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

  // Auto-scroll transcript panel to latest entry during live sessions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoScrollEnabled && transcriptEndRef.current && (status === "LIVE" || isRecording)) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  // activeCase?.transcript is the key dep that triggers scrolling
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase?.transcript, autoScrollEnabled, status, isRecording]);

  // Keyboard shortcuts
  useEffect(() => {
    const isInputFocused = () => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Space: start/stop
      if (e.key === " " && !isInputFocused()) {
        e.preventDefault();
        if (isRecording) stopSession();
        else startSession();
      }
      // Ctrl+E: run extraction
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        if (!isRecording && activeCase?.transcript) handleSimulateExtraction();
      }
      // Ctrl+Shift+S: generate summary
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        if (activeCase?.transcript) handleGenerateSummary();
      }
      // Legacy Ctrl+Enter: run extraction
      if (e.ctrlKey && e.key === "Enter") {
        if (!isRecording && activeCase?.transcript) handleSimulateExtraction();
      }
      if (e.key === "Escape") {
        setShowSummary(false);
        setShowExport(false);
        setShowSettings(false);
        setShowShortcutsHelp(false);
      }
      // ?: show shortcuts help
      if (e.key === "?" && !isInputFocused()) {
        setShowShortcutsHelp(true);
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") setActiveTab("transcript");
        if (e.key === "2") setActiveTab("structure");
        if (e.key === "3") setActiveTab("pathways");
        if (e.key === "4") setActiveTab("graph");
        if (e.key === "5") setActiveTab("timeline");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, activeCase?.transcript]);

  // Automatic impasse detection — alert when no new primitives in >5 minutes
  useEffect(() => {
    if (status !== 'LIVE') return;
    const checker = setInterval(() => {
      const minutesSinceNew = (Date.now() - lastNewPrimitiveTimeRef.current) / 60000;
      if (minutesSinceNew > 5) {
        setSessionToast('⚠️ No new information in 5 minutes — consider an impasse-breaking technique');
      }
    }, 120000); // check every 2 minutes
    return () => clearInterval(checker);
  }, [status]);

  // AudioContext recovery on tab visibility change
  useEffect(() => {
    const handler = () => {
      if (document.hidden) return;
      if (audioContextRef.current?.state === "suspended") audioContextRef.current.resume();
      if (playbackContextRef.current?.state === "suspended") playbackContextRef.current.resume();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Session duration warnings (45min warn, 55min critical)
  useEffect(() => {
    if (status !== "LIVE") return;
    const warnTimer = setTimeout(() => {
      setSessionToast("Session has been running for 45 minutes. Consider saving your progress.");
    }, 45 * 60 * 1000);
    const criticalTimer = setTimeout(() => {
      setSessionToast("Session approaching 60-minute limit. Auto-saving transcript...");
      if (activeCase?.transcript) {
        safeLocalStorageSet("concordia_cases", cases);
      }
    }, 55 * 60 * 1000);
    return () => { clearTimeout(warnTimer); clearTimeout(criticalTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Dismiss session toast after 5s
  useEffect(() => {
    if (!sessionToast) return;
    const t = setTimeout(() => setSessionToast(null), 5000);
    return () => clearTimeout(t);
  }, [sessionToast]);

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

  // ── Caucus Mode ──────────────────────────────────────────────────────────────
  // A caucus is a private session with one party. The mediator can surface
  // information parties won't share in joint session and reality-test positions.
  const enterCaucus = useCallback((party: 'partyA' | 'partyB') => {
    if (!activeCase) return;
    setCaucusMode(party);
    const partyName = party === 'partyA'
      ? (activeCase.actors[0]?.name ?? 'Party A')
      : (activeCase.actors[1]?.name ?? 'Party B');
    sessionRef.current?.sendContext(
      `[CAUCUS MODE ACTIVATED — Private session with ${partyName}]\n` +
      `You are now in a PRIVATE CAUCUS with ${partyName} only. The other party cannot hear this.\n` +
      `In caucus:\n` +
      `- Be more direct about your assessment of their position's strengths and weaknesses\n` +
      `- Reality-test: "If we can't reach agreement, what's your Plan B?"\n` +
      `- Explore flexibility: "Hypothetically, if the other party offered X, would that be interesting?"\n` +
      `- Surface hidden interests: "Is there anything you haven't been comfortable sharing in joint session?"\n` +
      `- Remind them: "Anything you tell me here stays private unless you give me permission to share it"\n` +
      `- DO NOT share the other party's private caucus information\n` +
      `[END CAUCUS INSTRUCTION]`
    );
    console.log(`[Caucus] Entered caucus with ${partyName}`);
  }, [activeCase]);

  const exitCaucus = useCallback(() => {
    setCaucusMode('joint');
    sessionRef.current?.sendContext(
      `[CAUCUS ENDED — Returning to joint session]\n` +
      `Both parties are now present again. Summarize (WITHOUT revealing private caucus content) ` +
      `any progress or new understanding. Propose a next step.\n` +
      `[END CAUCUS INSTRUCTION]`
    );
    console.log('[Caucus] Returned to joint session');
  }, []);

  // ── Bidirectional context injection ─────────────────────────────────────────
  // Sends the current extracted conflict structure back into the live session so
  // the model can reference its own structural analysis during conversation.
  const injectContextToLive = useCallback(() => {
    if (!sessionRef.current || !activeCaseIdRef.current) return;
    const currentCase = casesRef.current.find((c) => c.id === activeCaseIdRef.current);
    if (!currentCase) return;
    const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    const contextUpdate = buildContextSummary(
      currentCase,
      liveMediationStateRef.current,
      agreementsRef.current,
    );
    if (!contextUpdate) return;
    try {
      sessionRef.current.sendContext(
        `[SYSTEM CONTEXT UPDATE at ${mm}:${ss}]\n${contextUpdate}\n[END CONTEXT UPDATE]`,
      );
      console.log(`[Context] Injected ${contextUpdate.length} chars at ${mm}:${ss}`);
    } catch (e) {
      console.warn("[Context] Failed to inject context:", e);
    }
  }, []); // reads from refs only — no stale closure risk

  const maybeInjectContext = useCallback(() => {
    const now = Date.now();
    if (now - lastContextInjectionRef.current < MIN_INJECTION_INTERVAL) return;
    lastContextInjectionRef.current = now;
    injectContextToLive();
  }, [injectContextToLive]);

  const checkMicPermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      return result.state !== "denied";
    } catch {
      return true; // Assume OK if permissions API not available
    }
  };

  const startSession = async () => {
    // Check microphone permission first
    const micOk = await checkMicPermission();
    if (!micOk) {
      setMicDenied(true);
      return;
    }
    setMicDenied(false);
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
            sessionStartTimeRef.current = Date.now();
            lastAutoExtractLengthRef.current = 0;
            aiTranscriptBuffer.current = "";
            userTranscriptBuffer.current = "";
            setSessionDuration(0);
            setStatus("LIVE");
            setIsRecording(true);
            startAudioCapture();
            // Extraction is debounced — triggered by turn completion (see shouldFlush block)
            lastExtractedPosRef.current = 0;
            // Session duration timer with milestone toasts
            sessionDurationIntervalRef.current = setInterval(() => {
              setSessionDuration((prev) => {
                const next = prev + 1;
                if (next === 180) setSessionToast("3-minute mark — consider a brief reflection pause");
                if (next === 600) setSessionToast("10 minutes — consider a phase transition check-in");
                if (next === 900) setSessionToast("15 minutes — check in on energy and focus levels");
                return next;
              });
            }, 1000);
            // Auto-save every 30s
            autoSaveIntervalRef.current = setInterval(() => {
              safeLocalStorageSet("concordia_cases", casesRef.current);
            }, 30000);
          },
          onmessage: async (message: any) => {
            if (sessionClosingRef.current) return;

            const base64Audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }

            // Buffer AI transcription fragments (arrive word-by-word)
            if (message.serverContent?.outputTranscription?.text) {
              aiTranscriptBuffer.current += message.serverContent.outputTranscription.text;
            }
            // Capture model text parts for non-audio response modes
            if (
              message.serverContent?.modelTurn?.parts?.[0]?.text &&
              !message.serverContent?.outputTranscription?.text
            ) {
              aiTranscriptBuffer.current += message.serverContent.modelTurn.parts[0].text;
            }
            // Buffer user transcription fragments (arrive word-by-word)
            if (message.serverContent?.inputTranscription?.text) {
              userTranscriptBuffer.current += message.serverContent.inputTranscription.text;
            }

            // FLUSH buffers when a turn completes or a tool call arrives
            const shouldFlush = message.serverContent?.turnComplete || message.toolCall;
            if (shouldFlush && activeCaseIdRef.current) {
              const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
              const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
              const ss = String(elapsed % 60).padStart(2, "0");
              const timestamp = `[${mm}:${ss}]`;

              const aiUtterance = aiTranscriptBuffer.current.trim();
              const userUtterance = userTranscriptBuffer.current.trim();

              if (aiUtterance) {
                setCases((prev) =>
                  prev.map((c) =>
                    c.id === activeCaseIdRef.current
                      ? {
                          ...c,
                          transcript:
                            c.transcript +
                            (c.transcript ? "\n\n" : "") +
                            `${timestamp} [Concordia]: ${aiUtterance}`,
                        }
                      : c,
                  ),
                );
                aiTranscriptBuffer.current = "";
              }
              if (userUtterance) {
                setCases((prev) =>
                  prev.map((c) =>
                    c.id === activeCaseIdRef.current
                      ? {
                          ...c,
                          transcript:
                            c.transcript +
                            (c.transcript ? "\n\n" : "") +
                            `${timestamp} [Speaker]: ${userUtterance}`,
                        }
                      : c,
                  ),
                );
                userTranscriptBuffer.current = "";
              }
              // Debounce extraction — 12s after last turn
              if (extractionTimerRef.current) clearTimeout(extractionTimerRef.current);
              extractionTimerRef.current = setTimeout(() => {
                autoExtractIncremental();
              }, 12000);
            }

            if (message.toolCall) {
              toolCallPendingRef.current = true;
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                const responses = functionCalls.map((call: any) => {
                  if (call.name === "updateMediationState") {
                    const args = call.args;
                    const phaseChanged =
                      liveMediationStateRef.current?.phase !== (args.phase || "Opening");
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
                    // On phase transition, immediately inject full context so the
                    // model enters the new phase with an up-to-date structural view
                    if (phaseChanged) {
                      setTimeout(() => injectContextToLive(), 300);
                    }
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "UI updated successfully" },
                    };
                  }
                  if (call.name === "requestMissingInformation") {
                    const args = call.args;
                    const notification: GapNotification = {
                      id: Date.now().toString() + Math.random(),
                      gapType: args.gapType || "structural",
                      description: args.description || "",
                      suggestedQuestion: args.suggestedQuestion || "",
                      priority: args.priority || "important",
                      targetParty: args.targetParty || "Both",
                      dismissed: false,
                    };
                    setGapNotifications((prev) => [notification, ...prev.slice(0, 4)]);
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "Gap notification displayed" },
                    };
                  }
                  if (call.name === "captureAgreement") {
                    const args = call.args;
                    const agreement: Agreement = {
                      id: Date.now().toString() + Math.random(),
                      topic: args.topic || "",
                      terms: args.terms || "",
                      conditions: args.conditions || [],
                      partyAAccepts: args.partyAAccepts ?? false,
                      partyBAccepts: args.partyBAccepts ?? false,
                      timestamp: new Date().toISOString(),
                    };
                    setAgreements((prev) => [...prev, agreement]);
                    // Immediately inject so model can reference the new agreement
                    setTimeout(() => injectContextToLive(), 300);
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "Agreement captured successfully" },
                    };
                  }
                  if (call.name === "flagEscalation") {
                    const args = call.args;
                    const flag: EscalationFlag = {
                      id: Date.now().toString() + Math.random(),
                      trigger: args.trigger || "",
                      category: args.category || "",
                      severity: args.severity ?? 5,
                      affectedParty: args.affectedParty || "Both",
                      deEscalationTechnique: args.deEscalationTechnique || "",
                      timestamp: new Date().toISOString(),
                    };
                    setEscalationScore((prev) => Math.min(100, prev + (args.severity ?? 5) * 10));
                    setEscalationBanner(flag);
                    setTimeout(() => setEscalationBanner(null), 8000);
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "Escalation flagged and de-escalation displayed" },
                    };
                  }
                  if (call.name === "proposeSolution") {
                    const args = call.args;
                    const proposal: SolutionProposal = {
                      id: Date.now().toString() + Math.random(),
                      title: args.title || "",
                      description: args.description || "",
                      framework: args.framework,
                      addressesPartyANeeds: args.addressesPartyANeeds || [],
                      addressesPartyBNeeds: args.addressesPartyBNeeds || [],
                      timestamp: new Date().toISOString(),
                    };
                    setActiveProposal(proposal);
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "Solution proposal displayed" },
                    };
                  }
                  if (call.name === "assessPowerDynamics") {
                    const args = call.args;
                    const dynamics: PowerDynamics = {
                      dimensions: args.dimensions || [],
                      overallBalance: args.overallBalance || "balanced",
                      rebalancingStrategy: args.rebalancingStrategy,
                      timestamp: new Date().toISOString(),
                    };
                    setPowerDynamics(dynamics);
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "Power dynamics map updated" },
                    };
                  }
                  if (call.name === "detectImpasse") {
                    const args = call.args;
                    const event: ImpasseEvent = {
                      id: Date.now().toString() + Math.random(),
                      signals: args.signals || [],
                      duration: args.duration,
                      lastNewInformation: args.lastNewInformation,
                      suggestedBreaker: args.suggestedBreaker || "",
                      timestamp: new Date().toISOString(),
                    };
                    setImpasseEvents((prev) => [event, ...prev.slice(0, 9)]);
                    setImpaseBanner(event);
                    setTimeout(() => setImpaseBanner(null), 12000);
                    setSessionToast(
                      `⚠️ Impasse detected — suggested technique: ${event.suggestedBreaker}`
                    );
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: "Impasse protocol activated" },
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
                  } finally {
                    toolCallPendingRef.current = false;
                  }
                } else {
                  toolCallPendingRef.current = false;
                }
              } else {
                toolCallPendingRef.current = false;
              }
            }
          },
          onclose: () => {
            const wasLive = !sessionClosingRef.current;
            sessionClosingRef.current = true;
            if (autoExtractionIntervalRef.current) {
              clearInterval(autoExtractionIntervalRef.current);
              autoExtractionIntervalRef.current = null;
            }
            if (extractionTimerRef.current) {
              clearTimeout(extractionTimerRef.current);
              extractionTimerRef.current = null;
            }
            if (sessionDurationIntervalRef.current) {
              clearInterval(sessionDurationIntervalRef.current);
              sessionDurationIntervalRef.current = null;
            }
            if (autoSaveIntervalRef.current) {
              clearInterval(autoSaveIntervalRef.current);
              autoSaveIntervalRef.current = null;
            }
            setStatus("DISCONNECTED");
            setIsRecording(false);
            stopAudioCapture();
            // If closed unexpectedly, save transcript and show banner
            if (wasLive) {
              safeLocalStorageSet("concordia_cases", casesRef.current);
              setConnectionLostBanner(true);
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            // Don't kill the session — the server/client reconnection logic will handle it
          },
          onreconnecting: () => {
            // Server or client is auto-reconnecting — keep UI alive, keep audio capture running
            setStatus("RECONNECTING");
            setReconnectCount((prev) => prev + 1);
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
    if (autoExtractionIntervalRef.current) {
      clearInterval(autoExtractionIntervalRef.current);
      autoExtractionIntervalRef.current = null;
    }
    if (extractionTimerRef.current) {
      clearTimeout(extractionTimerRef.current);
      extractionTimerRef.current = null;
    }
    if (sessionDurationIntervalRef.current) {
      clearInterval(sessionDurationIntervalRef.current);
      sessionDurationIntervalRef.current = null;
    }
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
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
    setGapNotifications([]);

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
        // Skip audio frames while a tool call is pending to prevent 1008 errors
        if (toolCallPendingRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
        }

        const base64 = arrayBufferToBase64(pcm16.buffer);

        if (isSessionOpen()) {
          try {
            sessionRef.current.sendRealtimeInput({
              audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
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
          currentAction: "[Fisher & Ury] Setting ground rules and establishing safe space for principled negotiation",
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
              conflictStyle: "Competing",
              emotionalIntensity: 5,
              emotionalTrajectory: "stable",
              trustTowardOther: { ability: 40, benevolence: 30, integrity: 35 },
              riskAssessment: { escalation: 25, withdrawal: 20, badFaith: 15, impasse: 30 },
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "Medium",
              communicationStyle: "Passive",
              cooperativeness: 50,
              defensiveness: 60,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk"],
              conflictStyle: "Avoiding",
              emotionalIntensity: 6,
              emotionalTrajectory: "stable",
              trustTowardOther: { ability: 45, benevolence: 35, integrity: 40 },
              riskAssessment: { escalation: 20, withdrawal: 35, badFaith: 10, impasse: 25 },
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
          currentAction: `[Lederach] Inviting ${partyA} to share their perspective — attending to narrative and root causes`,
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
              conflictStyle: "Competing",
              emotionalIntensity: 5,
              emotionalTrajectory: "stable",
              trustTowardOther: { ability: 42, benevolence: 32, integrity: 38 },
              riskAssessment: { escalation: 28, withdrawal: 18, badFaith: 15, impasse: 32 },
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "Medium",
              communicationStyle: "Passive",
              cooperativeness: 50,
              defensiveness: 60,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk"],
              conflictStyle: "Avoiding",
              emotionalIntensity: 6,
              emotionalTrajectory: "stable",
              trustTowardOther: { ability: 45, benevolence: 35, integrity: 40 },
              riskAssessment: { escalation: 22, withdrawal: 38, badFaith: 10, impasse: 28 },
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
          currentAction: `[Narrative] Processing ${partyA}'s opening statement — identifying grievance narrative and emotional framing`,
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
              conflictStyle: "Competing",
              emotionalIntensity: 7,
              emotionalTrajectory: "escalating",
              trustTowardOther: { ability: 35, benevolence: 22, integrity: 28 },
              riskAssessment: { escalation: 52, withdrawal: 15, badFaith: 20, impasse: 40 },
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "Medium",
              communicationStyle: "Passive",
              cooperativeness: 50,
              defensiveness: 60,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk"],
              conflictStyle: "Avoiding",
              emotionalIntensity: 6,
              emotionalTrajectory: "stable",
              trustTowardOther: { ability: 45, benevolence: 35, integrity: 40 },
              riskAssessment: { escalation: 25, withdrawal: 42, badFaith: 10, impasse: 30 },
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
          currentAction: `[Bush & Folger] Validated ${partyA}'s emotions (empowerment), pivoting to ${partyB} for recognition moment`,
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
              conflictStyle: "Competing",
              emotionalIntensity: 6,
              emotionalTrajectory: "de-escalating",
              trustTowardOther: { ability: 38, benevolence: 28, integrity: 32 },
              riskAssessment: { escalation: 42, withdrawal: 12, badFaith: 18, impasse: 38 },
            },
            partyB: {
              emotionalState: "Anxious",
              engagementLevel: "High",
              communicationStyle: "Passive",
              cooperativeness: 52,
              defensiveness: 55,
              keyNeeds: ["Security", "Autonomy"],
              riskFactors: ["Withdrawal risk", "Avoidance"],
              conflictStyle: "Avoiding",
              emotionalIntensity: 6,
              emotionalTrajectory: "stable",
              trustTowardOther: { ability: 48, benevolence: 38, integrity: 44 },
              riskAssessment: { escalation: 28, withdrawal: 36, badFaith: 10, impasse: 32 },
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
          currentAction: "[Zartman] Cross-referencing narratives — testing ripeness: is there a mutually hurting stalemate and a way out?",
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
              conflictStyle: "Compromising",
              emotionalIntensity: 4,
              emotionalTrajectory: "de-escalating",
              trustTowardOther: { ability: 52, benevolence: 40, integrity: 45 },
              riskAssessment: { escalation: 28, withdrawal: 10, badFaith: 12, impasse: 22 },
            },
            partyB: {
              emotionalState: "Hopeful",
              engagementLevel: "High",
              communicationStyle: "Collaborative",
              cooperativeness: 68,
              defensiveness: 35,
              keyNeeds: ["Autonomy", "Flexibility", "Harmony"],
              riskFactors: ["Conflict avoidance may mask issues"],
              conflictStyle: "Collaborating",
              emotionalIntensity: 4,
              emotionalTrajectory: "de-escalating",
              trustTowardOther: { ability: 58, benevolence: 52, integrity: 55 },
              riskAssessment: { escalation: 18, withdrawal: 22, badFaith: 8, impasse: 20 },
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
          currentAction: "[Fisher & Ury] Testing a process-based solution — mutual gains, objective criteria for future changes",
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
              conflictStyle: "Collaborating",
              emotionalIntensity: 3,
              emotionalTrajectory: "de-escalating",
              trustTowardOther: { ability: 65, benevolence: 58, integrity: 62 },
              riskAssessment: { escalation: 12, withdrawal: 8, badFaith: 5, impasse: 15 },
            },
            partyB: {
              emotionalState: "Hopeful",
              engagementLevel: "High",
              communicationStyle: "Collaborative",
              cooperativeness: 75,
              defensiveness: 25,
              keyNeeds: ["Flexibility", "Harmony", "Structure"],
              riskFactors: [],
              conflictStyle: "Collaborating",
              emotionalIntensity: 3,
              emotionalTrajectory: "de-escalating",
              trustTowardOther: { ability: 70, benevolence: 65, integrity: 68 },
              riskAssessment: { escalation: 8, withdrawal: 10, badFaith: 4, impasse: 12 },
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
      if (!resultStr) {
        console.error("[Extraction] Empty response from extractPrimitives");
        setStatus("ERROR");
        return;
      }
      const result = safeJsonParse(resultStr, null);
      if (!result) {
        console.error("[Extraction] Failed to parse extraction result:", resultStr);
        setStatus("ERROR");
        return;
      }

      let newActors = [...activeCase.actors];
      let newPrimitives = [...activeCase.primitives];

      result.actors?.forEach((a: any) => {
        if (!a?.name) return;
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
        if (!p) return;
        const actor = newActors.find(
          (a) => a.name.toLowerCase() === (p.actorName ?? p.actor)?.toLowerCase(),
        );
        const actorId = actor ? actor.id : newActors[0]?.id;
        const primitiveType = p.primitiveType ?? p.type;
        const desc: string = p.description ?? "";
        if (actorId && desc) {
          newPrimitives.push({
            id: Date.now().toString() + Math.random(),
            type: PRIMITIVE_TYPES.includes(primitiveType as PrimitiveType)
              ? (primitiveType as PrimitiveType)
              : "Claim",
            actorId,
            description: desc,
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
      const parsedPathways = safeJsonParse(pathwaysResStr, null);
      if (parsedPathways) {
        setPathways(parsedPathways);
        // Inject analysis results back into the live session so the model knows
        // the ZOPA, momentum score, and recommended next move
        if (sessionRef.current && isRecording) {
          const analysisContext =
            `[ANALYSIS RESULTS]\n` +
            `Executive Summary: ${parsedPathways.executiveSummary ?? "N/A"}\n` +
            `ZOPA: ${parsedPathways.zopaAnalysis?.exists ? parsedPathways.zopaAnalysis.overlapArea : "Not yet identified"}\n` +
            `Momentum: ${parsedPathways.momentumAssessment?.readinessToResolve ?? "?"}/100\n` +
            `Recommended Next Move: ${parsedPathways.momentumAssessment?.recommendedNextMove ?? "N/A"}\n` +
            `[END ANALYSIS]`;
          try {
            sessionRef.current.sendContext(analysisContext);
          } catch (e) {
            console.warn("[Context] Failed to inject analysis context:", e);
          }
        }
        // Also inject the full structured context (force — analysis is a major event)
        injectContextToLive();
      } else {
        console.error("[Pathways] Failed to parse pathways result:", pathwaysResStr);
      }

      setStatus("IDLE");
      setActiveTab("pathways");
    } catch (err) {
      console.error("Extraction error:", err);
      setStatus("ERROR");
    }
  };

  function wordOverlap(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const setB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    if (setA.size === 0 && setB.size === 0) return 1;
    const intersection = [...setA].filter((w) => setB.has(w)).length;
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  function mergeExtractedData(result: any) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== activeCaseIdRef.current) return c;
        const actors = [...c.actors];
        const primitives = [...c.primitives];

        result.actors?.forEach((a: any) => {
          if (!a?.name) return;
          const exists = actors.some(
            (e) => e.name.toLowerCase() === a.name.toLowerCase(),
          );
          if (!exists)
            actors.push({
              id:
                (typeof crypto.randomUUID === "function"
                  ? crypto.randomUUID()
                  : null) ??
                Date.now().toString() + Math.random(),
              name: a.name,
              role: a.role || "Unknown",
            });
        });

        result.primitives?.forEach((p: any) => {
          const desc = p?.description ?? "";
          if (!desc) return;
          const isDup = primitives.some(
            (e) => wordOverlap(e.description || "", desc) > 0.6,
          );
          if (!isDup) {
            const actor = actors.find(
              (a) =>
                a.name.toLowerCase() ===
                (p.actorName ?? p.actor)?.toLowerCase(),
            );
            primitives.push({
              id:
                (typeof crypto.randomUUID === "function"
                  ? crypto.randomUUID()
                  : null) ??
                Date.now().toString() + Math.random(),
              type: PRIMITIVE_TYPES.includes(p.primitiveType ?? p.type)
                ? (p.primitiveType ?? p.type)
                : "Claim",
              actorId: actor?.id || actors[0]?.id || "unknown",
              description: desc,
            });
          }
        });

        // Track time of last new primitive for impasse detection
        if (primitives.length > c.primitives.length) {
          lastNewPrimitiveTimeRef.current = Date.now();
        }
        return { ...c, actors, primitives };
      }),
    );
  }

  const autoExtractIncremental = async () => {
    const currentCase = casesRef.current.find(
      (c) => c.id === activeCaseIdRef.current,
    );
    if (!currentCase?.transcript) return;

    const newText = currentCase.transcript.slice(lastExtractedPosRef.current);
    if (newText.length < 150) return; // Need enough context

    lastExtractedPosRef.current = currentCase.transcript.length;
    setExtractionNotice(true);

    try {
      const resultStr = await extractPrimitives(newText);
      const result = safeJsonParse(resultStr, { actors: [], primitives: [] });
      mergeExtractedData(result);
      setTimeout(() => setExtractionNotice(false), 3000);
      // Feed extracted structure back into the live session
      setTimeout(() => maybeInjectContext(), 500);
    } catch (err) {
      console.error("Incremental extraction error:", err);
      setExtractionNotice(false);
    }
  };

  // Continuous background extraction during live sessions — duplicate-aware merge
  const autoExtractFromTranscript = async () => {
    if (!activeCaseIdRef.current) return;
    const currentCase = casesRef.current.find((c) => c.id === activeCaseIdRef.current);
    if (!currentCase?.transcript) return;
    const currentLength = currentCase.transcript.length;
    if (currentLength <= lastAutoExtractLengthRef.current + 200) return;
    lastAutoExtractLengthRef.current = currentLength;
    try {
      const resultStr = await extractPrimitives(currentCase.transcript);
      if (!resultStr) return;
      const result = safeJsonParse(resultStr, null);
      if (!result) {
        console.warn("[AutoExtract] Could not parse extraction result:", resultStr);
        return;
      }
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== activeCaseIdRef.current) return c;
          let newActors = [...c.actors];
          let newPrimitives = [...c.primitives];
          result.actors?.forEach((a: any) => {
            if (!a?.name) return;
            if (!newActors.find((existing) => existing.name.toLowerCase() === a.name.toLowerCase())) {
              newActors.push({ id: Date.now().toString() + Math.random(), name: a.name, role: a.role || "Unknown" });
            }
          });
          result.primitives?.forEach((p: any) => {
            if (!p) return;
            const actor = newActors.find((a) => a.name.toLowerCase() === (p.actorName ?? p.actor)?.toLowerCase());
            const actorId = actor ? actor.id : newActors[0]?.id;
            const primitiveType = p.primitiveType ?? p.type;
            const desc: string = p.description ?? "";
            if (actorId && desc && !newPrimitives.some((existing) => (existing.description ?? "").toLowerCase() === desc.toLowerCase())) {
              newPrimitives.push({
                id: Date.now().toString() + Math.random(),
                type: PRIMITIVE_TYPES.includes(primitiveType as PrimitiveType) ? (primitiveType as PrimitiveType) : "Claim",
                actorId,
                description: desc,
              });
            }
          });
          return { ...c, actors: newActors, primitives: newPrimitives };
        }),
      );
      setExtractionNotice(true);
      setTimeout(() => setExtractionNotice(false), 3000);
      // Inject full structured context back into the live session (debounced)
      setTimeout(() => maybeInjectContext(), 500);
    } catch (err) {
      console.warn("[AutoExtract] Background extraction failed:", err);
    }
  };

  const addTimelineEntry = useCallback((entry: Omit<TimelineEntry, "id" | "timestamp" | "elapsedSeconds" | "phase">) => {
    const elapsed = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;
    const newEntry: TimelineEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString(),
      elapsedSeconds: elapsed,
      phase: liveMediationState?.phase || "Opening",
      ...entry,
    };
    setCases((prev) =>
      prev.map((c) =>
        c.id === activeCaseIdRef.current
          ? { ...c, timeline: [...(c.timeline || []), newEntry] }
          : c,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMediationState?.phase]);

  const autoGroupPrimitives = () => {
    if (!activeCase) return;
    const clusters: PrimitiveCluster[] = [];
    activeCase.actors.forEach((actor) => {
      const actorPrims = activeCase.primitives.filter((p) => p.actorId === actor.id);
      if (actorPrims.length === 0) return;
      // Group by first significant word in description
      const groups: Record<string, string[]> = {};
      actorPrims.forEach((p) => {
        const key = p.description.toLowerCase().split(/\s+/).find((w) => w.length > 4) || "general";
        if (!groups[key]) groups[key] = [];
        groups[key].push(p.id);
      });
      Object.entries(groups).forEach(([keyword, ids]) => {
        if (ids.length >= 2) {
          clusters.push({
            id: Date.now().toString() + Math.random(),
            label: `${actor.name} — ${keyword}`,
            description: `Auto-grouped by keyword "${keyword}"`,
            primitiveIds: ids,
            phase: liveMediationState?.phase || "Discovery",
            createdAt: new Date().toISOString(),
          });
        }
      });
    });
    updateActiveCase({ clusters });
  };

  const findMergeDuplicates = (): Array<[string, string]> => {
    if (!activeCase) return [];
    const pairs: Array<[string, string]> = [];
    const prims = activeCase.primitives;
    for (let i = 0; i < prims.length; i++) {
      for (let j = i + 1; j < prims.length; j++) {
        if (prims[i].type === prims[j].type && wordOverlap(prims[i].description, prims[j].description) > 0.6) {
          pairs.push([prims[i].id, prims[j].id]);
        }
      }
    }
    return pairs;
  };

  const exportCaseJSON = () => {
    if (!activeCase) return;
    downloadFile(
      exportAsJSON(activeCase, pathways, summaryData),
      `concordia-case-${Date.now()}.json`,
      "application/json",
    );
  };

  const exportMarkdownReport = () => {
    if (!activeCase) return;
    downloadFile(
      exportAsMarkdown(activeCase, pathways ?? undefined, summaryData ?? undefined),
      `concordia-report-${Date.now()}.md`,
      "text/markdown",
    );
  };

  const exportTranscript = () => {
    if (!activeCase?.transcript) return;
    downloadFile(
      activeCase.transcript,
      `concordia-transcript-${Date.now()}.txt`,
      "text/plain",
    );
  };

  const handleAnalyzeWithFramework = async (fw?: string) => {
    if (!activeCase?.transcript) return;
    const frameworkToUse = fw ?? selectedFramework;
    setStatus("ANALYZING");
    try {
      const currentGraphContext = JSON.stringify(
        { actors: activeCase.actors, primitives: activeCase.primitives },
        null,
        2,
      );
      const resultStr = await analyzePathways(
        activeCase.transcript,
        currentGraphContext,
        frameworkToUse || undefined,
      );
      const parsed = safeJsonParse(resultStr, null);
      if (parsed) {
        setPathways(parsed);
        setExpandedPathways(new Set([0]));
        setActiveTab("pathways");
      } else {
        console.error("[Pathways] Could not parse framework analysis result:", resultStr);
      }
      setStatus("IDLE");
    } catch (err) {
      console.error("Framework analysis error:", err);
      setStatus("ERROR");
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeCase?.transcript) return;
    setSummaryLoading(true);
    setSummaryData(null);
    setShowSummary(true);
    try {
      const resultStr = await summarizeCase({
        transcript: activeCase.transcript,
        actors: activeCase.actors,
        primitives: activeCase.primitives,
        commonGround: liveMediationState?.commonGround || [],
        tensionPoints: liveMediationState?.tensionPoints || [],
      });
      setSummaryData(safeJsonParse(resultStr, null));
    } catch (err) {
      console.error("Summary generation error:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const exportSummaryAsMarkdown = () => {
    if (!summaryData || !activeCase) return;
    downloadFile(
      exportAsMarkdown(activeCase, pathways ?? undefined, summaryData),
      `concordia-summary-${Date.now()}.md`,
      "text/markdown",
    );
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

  // Knowledge graph — must be called before any early return (Rules of Hooks)
  const { nodes: graphNodes, edges: graphEdges, stats: ontologyStats } = useConflictGraph(
    activeCase?.actors ?? [],
    activeCase?.primitives ?? [],
    liveMediationState,
  );

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

  // Party claim counts for OntologyHealthCheck imbalance detection
  const actorA = activeCase?.actors[0];
  const actorB = activeCase?.actors[1];
  const partyAClaims = activeCase?.primitives.filter((p) => p.type === "Claim" && p.actorId === actorA?.id).length ?? 0;
  const partyBClaims = activeCase?.primitives.filter((p) => p.type === "Claim" && p.actorId === actorB?.id).length ?? 0;
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

        <SessionControls
          isRecording={isRecording}
          status={status}
          sessionDuration={sessionDuration}
          demoMode={demoMode}
          mediatorProfile={mediatorProfile}
          setMediatorProfile={setMediatorProfile}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showExport={showExport}
          setShowExport={setShowExport}
          onStart={startSession}
          onStop={stopSession}
          onDemo={startDemoSession}
          onExportMarkdown={exportMarkdownReport}
          onExportJSON={exportCaseJSON}
          onExportTranscript={exportTranscript}
          onGenerateSummary={handleGenerateSummary}
          hasTranscript={!!activeCase?.transcript}
          summaryLoading={summaryLoading}
          hasSummaryData={!!summaryData}
          onCopySummary={() => summaryData && navigator.clipboard.writeText(summaryData.sessionOverview)}
          onCopyTranscript={() => navigator.clipboard.writeText(activeCase?.transcript || "")}
          caucusMode={caucusMode}
          onEnterCaucus={enterCaucus}
          onExitCaucus={exitCaucus}
          partyAName={activeCase?.actors[0]?.name ?? 'Party A'}
          partyBName={activeCase?.actors[1]?.name ?? 'Party B'}
        />
      </header>

      {/* ─── LIVE STATUS BAR ─── */}
      {(isRecording || liveMediationState || gapNotifications.some((n) => !n.dismissed) || escalationBanner || sessionToast || healthScore < 50) && (
        <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0 max-h-48 overflow-y-auto">
          <LiveStatusBar
            liveMediationState={liveMediationState}
            gapNotifications={gapNotifications}
            setGapNotifications={setGapNotifications}
            status={status}
            isRecording={isRecording}
            escalationBanner={escalationBanner}
            setEscalationBanner={setEscalationBanner}
            sessionToast={sessionToast}
            setSessionToast={setSessionToast}
            healthScore={healthScore}
            onOpenGraph={() => setActiveTab("graph")}
            extractionNotice={extractionNotice}
          />
        </div>
      )}

      {/* ─── CAUCUS BANNER ─── */}
      {isRecording && caucusMode !== 'joint' && (
        <div className={`mx-6 mt-2 shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
          caucusMode === 'partyA'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            : 'bg-violet-500/10 border-violet-500/30 text-violet-300'
        }`}>
          <Users className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium flex-1">
            Private caucus with <span className="font-bold">
              {caucusMode === 'partyA'
                ? (activeCase?.actors[0]?.name ?? 'Party A')
                : (activeCase?.actors[1]?.name ?? 'Party B')}
            </span> — other party cannot hear this conversation
          </p>
          <button
            onClick={exitCaucus}
            className="text-xs underline hover:no-underline opacity-70 hover:opacity-100"
          >
            Return to joint session
          </button>
        </div>
      )}

      {/* ─── IMPASSE BANNER ─── */}
      {impaseBanner && (
        <div className="mx-6 mt-2 shrink-0 flex items-start gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-300">Impasse detected</p>
            <p className="text-xs text-orange-200/80 mt-0.5">
              Suggested technique: <span className="font-medium">{impaseBanner.suggestedBreaker}</span>
            </p>
            {impaseBanner.signals.length > 0 && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Signals: {impaseBanner.signals.join(' · ')}
              </p>
            )}
          </div>
          <button onClick={() => setImpaseBanner(null)} className="text-orange-400/60 hover:text-orange-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── RECONNECTION OVERLAY ─── */}
      {status === "RECONNECTING" && (
        <div className="mx-6 mt-2 shrink-0 flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <Activity className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-200 font-medium">Reconnecting session…</p>
            {reconnectCount > 0 && <p className="text-xs text-yellow-400/70">Attempt {reconnectCount}</p>}
          </div>
        </div>
      )}

      {/* ─── MIC DENIED BANNER ─── */}
      {micDenied && (
        <div className="mx-6 mt-2 shrink-0 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-200 flex-1">
            Microphone access denied. Enable it in your browser settings (Site Settings → Microphone → Allow), then retry.
          </p>
          <button onClick={() => setMicDenied(false)} className="text-red-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ─── CONNECTION LOST BANNER ─── */}
      {connectionLostBanner && (
        <div className="mx-6 mt-2 shrink-0 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-200 flex-1">Connection lost. Your transcript has been saved.</p>
          <button
            onClick={() => { exportTranscript(); setConnectionLostBanner(false); }}
            className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors"
          >Download Transcript</button>
          <button
            onClick={() => { setConnectionLostBanner(false); startSession(); }}
            className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          >Reconnect</button>
          <button onClick={() => setConnectionLostBanner(false)} className="text-red-400/60 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* ─── LEFT: Party Profiles ─── */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          {activeCase?.profilingEnabled !== false ? (
            <>
              <ErrorPanel fallbackMessage="Profile unavailable">
              <EnhancedPartyProfile
                name={activeCase?.partyAName || "Party A"}
                profile={liveMediationState?.partyProfiles?.partyA || null}
                side="A"
              />
              </ErrorPanel>
              <ErrorPanel fallbackMessage="Profile unavailable">
              <EnhancedPartyProfile
                name={activeCase?.partyBName || "Party B"}
                profile={liveMediationState?.partyProfiles?.partyB || null}
                side="B"
              />
              </ErrorPanel>
              {/* ── Escalation Meter ── */}
              <EscalationMeter
                escalationScore={Math.max(
                  liveMediationState?.partyProfiles?.partyA?.riskAssessment?.escalation ?? 0,
                  liveMediationState?.partyProfiles?.partyB?.riskAssessment?.escalation ?? 0,
                )}
              />
            </>
          ) : (
            <>
              {/* Simple party cards when profiling is disabled */}
              {[
                { name: activeCase?.partyAName || "Party A", profile: liveMediationState?.partyProfiles?.partyA, color: "blue" },
                { name: activeCase?.partyBName || "Party B", profile: liveMediationState?.partyProfiles?.partyB, color: "violet" },
              ].map(({ name, profile, color }) => (
                <div key={name} className={`bg-[var(--color-surface)] border border-${color}-500/20 rounded-xl p-4`}>
                  <div className="font-semibold text-sm text-white mb-2">{name}</div>
                  {profile ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        Emotion: <span className="text-white">{profile.emotionalState || "—"}</span>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">
                        Engagement: <span className="text-white">{profile.engagementLevel || "—"}</span>
                      </div>
                      {profile.keyNeeds?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.keyNeeds.slice(0, 3).map((n, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[var(--color-bg)] rounded text-[var(--color-text-muted)]">{n}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic">Waiting for session…</p>
                  )}
                </div>
              ))}
              <button
                onClick={() => updateActiveCase({ profilingEnabled: true })}
                className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] text-center py-2 border border-dashed border-[var(--color-border)] rounded-xl transition-colors"
              >
                Enable psychological profiling for deeper analysis →
              </button>
            </>
          )}

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

          {/* ── Active Proposal Card ── */}
          <AnimatePresence>
            {activeProposal && (
              <motion.div
                key={activeProposal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Proposal
                  </h3>
                  <button onClick={() => setActiveProposal(null)} className="text-indigo-400/50 hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-bold text-white mb-1">{activeProposal.title}</p>
                {activeProposal.framework && (
                  <span className="text-[9px] font-mono uppercase text-indigo-400/70">{activeProposal.framework}</span>
                )}
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-relaxed">{activeProposal.description}</p>
                {activeProposal.addressesPartyANeeds.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[9px] uppercase tracking-wider text-sky-400 mb-1">Addresses Party A</div>
                    <ul className="space-y-0.5">
                      {activeProposal.addressesPartyANeeds.map((n, i) => (
                        <li key={i} className="text-[10px] text-sky-200 flex items-start gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-sky-500 mt-0.5 shrink-0" />{n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeProposal.addressesPartyBNeeds.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[9px] uppercase tracking-wider text-violet-400 mb-1">Addresses Party B</div>
                    <ul className="space-y-0.5">
                      {activeProposal.addressesPartyBNeeds.map((n, i) => (
                        <li key={i} className="text-[10px] text-violet-200 flex items-start gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-violet-500 mt-0.5 shrink-0" />{n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Agreements Panel ── */}
          <AgreementTracker agreements={agreements} />

          {/* ── Mediator Playbook ── */}
          <MediatorPlaybook
            phase={liveMediationState?.phase || "Opening"}
            gapNotifications={gapNotifications}
            missingPrimitives={PRIMITIVE_TYPES.filter(
              (t) => !activeCase?.primitives.some((p) => p.type === t),
            )}
          />
        </div>

        {/* ─── CENTER: Tabbed Content ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-1 mb-3 shrink-0 flex-wrap">
            {(
              [
                { id: "transcript" as const, label: "Live Transcript", icon: FileText },
                { id: "structure" as const, label: `Case Structure${activeCase?.primitives.length ? ` (${activeCase.primitives.length})` : ""}`, icon: Database },
                { id: "pathways" as const, label: "Resolution Pathways", icon: Lightbulb },
                { id: "graph" as const, label: "Knowledge Graph", icon: Network },
                { id: "timeline" as const, label: "Timeline", icon: History },
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
            <TranscriptPanel
              transcript={activeCase?.transcript ?? ""}
              isLive={isRecording || status === "LIVE" || status === "RECONNECTING"}
              extractionNotice={extractionNotice}
              autoScrollEnabled={autoScrollEnabled}
              setAutoScrollEnabled={setAutoScrollEnabled}
              transcriptEndRef={transcriptEndRef}
              partyAName={activeCase?.partyAName ?? "Party A"}
              partyBName={activeCase?.partyBName ?? "Party B"}
              onTranscriptChange={(val) => updateActiveCase({ transcript: val })}
              onScrollToLatest={() => {
                setAutoScrollEnabled(true);
                transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              onAnalyze={handleSimulateExtraction}
              isAnalyzing={status === "ANALYZING"}
              isRecording={isRecording}
            />
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={autoGroupPrimitives}
                    disabled={!activeCase || activeCase.primitives.length < 2}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)] transition-colors disabled:opacity-40"
                    title="Auto-group primitives by topic"
                  >
                    <GitMerge className="w-3.5 h-3.5" /> Auto-Group
                  </button>
                  <button
                    onClick={() => {
                      const pairs = findMergeDuplicates();
                      if (pairs.length === 0) return;
                      // Remove the second duplicate in each pair
                      const toRemove = new Set(pairs.map(([, b]) => b));
                      updateActiveCase({ primitives: activeCase!.primitives.filter((p) => !toRemove.has(p.id)) });
                    }}
                    disabled={!activeCase || activeCase.primitives.length < 2}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-amber-500 transition-colors disabled:opacity-40"
                    title="Merge near-duplicate primitives"
                  >
                    <Filter className="w-3.5 h-3.5" /> Merge Dupes
                  </button>
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
                        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                        .map((prim) => (
                          <div
                            key={prim.id}
                            className={`flex items-start gap-2 group rounded-lg px-2 py-1 transition-colors ${prim.resolved ? "opacity-50" : ""} ${prim.pinned ? "bg-amber-500/5 border border-amber-500/20" : ""}`}
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
                              className={`bg-transparent text-sm flex-1 focus:outline-none border-b border-transparent focus:border-[var(--color-accent)] px-1 ${prim.resolved ? "line-through text-[var(--color-text-muted)]" : "text-white"}`}
                              placeholder="Description..."
                            />
                            <button
                              onClick={() => updatePrimitive(prim.id, { pinned: !prim.pinned })}
                              className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity ${prim.pinned ? "text-amber-400 opacity-100" : "text-[var(--color-text-muted)] hover:text-amber-400"}`}
                              title={prim.pinned ? "Unpin" : "Pin"}
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => updatePrimitive(prim.id, { resolved: !prim.resolved })}
                              className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity ${prim.resolved ? "text-emerald-400 opacity-100" : "text-[var(--color-text-muted)] hover:text-emerald-400"}`}
                              title={prim.resolved ? "Reopen" : "Mark resolved"}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
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
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {/* Framework selector toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm p-2 focus:outline-none focus:border-[var(--color-accent)] text-[var(--color-text-muted)]"
                >
                  <option value="">All Frameworks</option>
                  <option value="Fisher & Ury">Fisher &amp; Ury (Principled Negotiation)</option>
                  <option value="Transformative">Transformative Mediation (Bush &amp; Folger)</option>
                  <option value="Narrative">Narrative Mediation (Winslade &amp; Monk)</option>
                  <option value="Glasl">Glasl Escalation Model</option>
                  <option value="Lederach">Lederach Conflict Transformation</option>
                  <option value="Zartman">Zartman Ripeness Theory</option>
                </select>
                <button
                  onClick={() => handleAnalyzeWithFramework()}
                  disabled={!activeCase?.transcript || status === "ANALYZING"}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {status === "ANALYZING" ? <Activity className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  {selectedFramework ? "Re-analyze" : "Analyze"}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 overflow-y-auto">
                {pathways ? (
                  <div className="space-y-8">
                    {/* Power Map */}
                    {powerDynamics && activeCase && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl">
                        <PowerMap
                          dimensions={powerDynamics.dimensions}
                          overallBalance={powerDynamics.overallBalance}
                          rebalancingStrategy={powerDynamics.rebalancingStrategy}
                          partyAName={activeCase.actors[0]?.name ?? 'Party A'}
                          partyBName={activeCase.actors[1]?.name ?? 'Party B'}
                        />
                      </motion.div>
                    )}

                    {/* Executive Summary */}
                    {pathways.executiveSummary && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5" /> Executive Summary
                        </h3>
                        <p className="text-sm text-white leading-relaxed">{pathways.executiveSummary}</p>
                      </motion.div>
                    )}

                    {/* Common Ground */}
                    {pathways.commonGround?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" /> Common Ground
                        </h3>
                        <div className="space-y-2">
                          {pathways.commonGround.map((item: any, i: number) => {
                            const text = typeof item === "string" ? item : item.item;
                            const strength = typeof item === "object" ? item.strength : null;
                            const evidence = typeof item === "object" ? item.evidence : null;
                            return (
                              <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                  <div className="flex-1 text-sm text-white">
                                    <span>{text}</span>
                                    {strength && (
                                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-mono ${strength === "strong" ? "bg-emerald-500/20 text-emerald-300" : strength === "moderate" ? "bg-amber-500/20 text-amber-300" : "bg-gray-500/20 text-gray-400"}`}>{strength}</span>
                                    )}
                                    {evidence && <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{evidence}</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Critical Questions */}
                    {pathways.criticalQuestions?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <Target className="w-4 h-4" /> Critical Questions
                        </h3>
                        <div className="space-y-2">
                          {pathways.criticalQuestions.map((item: any, i: number) => {
                            const text = typeof item === "string" ? item : item.question;
                            const fw = typeof item === "object" ? item.framework : null;
                            const target = typeof item === "object" ? item.target : null;
                            return (
                              <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <span className="text-amber-500 font-bold shrink-0 text-sm">Q{i + 1}.</span>
                                  <div className="flex-1 text-sm text-white">
                                    <p>{text}</p>
                                    {(target || fw) && (
                                      <div className="flex gap-2 mt-1.5 flex-wrap">
                                        {target && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded font-mono">→ {target}</span>}
                                        {fw && <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 text-violet-300 rounded font-mono">{fw}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Resolution Pathways */}
                    {pathways.pathways?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <h3 className="text-sm font-bold text-[var(--color-accent)] mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <TrendingUp className="w-4 h-4" /> Resolution Pathways
                        </h3>
                        <div className="space-y-3">
                          {pathways.pathways.map((pathway: any, i: number) => {
                            if (typeof pathway === "string") {
                              return (
                                <div key={i} className="bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-lg p-3 text-sm text-white flex items-start gap-2">
                                  <Lightbulb className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />{pathway}
                                </div>
                              );
                            }
                            const isExpanded = expandedPathways.has(i);
                            const feasColor = pathway.feasibility === "high" ? "text-emerald-400 bg-emerald-500/10" : pathway.feasibility === "medium" ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10";
                            return (
                              <div key={i} className="bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => setExpandedPathways((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-[var(--color-accent)]/10 transition-colors"
                                >
                                  <Lightbulb className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-white">{pathway.title}</span>
                                    {pathway.framework && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 font-mono">{pathway.framework}</span>}
                                    {pathway.feasibility && <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${feasColor}`}>{pathway.feasibility} feasibility</span>}
                                  </div>
                                  <ChevronLeft className={`w-4 h-4 text-[var(--color-text-muted)] shrink-0 transition-transform ${isExpanded ? "-rotate-90" : "rotate-180"}`} />
                                </button>
                                {isExpanded && (
                                  <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-accent)]/10 pt-3">
                                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{pathway.description}</p>
                                    {(pathway.tradeoffsForA || pathway.tradeoffsForB) && (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                          <div className="text-[10px] font-mono uppercase text-blue-400 mb-1">For {activeCase?.partyAName || "Party A"}</div>
                                          <p className="text-xs text-white">{pathway.tradeoffsForA}</p>
                                        </div>
                                        <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                                          <div className="text-[10px] font-mono uppercase text-violet-400 mb-1">For {activeCase?.partyBName || "Party B"}</div>
                                          <p className="text-xs text-white">{pathway.tradeoffsForB}</p>
                                        </div>
                                      </div>
                                    )}
                                    {pathway.implementationSteps?.length > 0 && (
                                      <div>
                                        <div className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] mb-2">Implementation Steps</div>
                                        <ol className="space-y-1.5">
                                          {pathway.implementationSteps.map((step: string, j: number) => (
                                            <li key={j} className="flex items-start gap-2 text-xs text-white">
                                              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                                              {step}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* ZOPA Analysis */}
                    {pathways.zopaAnalysis && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <Zap className="w-4 h-4" /> Zone of Possible Agreement (ZOPA)
                        </h3>
                        {pathways.zopaAnalysis.exists ? (
                          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-3">
                            <p className="text-sm text-white">{pathways.zopaAnalysis.description}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-blue-300 w-20 shrink-0 font-mono truncate">{activeCase?.partyAName || "Party A"}</span>
                                <div className="flex-1 h-7 bg-blue-500/20 rounded-lg flex items-center px-3"><span className="text-[10px] text-blue-200">{pathways.zopaAnalysis.partyARange}</span></div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-violet-300 w-20 shrink-0 font-mono truncate">{activeCase?.partyBName || "Party B"}</span>
                                <div className="flex-1 h-7 bg-violet-500/20 rounded-lg flex items-center px-3"><span className="text-[10px] text-violet-200">{pathways.zopaAnalysis.partyBRange}</span></div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-cyan-300 w-20 shrink-0 font-mono">Overlap</span>
                                <div className="flex-1 h-7 bg-cyan-500/30 border border-cyan-500/40 rounded-lg flex items-center px-3"><span className="text-[10px] text-cyan-200 font-semibold">{pathways.zopaAnalysis.overlapArea}</span></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                            <p className="text-sm text-red-200 mb-2">No ZOPA currently identified.</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{pathways.zopaAnalysis.description}</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Framework Fit */}
                    {pathways.frameworkFit?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <h3 className="text-sm font-bold text-violet-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <BookOpen className="w-4 h-4" /> Framework Fit
                        </h3>
                        <div className="space-y-2">
                          {[...pathways.frameworkFit].sort((a: any, b: any) => b.score - a.score).slice(0, 4).map((fit: any, i: number) => (
                            <div key={i} className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm font-semibold text-white">{fit.framework}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${fit.score >= 70 ? "bg-emerald-500/20 text-emerald-300" : fit.score >= 40 ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>{fit.score}/100</span>
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)]">{fit.rationale}</p>
                              </div>
                              <button
                                onClick={() => { setSelectedFramework(fit.framework); handleAnalyzeWithFramework(fit.framework); }}
                                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 transition-colors"
                              >Apply</button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Psychological Dynamics */}
                    {pathways.psychologicalDynamics?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h3 className="text-sm font-bold text-violet-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <Brain className="w-4 h-4" /> Psychological Dynamics
                        </h3>
                        <div className="space-y-2">
                          {pathways.psychologicalDynamics.map((item: string, i: number) => (
                            <div key={i} className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-sm text-white flex items-start gap-2">
                              <Activity className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />{item}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Momentum Assessment */}
                    {pathways.momentumAssessment && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <TrendingUp className="w-4 h-4" /> Momentum Assessment
                        </h3>
                        <div className="space-y-3">
                          {/* Readiness bar */}
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Readiness to Resolve</span>
                              <span className="text-lg font-bold text-emerald-400 font-mono">{pathways.momentumAssessment.readinessToResolve}/100</span>
                            </div>
                            <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pathways.momentumAssessment.readinessToResolve}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                              />
                            </div>
                            {pathways.momentumAssessment.recommendedNextMove && (
                              <p className="text-xs text-emerald-300 mt-3 font-medium">
                                <span className="text-[var(--color-text-muted)]">Recommended next move: </span>
                                {pathways.momentumAssessment.recommendedNextMove}
                              </p>
                            )}
                          </div>
                          {/* Blockers & Catalysts */}
                          <div className="grid grid-cols-2 gap-3">
                            {pathways.momentumAssessment.blockers?.length > 0 && (
                              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Blockers</h4>
                                <ul className="space-y-1">
                                  {pathways.momentumAssessment.blockers.map((b: string, i: number) => (
                                    <li key={i} className="text-xs text-red-200 flex items-start gap-1.5">
                                      <span className="text-red-500 mt-0.5 shrink-0">▪</span>{b}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {pathways.momentumAssessment.catalysts?.length > 0 && (
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Catalysts</h4>
                                <ul className="space-y-1">
                                  {pathways.momentumAssessment.catalysts.map((c: string, i: number) => (
                                    <li key={i} className="text-xs text-emerald-200 flex items-start gap-1.5">
                                      <span className="text-emerald-500 mt-0.5 shrink-0">▪</span>{c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : research ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white leading-relaxed">{research.text}</p>
                    {research.chunks?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <h4 className="text-xs font-semibold uppercase mb-2 text-[var(--color-text-muted)]">Sources</h4>
                        <ul className="space-y-1">
                          {research.chunks.map((chunk: any, idx: number) => (
                            <li key={idx} className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer truncate">
                              {chunk.web?.title || chunk.web?.uri}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                    <Lightbulb className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">No analysis yet</p>
                    <p className="text-xs mt-1 opacity-60">Run a live session or enter context and click &quot;Analyze&quot; to generate resolution pathways</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── KNOWLEDGE GRAPH TAB ── */}
          {activeTab === "graph" && (
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Graph canvas */}
              <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl flex flex-col overflow-hidden">
                {/* Party highlight selector */}
                <div className="flex items-center gap-2 px-3 pt-3 shrink-0">
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Highlight:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setHighlightActorId(null)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${!highlightActorId ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-white"}`}
                    >All</button>
                    {activeCase?.actors.map((actor) => (
                      <button
                        key={actor.id}
                        onClick={() => setHighlightActorId(highlightActorId === actor.id ? null : actor.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${highlightActorId === actor.id ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-white"}`}
                      >{actor.name}</button>
                    ))}
                  </div>
                </div>
                <ErrorPanel fallbackMessage="Graph rendering failed">
                  <ConflictGraph nodes={graphNodes} edges={graphEdges} highlightActorId={highlightActorId} />
                </ErrorPanel>
              </div>
              {/* Health check + Power Map sidebar */}
              <div className="w-72 shrink-0 overflow-y-auto space-y-4">
                <OntologyHealthCheck
                  stats={ontologyStats}
                  partyAName={activeCase?.partyAName || "Party A"}
                  partyBName={activeCase?.partyBName || "Party B"}
                  partyAClaims={partyAClaims}
                  partyBClaims={partyBClaims}
                />
                {powerDynamics && activeCase && (
                  <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <PowerMap
                      dimensions={powerDynamics.dimensions}
                      overallBalance={powerDynamics.overallBalance}
                      rebalancingStrategy={powerDynamics.rebalancingStrategy}
                      partyAName={activeCase.actors[0]?.name ?? 'Party A'}
                      partyBName={activeCase.actors[1]?.name ?? 'Party B'}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-4 shrink-0">
                <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
                <div className="flex gap-1 flex-wrap">
                  {["all", "utterance", "extraction", "phase-change", "escalation", "common-ground"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTimelineFilter(f)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${timelineFilter === f ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-white"}`}
                    >{f === "all" ? "All Events" : f.replace(/-/g, " ")}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                {(activeCase?.timeline?.filter((e) => timelineFilter === "all" || e.type === timelineFilter) || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                    <History className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">No timeline events yet</p>
                    <p className="text-xs mt-1 opacity-60">Timeline is populated automatically during live sessions</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--color-border)]" />
                    <div className="space-y-3 pl-12">
                      {activeCase!.timeline!
                        .filter((e) => timelineFilter === "all" || e.type === timelineFilter)
                        .map((entry) => {
                          const mm = String(Math.floor(entry.elapsedSeconds / 60)).padStart(2, "0");
                          const ss = String(entry.elapsedSeconds % 60).padStart(2, "0");
                          const typeColors: Record<string, string> = {
                            utterance: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
                            extraction: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
                            "phase-change": "bg-violet-500/20 border-violet-500/40 text-violet-300",
                            escalation: "bg-red-500/20 border-red-500/40 text-red-300",
                            "common-ground": "bg-teal-500/20 border-teal-500/40 text-teal-300",
                            reflection: "bg-amber-500/20 border-amber-500/40 text-amber-300",
                          };
                          return (
                            <div key={entry.id} className="relative">
                              <div className={`absolute -left-8 w-4 h-4 rounded-full border-2 ${typeColors[entry.type] || "bg-gray-500/20 border-gray-500/40 text-gray-300"} flex items-center justify-center`} style={{ top: "4px" }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                              </div>
                              <div className={`rounded-lg border px-3 py-2 ${typeColors[entry.type] || "border-[var(--color-border)] text-[var(--color-text-muted)]"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-mono">{mm}:{ss}</span>
                                  <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{entry.type.replace(/-/g, " ")}</span>
                                  {entry.actor && <span className="text-[10px] opacity-60">· {entry.actor}</span>}
                                </div>
                                <p className="text-xs text-white">{entry.content}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
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

      {/* ─── CASE SUMMARY MODAL ─── */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSummary(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                  <div>
                    <h2 className="font-bold text-white">Case Summary</h2>
                    <p className="text-xs text-[var(--color-text-muted)]">{activeCase?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {summaryData && (
                    <>
                      <button
                        onClick={() => navigator.clipboard.writeText(
                          [summaryData.sessionOverview,
                            ...summaryData.recommendedNextSteps].join("\n\n")
                        )}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white transition-colors"
                      >Copy</button>
                      <button
                        onClick={exportSummaryAsMarkdown}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white transition-colors"
                      >Export .md</button>
                    </>
                  )}
                  <button onClick={() => setShowSummary(false)} className="p-1.5 hover:bg-[var(--color-surface-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Activity className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
                    <p className="text-sm text-[var(--color-text-muted)]">Generating case summary…</p>
                  </div>
                ) : summaryData ? (
                  <>
                    {/* Session Overview */}
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                      <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Session Overview</h3>
                      <p className="text-sm text-white leading-relaxed">{summaryData.sessionOverview}</p>
                    </div>

                    {/* Key Claims side by side */}
                    <div>
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Key Claims</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                          <div className="text-[10px] font-mono text-blue-400 uppercase mb-2">{activeCase?.partyAName || "Party A"}</div>
                          <ul className="space-y-1.5">
                            {summaryData.keyClaimsPartyA.map((c, i) => <li key={i} className="text-xs text-white flex items-start gap-1.5"><span className="text-blue-400 shrink-0 mt-0.5">•</span>{c}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                          <div className="text-[10px] font-mono text-violet-400 uppercase mb-2">{activeCase?.partyBName || "Party B"}</div>
                          <ul className="space-y-1.5">
                            {summaryData.keyClaimsPartyB.map((c, i) => <li key={i} className="text-xs text-white flex items-start gap-1.5"><span className="text-violet-400 shrink-0 mt-0.5">•</span>{c}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Core Interests side by side */}
                    <div>
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Core Interests</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                          <div className="text-[10px] font-mono text-blue-400 uppercase mb-2">{activeCase?.partyAName || "Party A"}</div>
                          <ul className="space-y-1.5">
                            {summaryData.coreInterestsPartyA.map((c, i) => <li key={i} className="text-xs text-white flex items-start gap-1.5"><span className="text-emerald-400 shrink-0 mt-0.5">•</span>{c}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                          <div className="text-[10px] font-mono text-violet-400 uppercase mb-2">{activeCase?.partyBName || "Party B"}</div>
                          <ul className="space-y-1.5">
                            {summaryData.coreInterestsPartyB.map((c, i) => <li key={i} className="text-xs text-white flex items-start gap-1.5"><span className="text-emerald-400 shrink-0 mt-0.5">•</span>{c}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Areas of Agreement */}
                    {summaryData.areasOfAgreement.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Areas of Agreement</h3>
                        <div className="space-y-1.5">
                          {summaryData.areasOfAgreement.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-white">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unresolved Tensions */}
                    {summaryData.unresolvedTensions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Unresolved Tensions</h3>
                        <div className="space-y-1.5">
                          {summaryData.unresolvedTensions.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-white">
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />{item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {summaryData.recommendedNextSteps.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-3">Recommended Next Steps</h3>
                        <ol className="space-y-2">
                          {summaryData.recommendedNextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-white">
                              <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                    <AlertTriangle className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Failed to generate summary. Please try again.</p>
                    <button onClick={handleGenerateSummary} className="text-sm text-[var(--color-accent)] hover:underline">Retry</button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── KEYBOARD SHORTCUTS HELP ─── */}
      <KeyboardShortcutsHelp open={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />
    </div>
  );
}
