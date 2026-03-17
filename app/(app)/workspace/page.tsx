"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Printer,
  Copy,
} from "lucide-react";
import {
  getLiveSession,
  joinRoomSession,
  extractPrimitives,
  researchGrounding,
  analyzePathways,
  summarizeCase,
  generateAgreementDoc,
  analyzeCommonGround,
} from "@/services/gemini-client";
import type { Actor, Primitive, PrimitiveType, Case, LiveMediationState, OntologyStats, PartyProfile, GapNotification, CaseSummary, TimelineEntry, PrimitiveCluster, Agreement, EscalationFlag, SolutionProposal, PowerDynamics, ImpasseEvent, IntakeData, EmotionSnapshot } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";
import { exportAsMarkdown, exportAsJSON, downloadFile, generateAgreementHTML, formatAgreementAsText } from "@/lib/export";
import IntakeWizard from "@/components/workspace/IntakeWizard";
import { useConflictGraph } from "@/hooks/useConflictGraph";
import { buildConflictGraph } from "@/lib/graph-builder";
import EscalationAlert from "@/components/workspace/EscalationAlert";
import IntelligenceSidebar from "@/components/workspace/IntelligenceSidebar";
import { ErrorPanel } from "@/components/ErrorPanel";
import SessionControls from "@/components/workspace/SessionControls";
import LiveStatusBar from "@/components/workspace/LiveStatusBar";
import TranscriptPanel from "@/components/workspace/TranscriptPanel";
import MediatorStatus from "@/components/workspace/MediatorStatus";
import type { MediatorState } from "@/components/workspace/MediatorStatus";
import TextInput from "@/components/workspace/TextInput";
import KeyboardShortcutsHelp from "@/components/workspace/KeyboardShortcutsHelp";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import PhaseTimeline from "@/components/workspace/PhaseTimeline";
import MediatorControls from "@/components/workspace/MediatorControls";
import type { SessionMode } from "@/components/workspace/MediatorControls";
import MediationTimer from "@/components/workspace/MediationTimer";
import ConnectionStatus from "@/components/workspace/ConnectionStatus";
import QuickActions from "@/components/workspace/QuickActions";
import BlindBidding from "@/components/workspace/BlindBidding";

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
    const a1Count = activeCase.primitives.filter((p) => p.actorId === actors[0]?.id).length;
    const a2Count = activeCase.primitives.filter((p) => p.actorId === actors[1]?.id).length;
    if (a1Count > 0 && a2Count > 0) {
      const ratio = Math.max(a1Count, a2Count) / Math.min(a1Count, a2Count);
      if (ratio > 2) {
        const underRepresented = a1Count < a2Count ? (actors[0]?.name ?? "Party A") : (actors[1]?.name ?? "Party B");
        sections.push(
          `⚠️ EXTRACTION IMBALANCE: ${underRepresented} is under-represented (${Math.min(a1Count, a2Count)} vs ${Math.max(a1Count, a2Count)} primitives). Give them more airtime.`,
        );
      }
    }
  }

  return sections.join("\n\n");
}

// ─── Empty State helper ───────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 max-w-[280px]">{description}</p>
    </div>
  );
}

// ─── Skeleton Loading helper ──────────────────────────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-4 bg-slate-700/50 rounded w-2/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-slate-700/30 rounded-lg" />
        <div className="h-16 bg-slate-700/30 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-700/40 rounded w-full" />
        <div className="h-3 bg-slate-700/40 rounded w-5/6" />
        <div className="h-3 bg-slate-700/40 rounded w-4/6" />
      </div>
      <div className="h-4 bg-slate-700/50 rounded w-1/2" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 bg-slate-700/30 rounded-lg" />
        <div className="h-10 bg-slate-700/30 rounded-lg" />
        <div className="h-10 bg-slate-700/30 rounded-lg" />
      </div>
    </div>
  );
}

