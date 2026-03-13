"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Zap,
  Shield,
  Heart,
  Users,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  Brain,
  Volume2,
  VolumeX,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrustScores {
  ability: number;
  benevolence: number;
  integrity: number;
}

interface PartyProfile {
  cooperativeness: number;
  defensiveness: number;
  emotionalState: string;
  conflictStyle: string;
  escalation: number;
  emotionalIntensity?: number;
  trust: TrustScores;
  withdrawal?: number;
  badFaith?: number;
  impasse?: number;
}

interface PrimitiveCounts {
  Claim: number;
  Interest: number;
  Event: number;
  Constraint: number;
  Commitment: number;
  Agreement: number;
  Narrative: number;
  Risk: number;
}

interface DemoStep {
  stepNumber: number;
  phase: string;
  targetActor: string;
  transcript: string;
  annotation: string;
  sarah: Partial<PartyProfile>;
  michael: Partial<PartyProfile>;
  primitivesAdded: Partial<PrimitiveCounts>;
  commonGround: string[];
  escalationAlert?: boolean;
  deEscalation?: boolean;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const PHASES = ["Opening", "Discovery", "Escalation", "De-escalation", "Exploration", "Negotiation", "Resolution", "Agreement"];


const PHASE_COLORS: Record<string, string> = {
  Opening: "bg-blue-500",
  Discovery: "bg-purple-500",
  Escalation: "bg-red-500",
  "De-escalation": "bg-orange-500",
  Exploration: "bg-yellow-500",
  Negotiation: "bg-green-500",
  Resolution: "bg-teal-500",
  Agreement: "bg-emerald-500",
};

const PHASE_TEXT_COLORS: Record<string, string> = {
  Opening: "text-blue-400",
  Discovery: "text-purple-400",
  Escalation: "text-red-400",
  "De-escalation": "text-orange-400",
  Exploration: "text-yellow-400",
  Negotiation: "text-green-400",
  Resolution: "text-teal-400",
  Agreement: "text-emerald-400",
};

const CONFLICT_STYLE_COLORS: Record<string, string> = {
  Competing: "bg-red-900 text-red-300 border border-red-700",
  Avoiding: "bg-[#111827] text-[#94a3b8] border border-[#1e293b]",
  Collaborating: "bg-green-900 text-green-300 border border-green-700",
  Accommodating: "bg-blue-900 text-blue-300 border border-blue-700",
  Compromising: "bg-yellow-900 text-yellow-300 border border-yellow-700",
};

const EMOTIONAL_STATE_COLORS: Record<string, string> = {
  Guarded: "text-[#64748b]",
  Anxious: "text-yellow-400",
  Frustrated: "text-red-400",
  Defensive: "text-orange-400",
  Open: "text-green-400",
  Calmer: "text-blue-400",
  Thoughtful: "text-purple-400",
  Hopeful: "text-teal-400",
  Relieved: "text-emerald-400",
};

const STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    phase: "Opening",
    targetActor: "Both",
    transcript:
      "[CONCORDIA]: Welcome, Sarah and Michael. I'm CONCORDIA — I'll be your mediator today. Sarah, could you say a quick hello so I can learn your voice? ... Great. Michael, you too? ... Perfect, I've got you both. One ground rule before we begin: we'll speak one at a time, treat each other with respect, and everything here stays in this room. Sarah, what brought you here today?",
    annotation:
      "CONCORDIA performs voice calibration with both parties and establishes ground rules [Fisher & Ury: Separate people from the problem]",
    sarah: {
      cooperativeness: 45,
      defensiveness: 55,
      emotionalState: "Guarded",
      conflictStyle: "Competing",
      escalation: 20,
      trust: { ability: 40, benevolence: 30, integrity: 35 },
    },
    michael: {
      cooperativeness: 50,
      defensiveness: 60,
      emotionalState: "Anxious",
      conflictStyle: "Avoiding",
      escalation: 18,
      trust: { ability: 45, benevolence: 35, integrity: 40 },
    },
    primitivesAdded: {},
    commonGround: [],
  },
  {
    stepNumber: 2,
    phase: "Discovery",
    targetActor: "Sarah",
    transcript:
      "[Sarah]: Honestly? I'm exhausted. Michael keeps missing sprint commitments — I built a whole Agile process, daily standups, velocity tracking — and he just... ignores it. My stakeholders are asking me for updates I literally cannot give them because I don't know where anything stands.",
    annotation:
      "[Narrative Mediation] Sarah frames Michael as 'villain' — detecting grievance narrative with emotional exhaustion. Primary emotion: Frustration (intensity 7/10, escalating)",
    sarah: {
      cooperativeness: 42,
      defensiveness: 65,
      emotionalState: "Frustrated",
      conflictStyle: "Competing",
      emotionalIntensity: 7,
      escalation: 35,
      trust: { ability: 35, benevolence: 22, integrity: 28 },
    },
    michael: {
      cooperativeness: 50,
      defensiveness: 60,
      emotionalState: "Anxious",
      conflictStyle: "Avoiding",
      escalation: 18,
      trust: { ability: 45, benevolence: 35, integrity: 40 },
    },
    primitivesAdded: { Claim: 1, Interest: 1, Event: 1 },
    commonGround: [],
  },
  {
    stepNumber: 3,
    phase: "Discovery",
    targetActor: "Sarah",
    transcript:
      "[CONCORDIA]: That sounds genuinely stressful — being caught between your stakeholders and your team. Before I turn to Michael, are there any hard deadlines or organizational pressures I should know about? Things that make this more urgent than it might look from the outside?",
    annotation:
      "⚠️ AI detects ontology gap: No Constraints primitive from Sarah. Probing with targeted question [Gap type: primitive_missing, priority: critical]",
    sarah: {
      cooperativeness: 42,
      defensiveness: 65,
      emotionalState: "Frustrated",
      conflictStyle: "Competing",
      emotionalIntensity: 7,
      escalation: 35,
      trust: { ability: 35, benevolence: 22, integrity: 28 },
    },
    michael: {
      cooperativeness: 50,
      defensiveness: 60,
      emotionalState: "Anxious",
      conflictStyle: "Avoiding",
      escalation: 18,
      trust: { ability: 45, benevolence: 35, integrity: 40 },
    },
    primitivesAdded: { Constraint: 1 },
    commonGround: [],
  },
  {
    stepNumber: 4,
    phase: "Discovery",
    targetActor: "Michael",
    transcript:
      "[Michael]: Look — I get that Sarah's under pressure, but she's turned this into a surveillance operation. Every hour tracked, every task in a ticket. I'm a senior engineer. I do my best work in deep focus — that doesn't fit into 2-hour sprint slots. I'm not failing, I'm just working differently than the system expects.",
    annotation:
      "[Glasl Stage 2] Debate stage — polarized thinking, counterclaim detected. Michael's conflict style: Avoiding→Competing under pressure. New Interest: autonomy in workflow.",
    sarah: {
      cooperativeness: 42,
      defensiveness: 65,
      emotionalState: "Frustrated",
      conflictStyle: "Competing",
      escalation: 35,
      trust: { ability: 35, benevolence: 22, integrity: 28 },
    },
    michael: {
      cooperativeness: 38,
      defensiveness: 75,
      emotionalState: "Defensive",
      conflictStyle: "Avoiding",
      emotionalIntensity: 8,
      escalation: 58,
      trust: { ability: 38, benevolence: 20, integrity: 25 },
    },
    primitivesAdded: { Claim: 1, Interest: 1, Narrative: 1 },
    commonGround: [],
  },
  {
    stepNumber: 5,
    phase: "Escalation",
    targetActor: "Both",
    transcript:
      "[Michael]: You micromanage everything! I shipped three major features this quarter and all you track is whether I showed up to standup. Three features! You're strangling this team with process and calling it management.",
    annotation:
      "🚨 ESCALATION DETECTED — Score: 78 | Level 3 Circuit Break activated. Blame language: 'you micromanage', 'strangling'. Gottman: Contempt detected. Protocol: Hard circuit-break, name the dynamic without blame",
    sarah: {
      cooperativeness: 42,
      defensiveness: 65,
      emotionalState: "Frustrated",
      conflictStyle: "Competing",
      escalation: 62,
      trust: { ability: 35, benevolence: 22, integrity: 28 },
    },
    michael: {
      cooperativeness: 38,
      defensiveness: 75,
      emotionalState: "Defensive",
      conflictStyle: "Avoiding",
      emotionalIntensity: 8,
      escalation: 78,
      trust: { ability: 38, benevolence: 20, integrity: 25 },
    },
    primitivesAdded: {},
    commonGround: [],
    escalationAlert: true,
  },
  {
    stepNumber: 6,
    phase: "De-escalation",
    targetActor: "Both",
    transcript:
      "[CONCORDIA]: I need to pause us. Michael — three features this quarter is real work, and I hear how unseen that feels. Sarah — I also hear that you're in an impossible spot with your stakeholders. Both of those things are true at the same time. Let's slow down. This is important enough to get right.",
    annotation:
      "[Ury: 'Go to the balcony'] CONCORDIA names the dynamic without assigning blame. Validates both parties simultaneously. De-escalation Level 3 → 2. Both parties visibly stabilize.",
    sarah: {
      cooperativeness: 50,
      defensiveness: 58,
      emotionalState: "Open",
      conflictStyle: "Competing",
      escalation: 42,
      trust: { ability: 35, benevolence: 22, integrity: 28 },
    },
    michael: {
      cooperativeness: 45,
      defensiveness: 62,
      emotionalState: "Calmer",
      conflictStyle: "Avoiding",
      escalation: 45,
      trust: { ability: 38, benevolence: 20, integrity: 25 },
    },
    primitivesAdded: {},
    commonGround: [],
    deEscalation: true,
  },
  {
    stepNumber: 7,
    phase: "Exploration",
    targetActor: "Both",
    transcript:
      "[CONCORDIA]: I'm noticing something. Sarah, underneath the process question — you need your stakeholders to trust that this team delivers. Michael, underneath the autonomy question — you need Sarah to trust your judgment as a senior engineer. I could be wrong, but is what you're both really asking for... trust?",
    annotation:
      "[Fisher & Ury] Reframing from positions to interests using hedged guess technique. Extracting shared value: TRUST. Zartman Ripeness: mutually hurting stalemate — both parties feel pain.",
    sarah: {
      cooperativeness: 58,
      defensiveness: 45,
      emotionalState: "Thoughtful",
      conflictStyle: "Competing",
      escalation: 30,
      trust: { ability: 48, benevolence: 38, integrity: 42 },
    },
    michael: {
      cooperativeness: 55,
      defensiveness: 52,
      emotionalState: "Thoughtful",
      conflictStyle: "Avoiding",
      escalation: 35,
      trust: { ability: 44, benevolence: 35, integrity: 38 },
    },
    primitivesAdded: {},
    commonGround: ["Both value team productivity", "Both want the Q3 deadline met", "Both are asking for trust from the other"],
  },
  {
    stepNumber: 8,
    phase: "Exploration",
    targetActor: "Sarah",
    transcript:
      "[Sarah]: ... yeah. Yeah, actually. I don't need to see every hour of work — I need to know a blocker isn't going to blindside me on Friday afternoon. That's what I actually need.",
    annotation:
      "[Bush & Folger: Recognition] Sarah shifts from position to underlying interest — empowerment moment. 'I don't need to see every hour' is a major concession. Trust scores rising. Glasl reverting from Stage 2 toward Stage 1.",
    sarah: {
      cooperativeness: 65,
      defensiveness: 38,
      emotionalState: "Open",
      conflictStyle: "Competing",
      escalation: 22,
      trust: { ability: 55, benevolence: 50, integrity: 52 },
    },
    michael: {
      cooperativeness: 55,
      defensiveness: 52,
      emotionalState: "Thoughtful",
      conflictStyle: "Avoiding",
      escalation: 35,
      trust: { ability: 44, benevolence: 35, integrity: 38 },
    },
    primitivesAdded: { Commitment: 1 },
    commonGround: ["Both value team productivity", "Both want the Q3 deadline met", "Both are asking for trust from the other"],
  },
  {
    stepNumber: 9,
    phase: "Negotiation",
    targetActor: "Both",
    transcript:
      "[CONCORDIA]: What if we built something that gave Michael full control over *how* he works — his flow, his hours, no microtracking — and gave Sarah *outcome visibility* twice a week so she's never blindsided? What would that need to look like for each of you to actually trust it?",
    annotation:
      "[Fisher & Ury: Golden Bridge] Building a path that gives both parties a face-saving win. Testing hybrid solution: autonomy + outcome transparency. ZOPA confirmed — overlap exists on 'no task tracking, yes outcome updates'.",
    sarah: {
      cooperativeness: 65,
      defensiveness: 38,
      emotionalState: "Open",
      conflictStyle: "Competing",
      escalation: 22,
      trust: { ability: 55, benevolence: 50, integrity: 52 },
    },
    michael: {
      cooperativeness: 70,
      defensiveness: 32,
      emotionalState: "Hopeful",
      conflictStyle: "Collaborating",
      escalation: 18,
      trust: { ability: 44, benevolence: 35, integrity: 38 },
    },
    primitivesAdded: {},
    commonGround: [
      "Both value team productivity",
      "Both want Q3 met",
      "Shared need for trust",
      "Autonomy + outcome visibility can coexist",
    ],
  },
  {
    stepNumber: 10,
    phase: "Negotiation",
    targetActor: "Michael",
    transcript:
      "[Michael]: Okay. Monday outcome summary, Friday blockers call. Short, async — not a standup. No task-level tracking, just deliverable status and anything that's going to slip. That I can actually commit to.",
    annotation:
      "Commitment primitive forming: Michael proposes concrete, specific outcome visibility protocol. ZOPA confirmed. Specificity ('async', 'not a standup') signals genuine buy-in. Risk scores dropping across all axes.",
    sarah: {
      cooperativeness: 65,
      defensiveness: 38,
      emotionalState: "Open",
      conflictStyle: "Competing",
      escalation: 15,
      withdrawal: 5,
      badFaith: 5,
      impasse: 8,
      trust: { ability: 55, benevolence: 50, integrity: 52 },
    },
    michael: {
      cooperativeness: 70,
      defensiveness: 32,
      emotionalState: "Hopeful",
      conflictStyle: "Collaborating",
      escalation: 12,
      withdrawal: 8,
      badFaith: 4,
      impasse: 10,
      trust: { ability: 44, benevolence: 35, integrity: 38 },
    },
    primitivesAdded: { Commitment: 1, Agreement: 1 },
    commonGround: [
      "Both value team productivity",
      "Both want Q3 met",
      "Shared need for trust",
      "Autonomy + outcome visibility can coexist",
    ],
  },
  {
    stepNumber: 11,
    phase: "Resolution",
    targetActor: "Sarah",
    transcript:
      "[Sarah]: I can work with that. Monday and Friday is enough for my stakeholders. And Michael... the tracking thing — I hear you. I didn't realize it felt that way. I'll pull back the task-level requirements. I just need to know when something's going sideways before it's too late.",
    annotation:
      "[Lederach: Conflict Transformation] Relationship repair alongside practical agreement. Sarah makes a reciprocal concession AND acknowledges Michael's experience — conflict transformed, not merely settled.",
    sarah: {
      cooperativeness: 78,
      defensiveness: 22,
      emotionalState: "Relieved",
      conflictStyle: "Collaborating",
      escalation: 10,
      trust: { ability: 68, benevolence: 62, integrity: 65 },
    },
    michael: {
      cooperativeness: 70,
      defensiveness: 32,
      emotionalState: "Hopeful",
      conflictStyle: "Collaborating",
      escalation: 12,
      trust: { ability: 44, benevolence: 35, integrity: 38 },
    },
    primitivesAdded: {},
    commonGround: [
      "Both value team productivity",
      "Both want Q3 met",
      "Shared need for trust",
      "Autonomy + outcome visibility can coexist",
    ],
  },
  {
    stepNumber: 12,
    phase: "Agreement",
    targetActor: "Both",
    transcript:
      "[CONCORDIA]: This is a real breakthrough. You both came in with competing systems — and you've built something neither of you had at the start. Here's what I heard you agree to: Michael provides an async outcome summary on Mondays and flags blockers on Fridays. Sarah removes task-level tracking and moves to deliverable oversight. You both commit to a monthly 30-minute check-in to see how it's working. Should I draft this as formal terms?",
    annotation:
      "🎉 Agreement reached in 12 exchanges. [Fisher & Ury + Lederach + Transformative Mediation] Framework synthesis. Conflict primitives extracted: 14. Trust scores: +35% average. Escalation arc: 78 → 10.",
    sarah: {
      cooperativeness: 78,
      defensiveness: 22,
      emotionalState: "Relieved",
      conflictStyle: "Collaborating",
      escalation: 10,
      trust: { ability: 68, benevolence: 62, integrity: 65 },
    },
    michael: {
      cooperativeness: 75,
      defensiveness: 28,
      emotionalState: "Hopeful",
      conflictStyle: "Collaborating",
      escalation: 10,
      trust: { ability: 62, benevolence: 58, integrity: 60 },
    },
    primitivesAdded: {},
    commonGround: [
      "Both value team productivity",
      "Both want Q3 met",
      "Shared need for trust",
      "Autonomy + outcome visibility can coexist",
      "Monthly check-in as accountability loop",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeProfile(base: Partial<PartyProfile>, update: Partial<PartyProfile>): PartyProfile {
  return {
    cooperativeness: update.cooperativeness ?? base.cooperativeness ?? 50,
    defensiveness: update.defensiveness ?? base.defensiveness ?? 50,
    emotionalState: update.emotionalState ?? base.emotionalState ?? "Neutral",
    conflictStyle: update.conflictStyle ?? base.conflictStyle ?? "Avoiding",
    escalation: update.escalation ?? base.escalation ?? 0,
    emotionalIntensity: update.emotionalIntensity ?? base.emotionalIntensity,
    trust: update.trust ?? base.trust ?? { ability: 50, benevolence: 50, integrity: 50 },
    withdrawal: update.withdrawal ?? base.withdrawal,
    badFaith: update.badFaith ?? base.badFaith,
    impasse: update.impasse ?? base.impasse,
  };
}

function getEscalationColor(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 30) return "bg-yellow-500";
  return "bg-green-500";
}

function getEscalationLabel(score: number): string {
  if (score >= 70) return "Critical";
  if (score >= 50) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
}

// Extract framework tag from annotation (text inside [...])
function extractFrameworkTag(annotation: string): string {
  const match = annotation.match(/\[([^\]]+)\]/);
  return match?.[1] ?? "";
}