function WorkspaceInner() {
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
  const [solutions, setSolutions] = useState<SolutionProposal[]>([]);
  const [escalationBanner, setEscalationBanner] = useState<EscalationFlag | null>(null);
  const [escalationFlags, setEscalationFlags] = useState<EscalationFlag[]>([]);
  const [caucusMode, setCaucusMode] = useState<'joint' | 'partyA' | 'partyB'>('joint');
  const [powerDynamics, setPowerDynamics] = useState<PowerDynamics | null>(null);
  const [impasseEvents, setImpasseEvents] = useState<ImpasseEvent[]>([]);
  const [zopaHints, setZopaHints] = useState<string[]>([]);
  const [impaseBanner, setImpaseBanner] = useState<ImpasseEvent | null>(null);
  const [showBlindBidding, setShowBlindBidding] = useState(false);
  const [mediatorThought, setMediatorThought] = useState<string>("");
  const [groundingResults, setGroundingResults] = useState<any[]>([]);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementHTML, setAgreementHTML] = useState<string | null>(null);
  const [agreementData, setAgreementData] = useState<any>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"left" | "center" | "right">("center");
  const [pathwaysLoading, setPathwaysLoading] = useState(false);
  // ── Room mode ──────────────────────────────────────────────────────────────
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomPartyJoined, setRoomPartyJoined] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  // ── Mediator session controls ──────────────────────────────────────────────
  const [sessionMode, setSessionMode] = useState<SessionMode>("two-party");
  const [mediatorPaused, setMediatorPaused] = useState(false);
  const [partyCount, setPartyCount] = useState(2);

  const [demoMode, setDemoMode] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [connectionLostBanner, setConnectionLostBanner] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  // Mediator state tracking for visual indicators
  const [mediatorState, setMediatorState] = useState<MediatorState>("idle");
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const waitingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sessionRef = useRef<any>(null);
  const sessionClosingRef = useRef(false);
  const toolCallPendingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);
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
  const lastCgRunRef = useRef<number>(0); // debounce common ground background analysis

  const startWaitingTimer = useCallback(() => {
    setWaitingSeconds(0);
    if (waitingTimerRef.current) clearInterval(waitingTimerRef.current);
    waitingTimerRef.current = setInterval(() => {
      setWaitingSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopWaitingTimer = useCallback(() => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setWaitingSeconds(0);
  }, []);

  const playTurnChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);       // A5
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.1); // C6
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

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
    setShowIntake(true);
    setIntakeData(null);
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

      const sessionContext = intakeData?.context
        ? `${intakeData.context}\n\n---\n${currentGraphContext}`
        : currentGraphContext;

      const session = await getLiveSession(
        {
          // Room mode flag — if the case has room mode enabled, create a shared room
          createRoom: (activeCase as any)?.roomMode ?? false,
          caseId: activeCaseIdRef.current,
          onRoomCreated: (code: string) => {
            setRoomCode(code);
          },
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

            // ── Handle barge-in (user interrupted model) ──
            // When the user speaks while the model is generating audio,
            // Gemini sends interrupted:true. We must immediately flush
            // the playback queue so stale audio doesn't keep playing.
            if (message.serverContent?.interrupted) {
              // Reset the playback scheduler so queued audio chunks are skipped
              playbackTimeRef.current = 0;
              if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
                // Close and recreate the playback context to cancel all scheduled buffers
                playbackContextRef.current.close().catch(() => {});
                playbackContextRef.current = null;
              }
              // Clear any buffered AI transcript since the generation was cancelled
              aiTranscriptBuffer.current = "";
              console.log("[Live] Barge-in detected — flushed audio playback queue");
              // Don't return — continue processing the message for other fields
            }

            const base64Audio =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
              setMediatorState("speaking");
              stopWaitingTimer();
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
              setMediatorState("listening");
              stopWaitingTimer();
            }

            // FLUSH buffers when a turn completes or a tool call arrives
            const shouldFlush = message.serverContent?.turnComplete || message.toolCall;
            if (shouldFlush && activeCaseIdRef.current) {
              if (message.serverContent?.turnComplete) {
                setMediatorState("waiting");
                startWaitingTimer();
                playTurnChime();  // Soft chime: "your turn"
              }
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
              // Capture a lightweight emotion snapshot even without a tool call,
              // using the latest partyProfiles from the mediation state
              if (liveMediationStateRef.current?.partyProfiles?.partyA &&
                  liveMediationStateRef.current?.partyProfiles?.partyB) {
                const elapsedEmo = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
                const snapshot: EmotionSnapshot = {
                  timestamp: new Date().toISOString(),
                  elapsedSeconds: elapsedEmo,
                  partyA: {
                    emotionalState: liveMediationStateRef.current.partyProfiles.partyA?.emotionalState || "Unknown",
                    emotionalIntensity: liveMediationStateRef.current.partyProfiles.partyA?.emotionalIntensity ?? 5,
                    emotionalTrajectory: liveMediationStateRef.current.partyProfiles.partyA?.emotionalTrajectory || "stable",
                    conflictStyle: liveMediationStateRef.current.partyProfiles.partyA?.conflictStyle || "Unknown",
                    cooperativeness: liveMediationStateRef.current.partyProfiles.partyA?.cooperativeness ?? 50,
                    defensiveness: liveMediationStateRef.current.partyProfiles.partyA?.defensiveness ?? 50,
                  },
                  partyB: {
                    emotionalState: liveMediationStateRef.current.partyProfiles.partyB?.emotionalState || "Unknown",
                    emotionalIntensity: liveMediationStateRef.current.partyProfiles.partyB?.emotionalIntensity ?? 5,
                    emotionalTrajectory: liveMediationStateRef.current.partyProfiles.partyB?.emotionalTrajectory || "stable",
                    conflictStyle: liveMediationStateRef.current.partyProfiles.partyB?.conflictStyle || "Unknown",
                    cooperativeness: liveMediationStateRef.current.partyProfiles.partyB?.cooperativeness ?? 50,
                    defensiveness: liveMediationStateRef.current.partyProfiles.partyB?.defensiveness ?? 50,
                  },
                  phase: liveMediationStateRef.current.phase || "Opening",
                  escalationScore: liveMediationStateRef.current.partyProfiles.partyA?.riskAssessment?.escalation ?? 0,
                };
                // Debounce: only add if last snapshot is >15s old
                const caseForEmotion = casesRef.current.find((c) => c.id === activeCaseIdRef.current);
                const lastSnapshot = caseForEmotion?.emotionTimeline?.slice(-1)[0];
                if (!lastSnapshot || elapsedEmo - lastSnapshot.elapsedSeconds >= 15) {
                  setCases((prev) =>
                    prev.map((c) =>
                      c.id === activeCaseIdRef.current
                        ? { ...c, emotionTimeline: [...(c.emotionTimeline || []), snapshot] }
                        : c,
                    ),
                  );
                }
              }

              // Debounce extraction — 12s after last turn
              if (extractionTimerRef.current) clearTimeout(extractionTimerRef.current);
              extractionTimerRef.current = setTimeout(() => {
                autoExtractIncremental();
              }, 12000);
            }

            if (message.toolCall) {
              toolCallPendingRef.current = true;
              setMediatorState("processing");
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
                    // Capture emotion timeline snapshot when both party profiles are present
                    if (args.partyProfiles?.partyA && args.partyProfiles?.partyB) {
                      const elapsed = Math.floor(
                        (Date.now() - sessionStartTimeRef.current) / 1000,
                      );
                      const snapshot: EmotionSnapshot = {
                        timestamp: new Date().toISOString(),
                        elapsedSeconds: elapsed,
                        partyA: {
                          emotionalState: args.partyProfiles.partyA.emotionalState || '',
                          emotionalIntensity: args.partyProfiles.partyA.emotionalIntensity ?? 5,
                          emotionalTrajectory: args.partyProfiles.partyA.emotionalTrajectory || 'stable',
                          conflictStyle: args.partyProfiles.partyA.conflictStyle || '',
                          cooperativeness: args.partyProfiles.partyA.cooperativeness ?? 50,
                          defensiveness: args.partyProfiles.partyA.defensiveness ?? 50,
                        },
                        partyB: {
                          emotionalState: args.partyProfiles.partyB.emotionalState || '',
                          emotionalIntensity: args.partyProfiles.partyB.emotionalIntensity ?? 5,
                          emotionalTrajectory: args.partyProfiles.partyB.emotionalTrajectory || 'stable',
                          conflictStyle: args.partyProfiles.partyB.conflictStyle || '',
                          cooperativeness: args.partyProfiles.partyB.cooperativeness ?? 50,
                          defensiveness: args.partyProfiles.partyB.defensiveness ?? 50,
                        },
                        phase: args.phase || '',
                        escalationScore: escalationScore,
                      };
                      updateActiveCase({
                        emotionTimeline: [
                          ...(casesRef.current.find(
                            (c) => c.id === activeCaseIdRef.current,
                          )?.emotionTimeline || []),
                          snapshot,
                        ],
                      });
                    }
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
                    setEscalationFlags((prev) => [...prev, flag]);
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
                    setSolutions((prev) => [...prev, proposal]);
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
            setMediatorState("idle");
            stopWaitingTimer();
            stopAudioCapture();
            // If closed unexpectedly, save transcript and show banner
            if (wasLive) {
              safeLocalStorageSet("concordia_cases", casesRef.current);
              setConnectionLostBanner(true);
            }
          },
          onthought: (text: string) => {
            // Store latest model thought for the Mediator Playbook display
            setMediatorThought?.(text);
          },
          onGroundingUpdate: (data: any) => {
            setGroundingResults((prev) => [...prev.slice(-19), { ...data, timestamp: new Date().toISOString() }]);
          },
          onFeatureUnavailable: (feature: string) => {
            console.warn(`[Live] Feature unavailable: ${feature}`);
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
        sessionContext,
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
    setMediatorState("idle");
    stopWaitingTimer();
    if (waitingTimerRef.current) clearInterval(waitingTimerRef.current);
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

  const arrayBufferToBase64 = (buffer: ArrayBufferLike): string => {
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

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Use AudioWorkletNode instead of the deprecated ScriptProcessorNode.
      // The worklet runs in a dedicated audio thread — no main-thread blocking.
      await audioContext.audioWorklet.addModule("/pcm-processor.js");

      // Guard: context may have been closed while awaiting addModule (race with stopAudioCapture)
      if (audioContext.state === "closed") return;

      const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
      processorRef.current = workletNode;

      workletNode.port.onmessage = (e) => {
        // Skip audio frames while a tool call is pending to prevent 1008 errors
        if (toolCallPendingRef.current) return;
        if (!isSessionOpen()) return;

        const { pcm16 } = e.data as { pcm16: Int16Array };
        const base64 = arrayBufferToBase64(pcm16.buffer);

        try {
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
          });
        } catch {
          // Session closed mid-send, ignore
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
    } catch (err) {
      console.error("Error capturing audio:", err);
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.port.onmessage = null;
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
        floatData[i] = (pcm16[i] ?? 0) / 0x7fff;
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
      if (!step) return;
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
    }, (demoScript[demoScript.length - 1]?.delay ?? 0) + 2000);
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
      const result = safeJsonParse<any>(resultStr, null);
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
      const parsedPathways = safeJsonParse<any>(pathwaysResStr, null);
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
      // Run parallel background common ground analysis (non-blocking)
      runBackgroundCommonGround();
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
      // Run parallel background common ground analysis (non-blocking)
      runBackgroundCommonGround();
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
      const result = safeJsonParse<any>(resultStr, null);
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

  // ── Background Common Ground Analysis ──────────────────────────────────────
  // Runs in parallel after each extraction cycle, non-blocking.
  // Debounced to at most once every 30 seconds.
  const runBackgroundCommonGround = useCallback(async () => {
    const currentCase = casesRef.current.find((c) => c.id === activeCaseIdRef.current);
    if (!currentCase || currentCase.transcript.length < 200) return;
    const now = Date.now();
    if (now - lastCgRunRef.current < 30000) return; // 30s debounce
    lastCgRunRef.current = now;
    try {
      const result = await analyzeCommonGround({
        transcript: currentCase.transcript,
        primitives: currentCase.primitives.map((p) => ({
          type: p.type,
          actorId: p.actorId,
          description: p.description,
        })),
        actors: currentCase.actors.map((a) => ({ id: a.id, name: a.name })),
      });
      if (result.commonGround.length > 0 || result.tensionPoints.length > 0) {
        setLiveMediationState((prev) =>
          prev
            ? {
                ...prev,
                commonGround: [
                  ...new Set([...(prev.commonGround || []), ...result.commonGround]),
                ],
                tensionPoints: [
                  ...new Set([...(prev.tensionPoints || []), ...result.tensionPoints]),
                ],
              }
            : prev,
        );
        // Inject background findings into live session so AI is aware
        if (sessionRef.current && isRecording) {
          const cgUpdate =
            result.commonGround.length > 0
              ? `[BACKGROUND ANALYSIS] New common ground detected:\n${result.commonGround.map((g) => `  ✓ ${g}`).join("\n")}`
              : "";
          const zopaUpdate =
            result.zopaHints.length > 0
              ? `\nZOPA hints:\n${result.zopaHints.map((z) => `  → ${z}`).join("\n")}`
              : "";
          if (cgUpdate || zopaUpdate) {
            try {
              sessionRef.current.sendContext(
                `${cgUpdate}${zopaUpdate}\n[END BACKGROUND ANALYSIS]`,
              );
            } catch (e) {
              console.warn("[CG] Failed to inject common ground context:", e);
            }
          }
        }
      }
      // Always update ZOPA hints if present
      if (result.zopaHints.length > 0) {
        setZopaHints((prev) => [...new Set([...prev, ...result.zopaHints])]);
      }
    } catch (err) {
      console.warn("[CommonGround] Background analysis failed:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

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
        const pi = prims[i];
        const pj = prims[j];
        if (pi && pj && pi.type === pj.type && wordOverlap(pi.description, pj.description) > 0.6) {
          pairs.push([pi.id, pj.id]);
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

  const handleGenerateAgreement = async () => {
    if (!activeCase || agreements.length === 0) return;
    setAgreementLoading(true);
    try {
      const data = await generateAgreementDoc({
        caseTitle: activeCase.title,
        caseType: intakeData?.caseType || "Mediation",
        partyAName: activeCase.partyAName,
        partyBName: activeCase.partyBName,
        agreements: agreements.map((a) => ({
          topic: a.topic,
          terms: a.terms,
          conditions: a.conditions,
        })),
        commonGround: liveMediationState?.commonGround || [],
        context: intakeData?.context || activeCase.transcript.slice(0, 4000),
      });
      setAgreementData(data);
      const html = generateAgreementHTML(data, {
        caseTitle: activeCase.title,
        caseType: intakeData?.caseType || "Mediation",
        partyAName: activeCase.partyAName,
        partyBName: activeCase.partyBName,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      });
      setAgreementHTML(html);
      setShowAgreementModal(true);
    } catch (err) {
      console.error("Agreement generation error:", err);
      setSessionToast("Failed to generate agreement");
    } finally {
      setAgreementLoading(false);
    }
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
      const parsed = safeJsonParse<any>(resultStr, null);
      if (parsed) {
        // Normalize: the API may omit empty arrays — ensure every field has a safe default
        // so the render never hits ".length of undefined"
        setSummaryData({
          sessionOverview: parsed.sessionOverview ?? "",
          keyClaimsPartyA: parsed.keyClaimsPartyA ?? [],
          keyClaimsPartyB: parsed.keyClaimsPartyB ?? [],
          coreInterestsPartyA: parsed.coreInterestsPartyA ?? [],
          coreInterestsPartyB: parsed.coreInterestsPartyB ?? [],
          areasOfAgreement: parsed.areasOfAgreement ?? [],
          unresolvedTensions: parsed.unresolvedTensions ?? [],
          recommendedNextSteps: parsed.recommendedNextSteps ?? [],
        });
      }
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

  // Full conflict graph for IntelligenceSidebar
  const graph = useMemo(
    () => buildConflictGraph(activeCase?.actors ?? [], activeCase?.primitives ?? []),
    [activeCase?.actors, activeCase?.primitives],
  );

  // ─── INTAKE WIZARD ───
  const handleSkipPhase = () => {
    const phases = ["Opening", "Discovery", "Exploration", "Negotiation", "Resolution", "Agreement"];
    const currentIdx = phases.indexOf(liveMediationState?.phase || "Opening");
    const nextPhase = phases[Math.min(currentIdx + 1, phases.length - 1)];
    sessionRef.current?.sendContext(
      `[MEDIATOR DIRECTIVE: Skip to ${nextPhase} phase now. Announce the transition briefly and begin ${nextPhase} behaviors.]`
    );
  };

  const handlePauseMediator = () => {
    setMediatorPaused(true);
    sessionRef.current?.sendContext(
      "[MEDIATOR DIRECTIVE: Go silent. Do NOT speak until you receive a resume directive. Continue listening.]"
    );
  };

  const handleResumeMediator = () => {
    setMediatorPaused(false);
    sessionRef.current?.sendContext(
      "[MEDIATOR DIRECTIVE: Resume. Pick up where we left off with a brief acknowledgment of what you heard during the pause.]"
    );
  };

  const handleSkipToQuestion = () => {
    sessionRef.current?.sendContext(
      "[MEDIATOR DIRECTIVE: Move forward. Ask the next important question. Do not summarize or repeat anything.]"
    );
  };

  const handleSetSessionMode = (mode: SessionMode) => {
    setSessionMode(mode);
    const instructions: Record<SessionMode, string> = {
      solo: "[SESSION MODE: Solo. One person working through their own conflict. Use coaching/reflective approach. Ask 'What situation are you working through?' not 'What brought you here?' Help them see multiple perspectives. Frameworks: Solution-Focused, NVC, Argyris.]",
      "two-party": "[SESSION MODE: Two-party. Standard mediation with two parties. Follow normal protocol.]",
      "multi-party": "[SESSION MODE: Multi-party. 3+ parties. Use round-robin. Watch for alliances. Give each person explicit turns.]",
    };
    sessionRef.current?.sendContext(instructions[mode]);
  };

  const handleAddParty = () => {
    const n = partyCount + 1;
    setPartyCount(n);
    sessionRef.current?.sendContext(
      `[PARTY ADDED: Party ${String.fromCharCode(64 + n)} joined. Welcome them and ask for a brief introduction.]`
    );
  };

  const handleIntakeComplete = (data: IntakeData) => {
    setIntakeData(data);
    setShowIntake(false);
    if (data.sessionMode) {
      setSessionMode(data.sessionMode);
    }
    // Apply intake data to the active case
    updateActiveCase({
      title: data.caseTitle,
      partyAName: data.partyA.name,
      partyBName: data.partyB.name,
      actors: [
        { id: "a1", name: data.partyA.name, role: data.partyA.role || "Disputant" },
        { id: "a2", name: data.partyB.name, role: data.partyB.role || "Disputant" },
      ],
    });
    // Set mediator profile from intake
    setMediatorProfile({
      voice: data.mediatorStyle === "empathic" ? "Kore" : "Zephyr",
      approach: "Facilitative",
      style: data.mediatorStyle,
    });
    // Build a comprehensive context string from all intake fields for the AI
    const contextParts: string[] = [];
    contextParts.push(`CASE: ${data.caseTitle}`);
    contextParts.push(`TYPE: ${data.caseType}`);
    contextParts.push(`RELATIONSHIP: ${data.partyA.name} (${data.partyA.role || data.partyA.relationship}) ↔ ${data.partyB.name} (${data.partyB.role || data.partyB.relationship})`);
    if (data.description) contextParts.push(`BACKGROUND: ${data.description}`);
    if (data.partyAGoal) contextParts.push(`${data.partyA.name}'s STATED GOAL: ${data.partyAGoal}`);
    if (data.partyBGoal) contextParts.push(`${data.partyB.name}'s STATED GOAL: ${data.partyBGoal}`);
    if (data.partyAStatement) contextParts.push(`${data.partyA.name}'s OPENING STATEMENT: ${data.partyAStatement}`);
    if (data.partyBStatement) contextParts.push(`${data.partyB.name}'s OPENING STATEMENT: ${data.partyBStatement}`);
    if (data.powerBalance !== "no") {
      contextParts.push(`POWER IMBALANCE FLAGGED: ${data.powerDetail || "possible imbalance — monitor carefully"}`);
    }
    if (data.documentSummaries.length > 0) {
      contextParts.push(`DOCUMENTS SUBMITTED:\n${data.documentSummaries.map((s, i) => `  [Doc ${i + 1}] ${s}`).join("\n")}`);
    }
    if (data.context) contextParts.push(`ADDITIONAL CONTEXT: ${data.context}`);
    // Store the rich context on the data object for session use
    data.context = contextParts.join("\n");
  };

  if (showIntake && activeCaseId) {
    return (
      <IntakeWizard
        onComplete={handleIntakeComplete}
        onSkip={() => setShowIntake(false)}
        defaultPartyAName={activeCase?.partyAName}
        defaultPartyBName={activeCase?.partyBName}
      />
    );
  }

  // ─── CASE LIST VIEW ───
  if (!activeCaseId) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-[var(--color-bg)]">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-medium mb-0.5">CONCORDIA</div>
              <h1 className="text-2xl font-bold tracking-tight text-white">AI Mediation Platform</h1>
            </div>
          </div>
          <p className="text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Welcome. CONCORDIA guides parties through structured conflict resolution using live AI mediation —
            extracting interests, mapping common ground, and building durable agreements.
          </p>
          {cases.length === 0 && (
            <div className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 max-w-xl">
              <div className="text-sm font-semibold text-white mb-3">Getting started</div>
              <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-bold shrink-0">1.</span>
                  <span>Create a new mediation case and complete the intake wizard to identify both parties and their context.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-bold shrink-0">2.</span>
                  <span>Start the live AI session — CONCORDIA will open with a structured welcome and begin discovery.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-bold shrink-0">3.</span>
                  <span>Both parties speak naturally. CONCORDIA listens, identifies patterns, and guides toward resolution.</span>
                </div>
              </div>
            </div>
          )}
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

  // Map status to ConnectionStatus state
  const connectionState = status === "LIVE" || status === "DEMO" ? "connected" as const
    : status === "RECONNECTING" ? "reconnecting" as const
    : status === "ERROR" ? "error" as const
    : "disconnected" as const;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg)]">
      {/* ─── TOP BAR ─── */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveCaseId(null)}
            aria-label="Back to case list"
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
                className="text-xs bg-transparent border-b border-[#4ECDC4]/30 focus:border-[#4ECDC4] focus:outline-none text-[#4ECDC4] font-mono w-24 px-1"
                placeholder="Party A"
              />
              <span className="text-xs text-[var(--color-text-muted)]">vs</span>
              <input
                value={activeCase?.partyBName}
                onChange={(e) =>
                  updateActiveCase({ partyBName: e.target.value })
                }
                className="text-xs bg-transparent border-b border-[#A78BFA]/30 focus:border-[#A78BFA] focus:outline-none text-[#A78BFA] font-mono w-24 px-1"
                placeholder="Party B"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer + Phase + Connection */}
          <div className="hidden md:flex items-center gap-3">
            {(isRecording || status === "LIVE" || status === "DEMO") && sessionDuration > 0 && (
              <MediationTimer
                startTime={sessionStartTimeRef.current}
                sessionDuration={sessionDuration}
                currentPhase={liveMediationState?.phase || "Opening"}
              />
            )}
            <ConnectionStatus status={connectionState} />
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
          onGenerateAgreement={handleGenerateAgreement}
          hasAgreements={agreements.length > 0}
        />
        </div>
      </header>

      {/* ─── PHASE TIMELINE BAR ─── */}
      {(isRecording || liveMediationState) && (
        <div className="px-6 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0 hidden md:block">
          <PhaseTimeline currentPhase={liveMediationState?.phase || "Opening"} />
        </div>
      )}

      {/* ─── MEDIATOR CONTROLS ─── */}
      {isRecording && (
        <div className="px-6 py-1.5 border-b border-[var(--color-border)] shrink-0">
          <MediatorControls
            isRecording={isRecording}
            sessionMode={sessionMode}
            onSetSessionMode={handleSetSessionMode}
            onSkipPhase={handleSkipPhase}
            onPauseMediator={handlePauseMediator}
            onResumeMediator={handleResumeMediator}
            onSkipToQuestion={handleSkipToQuestion}
            mediatorPaused={mediatorPaused}
            partyCount={partyCount}
            onAddParty={handleAddParty}
          />
        </div>
      )}

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
            onOpenGraph={() => {}}
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

      {/* ─── ROOM CODE PANEL ─── */}
      {roomCode && (
        <RoomCodePanel
          code={roomCode}
          onCopy={() => {
            const url = `${window.location.origin}/workspace?join=${roomCode}`;
            navigator.clipboard.writeText(url);
          }}
        />
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

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Mobile tab bar */}
        <div className="flex shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 gap-1 py-2">
          {([
            { id: "center" as const, label: "Conversation" },
            { id: "right" as const, label: "Intelligence" },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => setMobilePanel(p.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mobilePanel === p.id
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-white bg-[var(--color-bg)] border border-[var(--color-border)]"
              }`}
            >
              {p.label}
            </button>
          ))}
          {/* Mini duration + phase */}
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-[var(--color-text-muted)] whitespace-nowrap">
            <span className="hidden sm:block">{liveMediationState?.phase || "Opening"}</span>
            {(isRecording || status === "LIVE") && sessionDuration > 0 && (
              <MediationTimer
                startTime={sessionStartTimeRef.current}
                sessionDuration={sessionDuration}
                currentPhase={liveMediationState?.phase || "Opening"}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA (2-zone 60/40) ─── */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* ─── LEFT ZONE: Conversation Hero (60%) ─── */}
        <div className={`w-full lg:w-[60%] flex flex-col overflow-hidden ${mobilePanel === "center" ? "flex" : "hidden"} lg:flex`}>
          {/* Mediator Controls */}
          <div className="shrink-0 mb-2">
            <MediatorControls
              isRecording={isRecording}
              sessionMode={sessionMode}
              onSetSessionMode={handleSetSessionMode}
              onSkipPhase={handleSkipPhase}
              onPauseMediator={handlePauseMediator}
              onResumeMediator={handleResumeMediator}
              onSkipToQuestion={handleSkipToQuestion}
              mediatorPaused={mediatorPaused}
              partyCount={partyCount}
              onAddParty={handleAddParty}
            />
          </div>

          {/* Escalation Alert */}
          {escalationBanner && (
            <div className="shrink-0 mb-2">
              <EscalationAlert
                flag={escalationBanner}
                onDismiss={() => setEscalationBanner(null)}
                onDeEscalate={() => { setEscalationBanner(null); }}
              />
            </div>
          )}

          {/* Mediator Status */}
          {isRecording && (
            <div className="shrink-0">
              <MediatorStatus
                state={mediatorState}
                targetParty={liveMediationState?.targetActor || activeCase?.partyAName || "Party A"}
                secondsWaiting={waitingSeconds}
              />
            </div>
          )}

          {/* Transcript Panel */}
          <div className="flex-1 overflow-y-auto">
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
          </div>

          {/* Speaker ID buttons */}
          {isRecording && (
            <div className="shrink-0 flex items-center justify-center gap-2 py-2 border-t border-[var(--color-border)]">
              <span className="text-[9px] text-[var(--color-text-muted)] uppercase">Speaking:</span>
              {[
                { name: activeCase?.partyAName || "Party A", color: "#4ECDC4" },
                { name: activeCase?.partyBName || "Party B", color: "#A78BFA" },
              ].map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => sessionRef.current?.sendContext(`[SPEAKER IDENTIFICATION: Current speaker is ${name}]`)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium border transition-colors hover:brightness-125"
                  style={{ color, borderColor: color + "35", backgroundColor: color + "10" }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* Text Input */}
          {isRecording && (
            <div className="shrink-0 border-t border-[var(--color-border)]">
              <TextInput
                partyAName={activeCase?.partyAName || "Party A"}
                partyBName={activeCase?.partyBName || "Party B"}
                disabled={!isRecording}
                onSendMessage={(text, party) => {
                  if (!sessionRef.current) return;
                  sessionRef.current.sendContext(`[${party} says (typed input)]: "${text}"`);
                  const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
                  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
                  const ss = String(elapsed % 60).padStart(2, "0");
                  setCases((prev) =>
                    prev.map((c) =>
                      c.id === activeCaseIdRef.current
                        ? { ...c, transcript: c.transcript + (c.transcript ? "\n\n" : "") + `[${mm}:${ss}] [${party} — typed]: ${text}` }
                        : c,
                    ),
                  );
                  setMediatorState("processing");
                }}
              />
            </div>
          )}
        </div>

        {/* ─── RIGHT ZONE: Intelligence Sidebar (40%) ─── */}
        <div className={`w-full lg:w-[40%] flex flex-col overflow-hidden ${mobilePanel !== "center" ? "flex" : "hidden"} lg:flex`}>
          <IntelligenceSidebar
            partyAName={activeCase?.partyAName || "Party A"}
            partyBName={activeCase?.partyBName || "Party B"}
            partyAProfile={liveMediationState?.partyProfiles?.partyA || null}
            partyBProfile={liveMediationState?.partyProfiles?.partyB || null}
            escalationScore={Math.max(
              liveMediationState?.partyProfiles?.partyA?.riskAssessment?.escalation ?? 0,
              liveMediationState?.partyProfiles?.partyB?.riskAssessment?.escalation ?? 0,
            )}
            emotionTimeline={activeCase?.emotionTimeline || []}
            ontologyStats={ontologyStats}
            partyAClaims={partyAClaims}
            partyBClaims={partyBClaims}
            primitives={activeCase?.primitives || []}
            actors={activeCase?.actors || []}
            graph={graph}
            onPinPrimitive={(id) => updatePrimitive(id, { pinned: true })}
            onResolvePrimitive={(id) => updatePrimitive(id, { resolved: true })}
            onDeletePrimitive={deletePrimitive}
            onUpdatePrimitiveType={(id, type) => updatePrimitive(id, { type })}
            onUpdatePrimitiveDescription={(id, description) => updatePrimitive(id, { description })}
            onAddPrimitive={addPrimitive}
            graphNodes={graphNodes}
            graphEdges={graphEdges}
            highlightActorId={highlightActorId}
            powerDynamics={powerDynamics}
            mediationState={liveMediationState}
            escalationFlags={escalationFlags}
            agreements={agreements}
            solutions={solutions}
            mediatorThought={mediatorThought}
            groundingResults={groundingResults}
            gapNotifications={gapNotifications}
            missingPrimitives={PRIMITIVE_TYPES.filter(
              (t) => !activeCase?.primitives.some((p) => p.type === t),
            )}
            phase={liveMediationState?.phase || "Opening"}
            showBlindBidding={showBlindBidding}
            onCloseBlindBidding={() => setShowBlindBidding(false)}
          />
        </div>
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
                    {(summaryData.areasOfAgreement?.length ?? 0) > 0 && (
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
                    {(summaryData.unresolvedTensions?.length ?? 0) > 0 && (
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
                    {(summaryData.recommendedNextSteps?.length ?? 0) > 0 && (
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

      {/* ─── MOBILE: Floating Mic FAB ─── */}
      <div className="lg:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={isRecording ? stopSession : startSession}
          aria-label={isRecording ? "Stop session" : "Start session"}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/40"
              : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-[var(--color-accent)]/40"
          }`}
        >
          {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* ─── MOBILE: Fixed bottom bar ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-12 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between px-4 z-40 text-xs font-mono">
        <span className="text-[var(--color-text-muted)]">{liveMediationState?.phase || "Opening"}</span>
        <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-slate-600"}`} />
        {(isRecording || status === "LIVE") && sessionDuration > 0 ? (
          <span className="text-[var(--color-text-muted)]">
            {String(Math.floor(sessionDuration / 60)).padStart(2, "0")}:{String(sessionDuration % 60).padStart(2, "0")}
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)]">{status}</span>
        )}
      </div>

      {/* ─── AGREEMENT PREVIEW MODAL ─── */}
      {showAgreementModal && agreementHTML && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0e1a] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Settlement Agreement</h3>
              <button onClick={() => setShowAgreementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                srcDoc={agreementHTML}
                className="w-full h-[500px] bg-white rounded-lg"
                title="Agreement Preview"
              />
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-800">
              <button
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (w) { w.document.write(agreementHTML!); w.document.close(); setTimeout(() => w.print(), 500); }
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
              <button
                onClick={() => {
                  downloadFile(agreementHTML!, `${activeCase!.title.replace(/\s+/g, "-")}-agreement.html`, "text/html");
                  setSessionToast("Agreement downloaded");
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download HTML
              </button>
              <button
                onClick={() => {
                  const plainText = agreementData
                    ? formatAgreementAsText(agreementData, activeCase!.partyAName, activeCase!.partyBName)
                    : "";
                  navigator.clipboard.writeText(plainText);
                  setSessionToast("Agreement copied to clipboard");
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BLIND BIDDING MODAL ─── */}
      <AnimatePresence>
        {showBlindBidding && (
          <BlindBidding
            open={showBlindBidding}
            onClose={() => setShowBlindBidding(false)}
            partyAName={activeCase?.partyAName || "Party A"}
            partyBName={activeCase?.partyBName || "Party B"}
            onSettlement={(issue, amount, unit) => {
              // Capture as tracked agreement
              const agreement: Agreement = {
                id: Date.now().toString() + Math.random(),
                topic: `Blind Bidding: ${issue}`,
                terms: `Settlement reached at ${amount}${unit} via blind bidding (RCB algorithm). Both parties' ranges overlapped.`,
                conditions: [],
                partyAAccepts: true,
                partyBAccepts: true,
                timestamp: new Date().toISOString(),
              };
              setAgreements((prev) => [...prev, agreement]);
              // Inject context into live session if active
              sessionRef.current?.sendContext(
                `[BLIND BIDDING SETTLED] "${issue}" at ${amount}${unit}. Both parties' ranges overlapped. Acknowledge this agreement.`,
              );
              setShowBlindBidding(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Join screen — shown when ?join=ROOMCODE is in the URL ────────────────────
function JoinScreen({
  joinCode,
  joinName,
  setJoinName,
  joinLoading,
  joinError,
  onJoin,
}: {
  joinCode: string;
  joinName: string;
  setJoinName: (v: string) => void;
  joinLoading: boolean;
  joinError: string;
  onJoin: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Shield className="w-10 h-10 text-[var(--color-accent)] mx-auto" />
          <h1 className="text-2xl font-bold">Join Mediation</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Room <span className="font-mono font-bold text-white">{joinCode}</span>
          </p>
        </div>
        <div className="space-y-3">
          <label className="text-xs text-[var(--color-text-muted)] block">Your name</label>
          <input
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinName.trim() && onJoin()}
            placeholder="Enter your name…"
            autoFocus
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          {joinError && (
            <p className="text-xs text-red-400">{joinError}</p>
          )}
          <button
            onClick={onJoin}
            disabled={!joinName.trim() || joinLoading}
            className="w-full py-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold text-sm transition-colors disabled:opacity-40"
          >
            {joinLoading ? "Joining…" : "Join Session"}
          </button>
        </div>
        <p className="text-[10px] text-center text-[var(--color-text-muted)]">
          You will connect as a participant in the live mediation session.
        </p>
      </div>
    </div>
  );
}

// ── Room code panel (shown to creator after session starts) ──────────────────
function RoomCodePanel({ code, onCopy }: { code: string; onCopy: () => void }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/workspace?join=${code}`
    : `/workspace?join=${code}`;
  return (
    <div className="mx-6 mt-2 shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-blue-500/10 border-blue-500/30">
      <Users className="w-4 h-4 text-blue-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-200">
          Room active — share this code with the other party:
          {" "}<span className="font-mono font-bold text-white tracking-widest">{code}</span>
        </p>
        <p className="text-[10px] text-blue-400/70 truncate">{url}</p>
      </div>
      <button
        onClick={onCopy}
        aria-label="Copy room link"
        className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors"
      >
        Copy Link
      </button>
    </div>
  );
}

// ── Outer wrapper with Suspense for useSearchParams ──────────────────────────
export default function Workspace() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading…</div>}>
      <WorkspaceWithSearchParams />
    </Suspense>
  );
}

function WorkspaceWithSearchParams() {
  const searchParams = useSearchParams();
  const joinCode = searchParams?.get("join")?.toUpperCase() ?? null;

  const [joinName, setJoinName] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinedSession, setJoinedSession] = useState(false);
  const joinSessionRef = useRef<any>(null);

  // If URL has ?join=CODE and not yet joined → show join screen
  if (joinCode && !joinedSession) {
    const handleJoin = async () => {
      if (!joinName.trim()) return;
      setJoinLoading(true);
      setJoinError("");
      try {
        const handle = await joinRoomSession(joinCode, joinName.trim(), {
          onJoined: (partyId) => {
            console.log(`[Room] Joined as ${partyId}`);
          },
          onPartyJoined: (partyId, name) => {
            console.log(`[Room] ${name} (${partyId}) also joined`);
          },
          onclose: () => setJoinedSession(false),
        });
        joinSessionRef.current = handle;
        setJoinedSession(true);
      } catch (err: any) {
        setJoinError(err.message || "Failed to join room");
      } finally {
        setJoinLoading(false);
      }
    };

    return (
      <JoinScreen
        joinCode={joinCode}
        joinName={joinName}
        setJoinName={setJoinName}
        joinLoading={joinLoading}
        joinError={joinError}
        onJoin={handleJoin}
      />
    );
  }

  if (joinCode && joinedSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] text-white p-8">
        <Shield className="w-10 h-10 text-emerald-500" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Connected to Room {joinCode}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            You are participating in the live mediation session. Audio and AI analysis are shared.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </div>
      </div>
    );
  }

  // Normal workspace (no room join)
  return <WorkspaceInner />;
}