function extractTechniqueDescription(annotation: string): string {
  return (annotation.replace(/^\[([^\]]+)\]\s*/, "").split(".")[0]) ?? annotation;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#64748b]">
        <span>{label}</span>
        <motion.span
          key={value}
          initial={{ scale: 1.3, color: "#fff" }}
          animate={{ scale: 1, color: "#64748b" }}
          transition={{ duration: 0.4 }}
        >
          {value}%
        </motion.span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function PartyCard({ name, profile, side }: { name: string; profile: PartyProfile; side: "A" | "B" }) {
  const avatarColor = side === "A" ? "from-sky-500 to-sky-700" : "from-violet-600 to-violet-800";
  const initials = side === "A" ? "SC" : "MT";
  const role = side === "A" ? "Team Lead" : "Senior Dev";
  const borderAccent = side === "A" ? "border-l-4 border-l-sky-500" : "border-l-4 border-l-violet-500";

  return (
    <div className={`bg-[#0d1120] border border-[#1e293b] ${borderAccent} rounded-xl p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {initials}
        </div>
        <div>
          <div className="text-white text-sm font-semibold">{name}</div>
          <div className="text-[#64748b] text-xs">{role}</div>
        </div>
      </div>

      {/* Emotional state */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#64748b]">State</span>
        <motion.span
          key={profile.emotionalState}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-xs font-medium ${EMOTIONAL_STATE_COLORS[profile.emotionalState] ?? "text-[#94a3b8]"}`}
        >
          {profile.emotionalState}
        </motion.span>
      </div>

      {/* Conflict style */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#64748b]">Style</span>
        <motion.span
          key={profile.conflictStyle}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFLICT_STYLE_COLORS[profile.conflictStyle] ?? "bg-[#111827] text-[#94a3b8]"}`}
        >
          {profile.conflictStyle}
        </motion.span>
      </div>

      {/* Bars */}
      <AnimatedBar value={profile.cooperativeness} color="bg-green-500" label="Cooperative" />
      <AnimatedBar value={profile.defensiveness} color="bg-red-500" label="Defensive" />

      {/* Escalation mini */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-[#64748b]">
          <span>Escalation</span>
          <motion.span
            key={profile.escalation}
            initial={{ scale: 1.4, color: "#ef4444" }}
            animate={{ scale: 1, color: "#64748b" }}
            transition={{ duration: 0.5 }}
          >
            {profile.escalation}
          </motion.span>
        </div>
        <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${getEscalationColor(profile.escalation)}`}
            initial={false}
            animate={{ width: `${profile.escalation}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Trust scores */}
      {profile.trust && (
        <div className="pt-1 border-t border-[#1e293b] space-y-1">
          <div className="text-xs text-[#475569] mb-1">Trust</div>
          {(["ability", "benevolence", "integrity"] as const).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-[#475569] w-16 capitalize">{k}</span>
              <div className="flex-1 h-1 bg-[#1e293b] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={false}
                  animate={{ width: `${profile.trust[k]}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <motion.span
                key={profile.trust[k]}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs text-[#64748b] w-6 text-right"
              >
                {profile.trust[k]}
              </motion.span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PRIMITIVE_ICONS: Record<string, React.ReactNode> = {
  Claim: <MessageSquare className="w-3 h-3" />,
  Interest: <Heart className="w-3 h-3" />,
  Event: <Clock className="w-3 h-3" />,
  Constraint: <AlertTriangle className="w-3 h-3" />,
  Commitment: <CheckCircle className="w-3 h-3" />,
  Agreement: <Target className="w-3 h-3" />,
  Narrative: <Shield className="w-3 h-3" />,
  Risk: <Zap className="w-3 h-3" />,
};

function PrimitiveGrid({ counts }: { counts: PrimitiveCounts }) {
  const types = Object.keys(PRIMITIVE_ICONS) as (keyof PrimitiveCounts)[];
  return (
    <div className="grid grid-cols-4 gap-2">
      {types.map((type) => (
        <motion.div
          key={type}
          className="bg-[#111827] rounded-lg p-2 flex flex-col items-center gap-1 border"
          animate={counts[type] > 0 ? { borderColor: "rgba(99,102,241,0.5)" } : { borderColor: "#1e293b" }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-indigo-400">{PRIMITIVE_ICONS[type]}</div>
          <motion.span
            key={counts[type]}
            initial={{ scale: 1.6, color: "#a5b4fc" }}
            animate={{ scale: 1, color: counts[type] > 0 ? "#e0e7ff" : "#6b7280" }}
            transition={{ duration: 0.4, type: "spring", stiffness: 400 }}
            className="text-sm font-bold"
          >
            {counts[type]}
          </motion.span>
          <span className="text-xs text-[#475569] text-center leading-tight">{type}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [skipToPhase, setSkipToPhase] = useState("");
  const [showCallout, setShowCallout] = useState(false);

  // ── TTS voice playback ──
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceFailed, setVoiceFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Guided tour ──
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accumulate transcript lines
  const [transcriptHistory, setTranscriptHistory] = useState<{ step: number; text: string; phase: string }[]>([]);

  // Accumulate primitive counts
  const [primitiveCounts, setPrimitiveCounts] = useState<PrimitiveCounts>({
    Claim: 0, Interest: 0, Event: 0, Constraint: 0,
    Commitment: 0, Agreement: 0, Narrative: 0, Risk: 0,
  });

  const step = STEPS[currentStep]!;

  // Build cumulative profiles by merging all steps up to current
  const sarah: PartyProfile = STEPS.slice(0, currentStep + 1).reduce(
    (acc, s) => mergeProfile(acc, s.sarah),
    {} as Partial<PartyProfile>
  ) as PartyProfile;

  const michael: PartyProfile = STEPS.slice(0, currentStep + 1).reduce(
    (acc, s) => mergeProfile(acc, s.michael),
    {} as Partial<PartyProfile>
  ) as PartyProfile;

  // Typing effect
  useEffect(() => {
    if (typingRef.current) clearTimeout(typingRef.current);
    setIsTyping(true);
    setDisplayedText("");

    const fullText = step.transcript;
    let i = 0;
    const charDelay = Math.max(12, 40 / speed);

    function typeNext() {
      if (i < fullText.length) {
        i++;
        setDisplayedText(fullText.slice(0, i));
        typingRef.current = setTimeout(typeNext, charDelay);
      } else {
        setIsTyping(false);
      }
    }

    typingRef.current = setTimeout(typeNext, 100);
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Show floating callout for 4s on each step change
  useEffect(() => {
    setShowCallout(true);
    const timer = setTimeout(() => setShowCallout(false), 4000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Check if this is first visit — show guided tour
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("concordia_demo_toured")) {
      setShowTour(true);
    }
  }, []);

  // TTS voice playback for CONCORDIA's lines when auto-playing
  useEffect(() => {
    if (!voiceEnabled || !isPlaying || voiceFailed) return;
    const currentTranscript = STEPS[currentStep]?.transcript ?? "";
    // Only play CONCORDIA lines
    if (!currentTranscript.startsWith("[CONCORDIA]")) return;
    // Strip the [CONCORDIA]: prefix and any stage directions
    const text = currentTranscript.replace(/^\[CONCORDIA\]:\s*/, "").slice(0, 400);
    if (text.length < 5) return;

    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceName: "Zephyr" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          // API key not configured or other error — disable voice silently
          setVoiceFailed(true);
          setVoiceEnabled(false);
          return;
        }
        if (data.audio && audioRef.current) {
          audioRef.current.src = `data:audio/mp3;base64,${data.audio}`;
          audioRef.current.play().catch(() => {
            // Autoplay blocked — silently ignore
          });
        }
      })
      .catch(() => {
        // Network error or API unavailable — disable voice silently
        setVoiceFailed(true);
        setVoiceEnabled(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isPlaying, voiceEnabled]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [displayedText, transcriptHistory]);

  // Auto-advance
  useEffect(() => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (isPlaying && currentStep < STEPS.length - 1) {
      const delay = 4000 / speed;
      autoAdvanceRef.current = setTimeout(() => {
        advanceStep();
      }, delay);
    }
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentStep, speed]);

  function advanceStep() {
    setCurrentStep((prev) => {
      if (prev >= STEPS.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      const nextIdx = prev + 1;
      const nextStep = STEPS[nextIdx]!;
      // Add to transcript history
      setTranscriptHistory((h) => [...h, { step: nextIdx + 1, text: nextStep.transcript, phase: nextStep.phase }]);
      // Update primitives
      setPrimitiveCounts((c) => {
        const nc = { ...c };
        Object.entries(nextStep.primitivesAdded).forEach(([k, v]) => {
          nc[k as keyof PrimitiveCounts] = (nc[k as keyof PrimitiveCounts] ?? 0) + (v ?? 0);
        });
        return nc;
      });
      return nextIdx;
    });
  }

  function goToStep(idx: number) {
    // Rebuild state from scratch
    const newHistory: { step: number; text: string; phase: string }[] = [];
    const newCounts: PrimitiveCounts = { Claim: 0, Interest: 0, Event: 0, Constraint: 0, Commitment: 0, Agreement: 0, Narrative: 0, Risk: 0 };

    for (let i = 0; i <= idx; i++) {
      const s = STEPS[i]!;
      newHistory.push({ step: i + 1, text: s.transcript, phase: s.phase });
      Object.entries(s.primitivesAdded).forEach(([k, v]) => {
        newCounts[k as keyof PrimitiveCounts] = (newCounts[k as keyof PrimitiveCounts] ?? 0) + (v ?? 0);
      });
    }

    setTranscriptHistory(newHistory.slice(0, -1)); // all but current (current shown via typing)
    setPrimitiveCounts(newCounts);
    setCurrentStep(idx);
  }

  function handleReset() {
    setIsPlaying(false);
    setTranscriptHistory([]);
    setPrimitiveCounts({ Claim: 0, Interest: 0, Event: 0, Constraint: 0, Commitment: 0, Agreement: 0, Narrative: 0, Risk: 0 });
    setCurrentStep(0);
  }

  function handleSkipToPhase(phase: string) {
    const idx = STEPS.findIndex((s) => s.phase === phase);
    if (idx !== -1) {
      goToStep(idx);
      setSkipToPhase("");
    }
  }

  const progressPercent = ((currentStep) / (STEPS.length - 1)) * 100;
  const uniquePhases = Array.from(new Set(STEPS.map((s) => s.phase)));

  // Get speaker style for transcript line
  function getSpeakerStyle(text: string) {
    if (text.startsWith("[CONCORDIA]")) return { color: "text-indigo-300", bg: "bg-indigo-950 border-indigo-800" };
    if (text.startsWith("[Sarah]")) return { color: "text-sky-300", bg: "bg-sky-950 border-sky-800" };
    if (text.startsWith("[Michael]")) return { color: "text-violet-300", bg: "bg-violet-950 border-violet-800" };
    return { color: "text-[#94a3b8]", bg: "bg-[#111827] border-[#1e293b]" };
  }

  const frameworkTag = extractFrameworkTag(step.annotation);
  const techniqueDesc = extractTechniqueDescription(step.annotation);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* ── Top Bar ── */}
      <header className="border-b border-[#1a2236] bg-[#0d1120]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">CONCORDIA</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-900 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-full font-medium">
              Interactive Demo
            </span>
            {/* LIVE DEMO pulsing indicator */}
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"
              />
              LIVE DEMO
            </span>
            <span className="text-xs text-[#475569]">Workplace Mediation — Sarah vs Michael</span>
          </div>

          <div className="flex-1 mx-4">
            <div className="h-1.5 bg-[#111827] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/workspace"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              Start Live Session
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-[#64748b] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main 3-col layout ── */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">
        {/* ── LEFT: Annotation ── */}
        <div className="w-64 shrink-0 space-y-3">
          <div className="text-xs text-[#475569] uppercase tracking-widest font-medium flex items-center gap-2">
            <Brain className={`w-3.5 h-3.5 text-indigo-400 ${isTyping ? "animate-spin" : ""}`} />
            AI Annotation
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className={`bg-[#111827] rounded-xl p-4 space-y-3 border ${
                step.escalationAlert
                  ? "border-red-500/40"
                  : step.deEscalation
                  ? "border-emerald-500/40"
                  : "border-[#1e293b]"
              }`}
            >
              {/* Phase badge */}
              <div
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${PHASE_COLORS[step.phase] ?? "bg-[#111827]"} bg-opacity-20 ${PHASE_TEXT_COLORS[step.phase] ?? "text-[#94a3b8]"}`}
                style={{ backgroundColor: undefined }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${PHASE_COLORS[step.phase] ?? "bg-[#475569]"}`} />
                {step.phase}
              </div>

              {/* Target */}
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <Users className="w-3 h-3" />
                <span>Target: {step.targetActor}</span>
              </div>

              {/* Annotation text */}
              <p className="text-xs text-[#94a3b8] leading-relaxed">{step.annotation}</p>

              {/* Alert banners */}
              {step.escalationAlert && (
                <div className="flex items-start gap-2 bg-red-950 border border-red-800 rounded-lg p-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-red-300">Escalation Circuit Break Active</span>
                </div>
              )}
              {step.deEscalation && (
                <div className="flex items-start gap-2 bg-green-950 border border-green-800 rounded-lg p-2">
                  <TrendingDown className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-green-300">De-escalation Protocol Engaged</span>
                </div>
              )}

              {/* What's happening breakdown */}
              <div className="pt-2 border-t border-[#1e293b] space-y-2">
                <div className="text-xs text-[#475569] font-medium uppercase tracking-wider">What&apos;s happening</div>
                {frameworkTag && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-indigo-300 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5">
                      {frameworkTag}
                    </span>
                  </div>
                )}
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-0.5">Technique</div>
                  <p className="text-xs text-[#94a3b8] leading-snug">{techniqueDesc}</p>
                </div>
                <div>
                  <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-0.5">Next move</div>
                  <p className="text-xs text-[#64748b] leading-snug">
                    {currentStep < STEPS.length - 1
                      ? `Step ${currentStep + 2}: ${STEPS[currentStep + 1]?.targetActor ?? ""} responds`
                      : "Agreement — session complete"}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Framework legend */}
          <div className="bg-[#0d1120] border border-[#1a2236] rounded-xl p-3 space-y-2">
            <div className="text-xs text-[#475569] font-medium">Frameworks Active</div>
            {["Fisher & Ury", "Glasl Escalation", "Lederach Transform.", "Bush & Folger"].map((fw) => (
              <div key={fw} className="flex items-center gap-2 text-xs text-[#64748b]">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {fw}
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Phase chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {uniquePhases.map((phase) => {
              const isActive = step.phase === phase;
              const isPast = STEPS.findIndex((s) => s.phase === phase) < currentStep;
              return (
                <motion.div
                  key={phase}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-all cursor-default ${
                    isActive
                      ? `${PHASE_COLORS[phase] ?? "bg-indigo-500"} text-white border-transparent`
                      : isPast
                      ? "bg-[#111827] text-[#64748b] border-[#1e293b]"
                      : "bg-[#0d1120] text-[#475569] border-[#1a2236]"
                  }`}
                >
                  {phase}
                </motion.div>
              );
            })}
          </div>

          {/* Party cards */}
          <div className="grid grid-cols-2 gap-3">
            <PartyCard name="Sarah Chen" profile={sarah} side="A" />
            <PartyCard name="Michael Torres" profile={michael} side="B" />
          </div>

          {/* Transcript panel */}
          <div className="flex-1 bg-[#0d1120] border border-[#1a2236] rounded-xl flex flex-col min-h-0" style={{ minHeight: 200 }}>
            <div className="px-4 py-2 border-b border-[#1a2236] flex items-center justify-between">
              <span className="text-xs text-[#64748b] font-medium">Transcript</span>
              {isTyping && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex items-center gap-1 text-xs text-indigo-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Transcribing...
                </motion.div>
              )}
            </div>
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth" style={{ maxHeight: 260 }}>
              {/* History */}
              {transcriptHistory.map((item, i) => {
                const style = getSpeakerStyle(item.text);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs leading-relaxed p-2.5 rounded-lg border ${style.bg} ${style.color}`}
                  >
                    {item.text}
                  </motion.div>
                );
              })}
              {/* Current (typing) */}
              {displayedText && (
                <div className={`text-xs leading-relaxed p-2.5 rounded-lg border ${getSpeakerStyle(displayedText).bg} ${getSpeakerStyle(displayedText).color}`}>
                  {displayedText}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-3 bg-current ml-0.5 align-text-bottom"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primitive grid */}
          <div>
            <div className="text-xs text-[#475569] mb-2 uppercase tracking-widest font-medium">Extracted Primitives</div>
            <PrimitiveGrid counts={primitiveCounts} />
          </div>

          {/* CTA panel at end of demo */}
          <AnimatePresence>
            {currentStep === STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">That&apos;s CONCORDIA in action.</h3>
                </div>
                <p className="text-[#94a3b8] text-xs leading-relaxed">
                  Ready to mediate a real dispute? Start a live session or explore the library of mediation frameworks.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href="/workspace"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    Start Live Session
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/library"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white text-xs font-medium transition-colors"
                  >
                    Explore the Library
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT ── */}
        <div className="w-52 shrink-0 space-y-3">
          {/* Escalation meter */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b] font-medium uppercase tracking-widest">Escalation</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#475569]" />
            </div>
            {/* Combined score (average) */}
            {(() => {
              const combined = Math.round((sarah.escalation + michael.escalation) / 2);
              return (
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <motion.span
                      key={combined}
                      initial={{ scale: 1.4, color: "#ef4444" }}
                      animate={{ scale: 1, color: combined >= 60 ? "#ef4444" : combined >= 35 ? "#f97316" : "#22c55e" }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl font-bold tabular-nums"
                    >
                      {combined}
                    </motion.span>
                    <span className={`text-xs font-medium mb-1 ${combined >= 60 ? "text-red-400" : combined >= 35 ? "text-orange-400" : "text-green-400"}`}>
                      {getEscalationLabel(combined)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#1e293b] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getEscalationColor(combined)}`}
                      initial={false}
                      animate={{ width: `${combined}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div>
                      <div className="text-xs text-[#475569] mb-1">Sarah</div>
                      <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getEscalationColor(sarah.escalation)}`}
                          animate={{ width: `${sarah.escalation}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <motion.span key={sarah.escalation} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-xs text-[#64748b]">{sarah.escalation}</motion.span>
                    </div>
                    <div>
                      <div className="text-xs text-[#475569] mb-1">Michael</div>
                      <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getEscalationColor(michael.escalation)}`}
                          animate={{ width: `${michael.escalation}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <motion.span key={michael.escalation} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-xs text-[#64748b]">{michael.escalation}</motion.span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Common Ground */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b] font-medium uppercase tracking-widest">Common Ground</span>
              <motion.span
                key={step.commonGround.length}
                initial={{ scale: 1.5, backgroundColor: "#4f46e5" }}
                animate={{ scale: 1, backgroundColor: "#1e1b4b" }}
                transition={{ duration: 0.4 }}
                className="text-xs font-bold text-indigo-300 bg-indigo-950 border border-indigo-800 rounded-full w-5 h-5 flex items-center justify-center"
              >
                {step.commonGround.length}
              </motion.span>
            </div>
            <AnimatePresence>
              {step.commonGround.length === 0 && (
                <p className="text-xs text-[#475569] italic">None identified yet</p>
              )}
              {step.commonGround.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 text-xs text-[#94a3b8]"
                >
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                  <span className="leading-tight">{item}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Phase indicator */}
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#64748b] font-medium uppercase tracking-widest">Phase</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.phase}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`text-base font-bold ${PHASE_TEXT_COLORS[step.phase] ?? "text-white"}`}
              >
                {step.phase}
              </motion.div>
            </AnimatePresence>
            <div className="space-y-1">
              {uniquePhases.map((phase) => {
                const phaseStepIdx = STEPS.findIndex((s) => s.phase === phase);
                const done = phaseStepIdx < currentStep;
                const active = step.phase === phase;
                return (
                  <div key={phase} className="flex items-center gap-2">
                    <motion.div
                      animate={{
                        backgroundColor: active ? "#6366f1" : done ? "#22c55e" : "#1e293b",
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span className={`text-xs ${active ? "text-white font-medium" : done ? "text-[#64748b]" : "text-[#475569]"}`}>
                      {phase}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="border-t border-[#1a2236] bg-[#0d1120]/90 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Play/Pause */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              if (currentStep >= STEPS.length - 1) return;
              setIsPlaying((p) => !p);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all ${
              isPlaying
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            } ${currentStep >= STEPS.length - 1 ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play"}
          </motion.button>

          {/* Manual step */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => currentStep > 0 && goToStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="w-8 h-8 rounded-lg bg-[#111827] hover:bg-[#1e293b] disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => currentStep < STEPS.length - 1 && advanceStep()}
              disabled={currentStep >= STEPS.length - 1}
              className="w-8 h-8 rounded-lg bg-[#111827] hover:bg-[#1e293b] disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-[#111827] rounded-full p-1">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  speed === s ? "bg-indigo-600 text-white" : "text-[#64748b] hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111827] hover:bg-[#1e293b] text-[#64748b] hover:text-white text-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Voice toggle */}
          <div className="relative group">
            <button
              onClick={() => {
                if (voiceFailed) return;
                setVoiceEnabled((v) => !v);
              }}
              title={
                voiceFailed
                  ? "Voice requires API credentials — running in silent mode"
                  : voiceEnabled
                  ? "Disable CONCORDIA voice"
                  : "Enable CONCORDIA voice (requires API key)"
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors border ${
                voiceFailed
                  ? "opacity-40 cursor-not-allowed bg-[#111827] border-[#1e293b] text-[#475569]"
                  : voiceEnabled
                  ? "bg-indigo-900/60 border-indigo-700 text-indigo-300 hover:bg-indigo-900"
                  : "bg-[#111827] border-[#1e293b] text-[#64748b] hover:text-white hover:border-indigo-700"
              }`}
            >
              {voiceEnabled && !voiceFailed ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {voiceFailed ? "Voice N/A" : voiceEnabled ? "Voice On" : "Voice"}
              </span>
            </button>
            {/* Tooltip */}
            {voiceFailed && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#0d1120] border border-[#1e293b] rounded-lg p-2 text-[10px] text-[#94a3b8] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                Voice requires API credentials. Running in silent mode.
              </div>
            )}
          </div>

          {/* Tour button */}
          <button
            onClick={() => { setTourStep(0); setShowTour(true); }}
            title="Guided walkthrough"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] text-[#64748b] hover:text-white text-sm transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tour</span>
          </button>

          {/* Skip to phase */}
          <div className="relative">
            <select
              value={skipToPhase}
              onChange={(e) => {
                if (e.target.value) handleSkipToPhase(e.target.value);
              }}
              className="appearance-none bg-[#111827] border border-[#1e293b] rounded-lg text-sm text-[#94a3b8] px-3 py-2 pr-8 cursor-pointer hover:bg-[#1e293b] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Skip to phase...</option>
              {uniquePhases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569] pointer-events-none" />
          </div>

          {/* Step counter */}
          <div className="ml-auto text-sm text-[#64748b] tabular-nums">
            Step{" "}
            <motion.span
              key={currentStep}
              initial={{ scale: 1.3, color: "#a5b4fc" }}
              animate={{ scale: 1, color: "#64748b" }}
              transition={{ duration: 0.3 }}
              className="font-bold text-white inline-block"
            >
              {currentStep + 1}
            </motion.span>{" "}
            / {STEPS.length}
          </div>
        </div>
      </div>

      {/* ── Floating AI Technique Callout ── */}
      <AnimatePresence>
        {showCallout && (
          <motion.div
            key={`callout-${currentStep}`}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-20 right-5 z-50 w-72 bg-[#0d1120] border border-indigo-500/30 rounded-xl shadow-2xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">AI Technique Applied</span>
            </div>
            {frameworkTag && (
              <span className="inline-block text-[10px] text-indigo-200 bg-indigo-950 border border-indigo-700 px-2 py-0.5 rounded font-mono">
                {frameworkTag}
              </span>
            )}
            <p className="text-xs text-[#94a3b8] leading-relaxed">{techniqueDesc}</p>
            <div className="h-0.5 bg-[#1e293b] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hidden Audio Element for TTS ── */}
      <audio ref={audioRef} className="hidden" />

      {/* ── Guided Walkthrough Tour ── */}
      <AnimatePresence>
        {showTour && (() => {
          const TOUR_STEPS = [
            {
              title: "Live Transcript",
              description: "Watch the conversation unfold in real-time with speaker identification, timestamps, and colour-coded dialogue — exactly as CONCORDIA hears it.",
              position: "center",
              icon: MessageSquare,
            },
            {
              title: "Psychological Profiles",
              description: "Party profiles update every turn — tracking emotional state, conflict style (Thomas-Kilmann), trust dimensions, cooperativeness, and risk indicators.",
              position: "center",
              icon: Brain,
            },
            {
              title: "Conflict Knowledge Graph",
              description: "Every claim, interest, constraint, and narrative is extracted and mapped as a structured primitive — building a live conflict ontology (TACITUS 8-primitive model).",
              position: "center",
              icon: Shield,
            },
            {
              title: "Phase Progression",
              description: "CONCORDIA guides the session through 6 structured phases: Opening → Discovery → Exploration → Negotiation → Resolution → Agreement, with transition gates.",
              position: "center",
              icon: TrendingUp,
            },
            {
              title: "Resolution Pathways",
              description: "After each extraction cycle, CONCORDIA identifies ZOPA, resolution pathways, and framework-grounded recommendations — and injects them back into the live session.",
              position: "center",
              icon: Target,
            },
          ];
          const tourData = TOUR_STEPS[tourStep]!;
          const Icon = tourData.icon;
          const isLast = tourStep === TOUR_STEPS.length - 1;

          return (
            <motion.div
              key="tour-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => {
                // Click outside to dismiss
                localStorage.setItem("concordia_demo_toured", "1");
                setShowTour(false);
              }}
            >
              <motion.div
                key={tourStep}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0d1120] border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-1.5">
                    {TOUR_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all ${
                          i === tourStep
                            ? "w-6 bg-indigo-500"
                            : i < tourStep
                            ? "w-3 bg-indigo-800"
                            : "w-3 bg-[#1e293b]"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem("concordia_demo_toured", "1");
                      setShowTour(false);
                    }}
                    className="text-[#475569] hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>

                {/* Content */}
                <div className="mb-2 text-[10px] text-indigo-400 font-mono uppercase tracking-widest">
                  {tourStep + 1} / {TOUR_STEPS.length}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{tourData.title}</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-6">
                  {tourData.description}
                </p>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  {tourStep > 0 && (
                    <button
                      onClick={() => setTourStep((t) => t - 1)}
                      className="px-4 py-2 rounded-lg bg-[#111827] hover:bg-[#1e293b] border border-[#1e293b] text-[#94a3b8] hover:text-white text-sm transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isLast) {
                        localStorage.setItem("concordia_demo_toured", "1");
                        setShowTour(false);
                      } else {
                        setTourStep((t) => t + 1);
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isLast ? (
                      <>Let&apos;s go <ChevronRight className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Next <ChevronRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                  {!isLast && (
                    <button
                      onClick={() => {
                        localStorage.setItem("concordia_demo_toured", "1");
                        setShowTour(false);
                      }}
                      className="text-[10px] text-[#475569] hover:text-[#64748b] transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Demo Completion Screen ── */}
      <AnimatePresence>
        {currentStep >= STEPS.length - 1 && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4, ease: "easeOut" }}
              className="bg-[#0d1120] border border-[#1e293b] rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl text-center"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Agreement Reached</h2>
              <p className="text-[#64748b] text-sm mb-6 leading-relaxed">
                CONCORDIA guided Sarah and Michael from heated conflict to a signed framework in{" "}
                <span className="text-white font-semibold">12 exchanges</span> — extracting{" "}
                <span className="text-white font-semibold">14 conflict primitives</span>, de-escalating
                from Level&nbsp;3, and identifying a ZOPA built on mutual trust.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-7">
                {[
                  { label: "Primitives extracted", value: "14", color: "text-indigo-400" },
                  { label: "Trust increase", value: "+35%", color: "text-emerald-400" },
                  { label: "Escalation", value: "78→10", color: "text-amber-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#111827] rounded-xl p-3 border border-[#1e293b]">
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-[10px] text-[#475569] uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/workspace"
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Start a Real Session →
                </Link>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#111827] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white text-sm transition-colors border border-[#1e293b]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Replay Demo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
