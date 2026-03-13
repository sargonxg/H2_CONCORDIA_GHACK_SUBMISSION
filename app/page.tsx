"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Shield, Mic, BookOpen, Brain, Target, TrendingUp,
  Users, Zap, Network, Activity, Heart, AlertTriangle,
  Play, ArrowRight, ChevronRight, Star, Globe, Scale,
  CheckCircle2, X,
} from "lucide-react";

// ── Auto-playing demo preview ──
const DEMO_STEPS = [
  { phase: "Opening",     speaker: "CONCORDIA", text: "Welcome. I'm CONCORDIA, your AI mediator. Let's establish some ground rules before we begin...", coop: [45, 50], def: [55, 60], escalation: 10 },
  { phase: "Discovery",   speaker: "Sarah",     text: "The issue is that Michael has been ignoring our sprint planning process. Stakeholders are completely in the dark.", coop: [43, 52], def: [65, 58], escalation: 28 },
  { phase: "Discovery",   speaker: "CONCORDIA", text: "Sarah, I can hear the frustration in that. Michael — can you help me understand how you see the situation?", coop: [46, 53], def: [62, 55], escalation: 22 },
  { phase: "Discovery",   speaker: "Michael",   text: "I need creative space. The planning rituals are killing my focus. I can deliver if I'm trusted to work my way.", coop: [47, 48], def: [60, 68], escalation: 45 },
  { phase: "Exploration", speaker: "CONCORDIA", text: "I'm noticing something important — you both deeply value team success. The disagreement is about *how* to achieve it.", coop: [55, 60], def: [48, 50], escalation: 28 },
  { phase: "Negotiation", speaker: "CONCORDIA", text: "What if we designed a lightweight visibility protocol that gives Sarah what she needs without constraining Michael's workflow?", coop: [68, 72], def: [35, 32], escalation: 12 },
  { phase: "Resolution",  speaker: "Both",      text: "Agreement reached: weekly async updates + protected deep-work blocks. Both parties confirm.", coop: [82, 85], def: [18, 15], escalation: 5 },
];

function AnimatedDemoPreview() {
  const [step, setStep] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => { setCharIdx(0); return (s + 1) % DEMO_STEPS.length; });
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const text = DEMO_STEPS[step]!.text;
    if (charIdx >= text.length) return;
    const t = setTimeout(() => setCharIdx((c) => c + 1), 20);
    return () => clearTimeout(t);
  }, [step, charIdx]);

  const d = DEMO_STEPS[step]!;
  const PHASES_DEMO = ["Opening", "Discovery", "Exploration", "Negotiation", "Resolution"];
  const phaseIdx = PHASES_DEMO.indexOf(d.phase);
  const speakerColor = d.speaker === "Sarah" ? "#0ea5e9" : d.speaker === "Michael" ? "#8b5cf6" : "#3b82f6";

  return (
    <div className="bg-[#0a0e1a] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/5">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1e293b] bg-[#0d1120]">
        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" /></div>
        <span className="text-[10px] font-mono text-[#475569] ml-2 uppercase tracking-wider">CONCORDIA Live Workspace</span>
        <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] text-emerald-500 font-mono">LIVE</span></div>
      </div>
      <div className="grid grid-cols-3 gap-0 min-h-[240px]">
        {/* Party A */}
        <div className="p-4 border-r border-[#1e293b] space-y-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-[11px] font-bold text-sky-400">S</div>
            <span className="text-xs font-semibold text-white">Sarah</span>
            <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Competing</span>
          </div>
          {["Cooperative","Defensive"].map((lbl, li) => (
            <div key={lbl}>
              <div className="flex justify-between text-[9px] text-[#475569] mb-1"><span>{lbl}</span><span style={{ color: li === 0 ? "#10b981" : "#ef4444" }}>{li === 0 ? d.coop[0] : d.def[0]}%</span></div>
              <div className="h-1 bg-[#1e293b] rounded-full"><motion.div animate={{ width: `${li === 0 ? d.coop[0] : d.def[0]}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: li === 0 ? "#10b981" : "#ef4444" }} /></div>
            </div>
          ))}
          <div className="pt-1 space-y-1">{["Stakeholder visibility","Process clarity","Team alignment"].map(n => (<div key={n} className="text-[9px] px-1.5 py-0.5 rounded border border-[#1e293b] text-[#64748b]">{n}</div>))}</div>
        </div>
        {/* Center */}
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div className="w-full">
            <div className="flex justify-around text-[8px] text-[#334155] mb-1.5">
              {PHASES_DEMO.map((p, i) => <span key={p} style={{ color: i <= phaseIdx ? "#3b82f6" : "#334155" }}>{p.slice(0,4)}</span>)}
            </div>
            <div className="h-0.5 bg-[#1e293b] rounded-full"><motion.div animate={{ width: `${(phaseIdx / 4) * 100}%` }} transition={{ duration: 0.8 }} className="h-full bg-blue-500 rounded-full" /></div>
          </div>
          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full">
            <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: speakerColor }}>{d.speaker}</div>
            <p className="text-[10px] text-[#94a3b8] leading-relaxed min-h-[48px]">{d.text.slice(0, charIdx)}<span className="animate-pulse">|</span></p>
          </motion.div>
          <div className="w-full">
            <div className="flex justify-between text-[9px] text-[#475569] mb-1"><span>Escalation Risk</span><span style={{ color: d.escalation > 50 ? "#ef4444" : d.escalation > 30 ? "#f59e0b" : "#10b981" }}>{d.escalation}</span></div>
            <div className="h-1 bg-[#1e293b] rounded-full"><motion.div animate={{ width: `${d.escalation}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: d.escalation > 50 ? "#ef4444" : d.escalation > 30 ? "#f59e0b" : "#10b981" }} /></div>
          </div>
        </div>
        {/* Party B */}
        <div className="p-4 border-l border-[#1e293b] space-y-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-[11px] font-bold text-violet-400">M</div>
            <span className="text-xs font-semibold text-white">Michael</span>
            <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Avoiding</span>
          </div>
          {["Cooperative","Defensive"].map((lbl, li) => (
            <div key={lbl}>
              <div className="flex justify-between text-[9px] text-[#475569] mb-1"><span>{lbl}</span><span style={{ color: li === 0 ? "#10b981" : "#ef4444" }}>{li === 0 ? d.coop[1] : d.def[1]}%</span></div>
              <div className="h-1 bg-[#1e293b] rounded-full"><motion.div animate={{ width: `${li === 0 ? d.coop[1] : d.def[1]}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: li === 0 ? "#10b981" : "#ef4444" }} /></div>
            </div>
          ))}
          <div className="pt-1 space-y-1">{["Creative autonomy","Deep work focus","Trust & respect"].map(n => (<div key={n} className="text-[9px] px-1.5 py-0.5 rounded border border-[#1e293b] text-[#64748b]">{n}</div>))}</div>
        </div>
      </div>
    </div>
  );
}

function InViewSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>
      {children}
    </motion.div>
  );
}

const PRIMITIVES = [
  { name: "Actor",      color: "#0ea5e9", desc: "Parties & stakeholders", detail: "Identifies all individuals, groups, and institutions with a stake in the conflict — primary parties, secondary actors, and interested observers." },
  { name: "Claim",      color: "#8b5cf6", desc: "Positions & demands",    detail: "Explicit statements of what each party wants or demands — the positional layer that sits atop underlying interests." },
  { name: "Interest",   color: "#10b981", desc: "Underlying needs",       detail: "The deeper motivations, fears, and needs that drive surface-level positions. The key to principled negotiation." },
  { name: "Constraint", color: "#f59e0b", desc: "Limits & boundaries",    detail: "Legal, practical, or relational limits that bound the solution space — what cannot be changed regardless of will." },
  { name: "Leverage",   color: "#ef4444", desc: "Power & influence",      detail: "Sources of power each actor can deploy — including BATNA, coalitions, information asymmetry, and institutional authority." },
  { name: "Commitment", color: "#06b6d4", desc: "Promises & agreements",  detail: "Statements of intent, formal pledges, or provisional agreements that bind parties to future action." },
  { name: "Event",      color: "#ec4899", desc: "Key incidents",          detail: "Critical moments that triggered or escalated the conflict — the factual timeline underlying the narrative dispute." },
  { name: "Narrative",  color: "#a855f7", desc: "Meaning-making frames",  detail: "The interpretive stories each party tells about the conflict — identity, justice, and meaning that must be addressed for lasting peace." },
];

const CAPABILITIES = [
  { icon: Brain,         title: "Psychological Profiling",  desc: "Thomas-Kilmann conflict styles, Plutchik emotional mapping, Mayer/Davis/Schoorman trust — updated live.", color: "#0ea5e9" },
  { icon: Network,       title: "Knowledge Graph",          desc: "TACITUS 8-primitive ontology extracted into a live conflict graph. Every claim, interest, and event structured.", color: "#8b5cf6" },
  { icon: AlertTriangle, title: "De-escalation AI",         desc: "Monitors Gottman's Four Horsemen. Applies Ury's 5 techniques and Glasl 9-stage interventions automatically.", color: "#ef4444" },
  { icon: TrendingUp,    title: "Resolution Pathways",      desc: "Identifies ZOPA, tests ripeness (Zartman), generates concrete agreement terms grounded in objective criteria.", color: "#10b981" },
];

const USE_CASES = [
  { icon: Scale,   title: "Professional Mediators",  items: ["Real-time ontology structuring","Psychological indicator tracking","Multi-framework intervention library","Automated agreement drafting"] },
  { icon: Users,   title: "HR & Employee Relations", items: ["Neutral, consistent facilitation","Workplace dispute documentation","De-escalation risk monitoring","Resolution pathway generation"] },
  { icon: Globe,   title: "Legal / ADR",             items: ["Structured facts vs. disputed facts","BATNA / ZOPA analysis","Interest-based option generation","Transcript archiving"] },
  { icon: Heart,   title: "Individuals & Couples",   items: ["Guided self-mediation","Empowerment + recognition focus","Common ground identification","Plain-language agreement terms"] },
];

const COMPARISON_ROWS = [
  { feature: "Interface",           generic: "Chat-style Q&A",              concordia: "Live mediation workspace + audio" },
  { feature: "Conflict model",      generic: "None — single-turn responses", concordia: "8-primitive ontological grammar" },
  { feature: "Frameworks",          generic: "General knowledge only",       concordia: "31 peer-reviewed frameworks, live" },
  { feature: "Emotional intelligence", generic: "Sentiment detection",       concordia: "Plutchik mapping + Gottman signals" },
  { feature: "Visualization",       generic: "None",                         concordia: "Live knowledge graph + timeline" },
  { feature: "Profiling",           generic: "None",                         concordia: "Thomas-Kilmann + trust indices" },
  { feature: "De-escalation",       generic: "Polite tone only",             concordia: "Glasl 9-stage + Ury 5 techniques" },
  { feature: "Pre-session",         generic: "None",                         concordia: "Intake wizard + party profiling" },
  { feature: "Output",              generic: "Text summary",                 concordia: "Structured settlement agreement" },
];

const ALL_FRAMEWORKS = [
  "Fisher & Ury · Principled Negotiation · 1981",
  "Lederach · Conflict Transformation · 1995",
  "Glasl · 9-Stage Escalation Model · 1982",
  "Zartman · Ripeness Theory · 1985",
  "Thomas-Kilmann · Conflict Styles · 1974",
  "Bush & Folger · Transformative Mediation · 1994",
  "Winslade & Monk · Narrative Mediation · 2000",
  "Gottman · Four Horsemen · 1994",
  "Ury · Getting Past No · 1991",
  "Raiffa · Art & Science of Negotiation · 1982",
  "Moore · Mediation Process · 1986",
  "Deutsch · Constructive Conflict · 1973",
  "Pruitt & Rubin · Social Conflict · 1986",
  "Folger & Jones · New Directions · 1994",
  "Susskind · Environmental Diplomacy · 1994",
  "Bercovitch · International Mediation · 1992",
  "Kriesberg · Constructive Conflicts · 1998",
  "Burton · Conflict Resolution · 1990",
  "Galtung · Peace by Peaceful Means · 1996",
  "Curle · Making Peace · 1971",
  "Avruch · Culture & Conflict · 1998",
  "LeBaron · Bridging Cultural Conflicts · 2003",
  "Schelling · Strategy of Conflict · 1960",
  "Axelrod · Evolution of Cooperation · 1984",
  "Ostrom · Governing the Commons · 1990",
  "Habermas · Discourse Ethics · 1990",
  "Rawls · Theory of Justice · 1971",
  "Shapiro · Negotiating the Nonnegotiable · 2016",
  "Mnookin · Beyond Winning · 2000",
  "Bazerman · Negotiation Genius · 2007",
  "Smartsettle · RCB Algorithm · 2001",
];

export default function LandingPage() {
  const [hoveredPrimitive, setHoveredPrimitive] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden font-body">
      <style>{`
        @keyframes meshShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .gradient-mesh { background: radial-gradient(ellipse at 20% 50%,rgba(59,130,246,.15) 0%,transparent 60%), radial-gradient(ellipse at 80% 20%,rgba(139,92,246,.12) 0%,transparent 60%), radial-gradient(ellipse at 60% 80%,rgba(16,185,129,.08) 0%,transparent 50%); background-size:300% 300%; animation:meshShift 12s ease infinite; }
        .glow-card:hover { box-shadow: 0 0 32px rgba(59,130,246,.12), 0 0 0 1px rgba(59,130,246,.2); }
        .concordia-col { box-shadow: 0 0 24px rgba(59,130,246,.08), 0 0 0 1px rgba(59,130,246,.18); }
      `}</style>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#030712]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="font-bold tracking-tight text-base">CONCORDIA</span>
          <span className="text-[10px] font-mono text-[#475569] border border-[#1e293b] px-1.5 py-0.5 rounded ml-1">by TACITUS ◳</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#64748b]">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
          <Link href="/library" className="hover:text-white transition-colors">Library</Link>
          <Link href="/demo" className="hover:text-white transition-colors">Demo</Link>
        </div>
        <Link href="/workspace" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Open Platform
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 gradient-mesh">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#030712_100%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* LEFT */}
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-amber-400 border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3" />
                  Built on 60 years of conflict resolution research
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-serif text-5xl md:text-6xl leading-[1.1] tracking-tight"
              >
                The AI That Listens,{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                  Structures,
                </span>{" "}
                and Resolves
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-[#94a3b8] leading-relaxed max-w-xl"
              >
                Real-time AI mediator combining live audio conversation, psychological profiling, and 31 conflict resolution frameworks — from first word to signed agreement.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-2"
              >
                {["Gemini Live Audio", "TACITUS Ontology", "Affective Dialog", "31 Frameworks"].map((t) => (
                  <span key={t} className="text-[11px] px-3 py-1 rounded-full border border-[#1e293b] bg-[#0a0e1a] text-[#64748b] font-mono">
                    {t}
                  </span>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-start gap-3"
              >
                <Link
                  href="/workspace"
                  className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35"
                >
                  <Mic className="w-4 h-4" />
                  Start Mediation
                </Link>
                <Link
                  href="/demo"
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-all"
                >
                  <Play className="w-4 h-4" />
                  Watch Demo
                </Link>
              </motion.div>
            </div>
            {/* RIGHT — Demo */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="hidden lg:block"
            >
              <AnimatedDemoPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NOT ANOTHER CHATBOT ── */}
      <InViewSection className="py-24 px-6 bg-[#050a14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Differentiation</p>
            <h2 className="font-serif text-4xl">Not Another Chatbot</h2>
            <p className="text-[#64748b] max-w-xl mx-auto text-sm">
              Generic AI gives you a conversation. CONCORDIA gives you a structured path to resolution.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-[#334155] border-b border-[#0f172a] w-1/3">Feature</th>
                  <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-[#475569] border-b border-[#0f172a] text-center">Generic AI Assistant</th>
                  <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-blue-400 border-b border-blue-500/30 text-center concordia-col rounded-t-lg">CONCORDIA</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-[#0a0e1a]" : "bg-transparent"}>
                    <td className="px-4 py-3 text-[#64748b] font-medium border-b border-[#0f172a]/50">{row.feature}</td>
                    <td className="px-4 py-3 text-center text-[#475569] border-b border-[#0f172a]/50">
                      <span className="flex items-center justify-center gap-1.5">
                        <X className="w-3.5 h-3.5 text-[#334155]" />
                        {row.generic}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-b border-blue-500/10 concordia-col">
                      <span className="flex items-center justify-center gap-1.5 text-emerald-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {row.concordia}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </InViewSection>

      {/* ── TACITUS ONTOLOGY ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-12 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Architecture</p>
              <h2 className="font-serif text-4xl">The TACITUS Ontology</h2>
              <p className="text-[#64748b] max-w-2xl mx-auto text-sm leading-relaxed">
                A neurosymbolic conflict grammar — 8 primitive types capturing every dimension of human conflict, extracted in real time from natural language. Hover each card to expand.
              </p>
            </div>
          </InViewSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRIMITIVES.map((p) => (
              <InViewSection key={p.name}>
                <motion.div
                  onHoverStart={() => setHoveredPrimitive(p.name)}
                  onHoverEnd={() => setHoveredPrimitive(null)}
                  whileHover={{ scale: 1.03 }}
                  className="bg-[#0a0e1a] border border-[#1e293b] rounded-xl p-4 space-y-2 cursor-default transition-all hover:border-opacity-60 relative overflow-hidden"
                  style={{ borderColor: hoveredPrimitive === p.name ? `${p.color}40` : undefined }}
                >
                  <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-xs font-bold font-mono" style={{ backgroundColor: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25` }}>{p.name[0]}</div>
                  <div className="text-sm font-bold text-center" style={{ color: p.color }}>{p.name}</div>
                  <div className="text-[10px] text-[#475569] text-center">{p.desc}</div>
                  <AnimatePresence>
                    {hoveredPrimitive === p.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-[#94a3b8] leading-relaxed pt-2 border-t border-[#1e293b] overflow-hidden"
                      >
                        {p.detail}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </InViewSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section id="capabilities" className="py-24 px-6 bg-[#050a14]">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-16 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Capabilities</p>
              <h2 className="font-serif text-4xl">Everything a Mediator Needs</h2>
            </div>
          </InViewSection>
          <div className="grid md:grid-cols-2 gap-6">
            {CAPABILITIES.map((cap) => { const Icon = cap.icon; return (
              <InViewSection key={cap.title}>
                <div className="glow-card bg-[#0a0e1a] border border-[#1e293b] rounded-2xl p-6 space-y-4 transition-all cursor-default h-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cap.color}15`, border: `1px solid ${cap.color}25` }}>
                    <Icon className="w-6 h-6" style={{ color: cap.color }} />
                  </div>
                  <h3 className="text-lg font-bold">{cap.title}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">{cap.desc}</p>
                </div>
              </InViewSection>
            ); })}
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW ── */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-12 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Live Preview</p>
              <h2 className="font-serif text-4xl">Watch It Work</h2>
              <p className="text-[#64748b] text-sm">Sarah (Team Lead) and Michael (Senior Dev) — workplace dispute, live resolution.</p>
            </div>
          </InViewSection>
          <InViewSection><AnimatedDemoPreview /></InViewSection>
          <InViewSection>
            <div className="text-center mt-8">
              <Link href="/demo" className="inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 text-sm">
                Try Full Interactive Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </InViewSection>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-24 px-6 bg-[#050a14]">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-16 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Use Cases</p>
              <h2 className="font-serif text-4xl">Built for Every Context</h2>
            </div>
          </InViewSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {USE_CASES.map((uc) => { const Icon = uc.icon; return (
              <InViewSection key={uc.title}>
                <div className="bg-[#0a0e1a] border border-[#1e293b] rounded-2xl p-5 space-y-4 h-full">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold">{uc.title}</h3>
                  <ul className="space-y-2">{uc.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#64748b]">
                      <ChevronRight className="w-3 h-3 mt-0.5 text-blue-500 shrink-0" />{item}
                    </li>
                  ))}</ul>
                </div>
              </InViewSection>
            ); })}
          </div>
        </div>
      </section>

      {/* ── GROUNDED IN SCIENCE ── */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-12 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Scientific Foundation</p>
              <h2 className="font-serif text-4xl">Grounded in Science</h2>
              <p className="text-[#64748b] text-sm max-w-2xl mx-auto leading-relaxed">
                Every intervention, every prompt, every framework — peer-reviewed and field-tested. Conflict resolution is a science, not an art.
              </p>
            </div>
          </InViewSection>

          {/* Marquee */}
          <div className="relative mb-12 py-4 border-y border-[#0f172a] overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              {[...ALL_FRAMEWORKS, ...ALL_FRAMEWORKS].map((fw, i) => (
                <span key={i} className="inline-flex items-center gap-3 mx-6 text-[11px] font-mono text-[#475569]">
                  <span className="w-1 h-1 rounded-full bg-blue-500/60 shrink-0" />
                  {fw}
                </span>
              ))}
            </div>
          </div>

          {/* Credentialing footer */}
          <InViewSection>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Globe,   label: "UN Pedigree",        text: "Built by a former UN Political Affairs Officer with 8 years on the Syria desk intelligence team." },
                { icon: BookOpen, label: "Academic Grounding", text: "Columbia SIPA + Sciences Po Paris. Conflict resolution as rigorous social science." },
                { icon: Target,  label: "31 Frameworks",      text: "Every major conflict resolution framework from Fisher & Ury (1981) to Smartsettle RCB (2001)." },
              ].map(({ icon: Icon, label, text }) => (
                <div key={label} className="bg-[#050a14] border border-[#0f172a] rounded-xl p-5 space-y-2">
                  <Icon className="w-5 h-5 text-blue-500" />
                  <div className="text-xs font-semibold text-white">{label}</div>
                  <p className="text-xs text-[#475569] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </InViewSection>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#0f172a] bg-[#050a14] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-lg">CONCORDIA</span>
                <span className="text-[10px] font-mono text-[#334155] border border-[#1e293b] px-1.5 py-0.5 rounded">by TACITUS ◳</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">Conflict resolution as a science. The TACITUS Institute's AI-native mediation platform.</p>
              <div className="flex items-center gap-1.5 text-[10px] text-[#334155]">
                <Star className="w-3 h-3 text-amber-500" />
                Gemini AI · Next.js 15 · Google Cloud
              </div>
            </div>
            {/* Platform */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#334155]">Platform</h4>
              {[["Live Workspace","/workspace"],["Interactive Demo","/demo"],["Resolution Library","/library"],["Advisor Chat","/chat"]].map(([l,h]) => (
                <Link key={l} href={h!} className="block text-xs text-[#475569] hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
            {/* Resources */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#334155]">Resources</h4>
              {["Framework Library","TACITUS Ontology","Case Studies","API Documentation"].map(f => (
                <div key={f} className="text-xs text-[#475569]">{f}</div>
              ))}
            </div>
            {/* Legal */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#334155]">Legal</h4>
              {["Privacy Policy","Terms of Service","Cookie Policy"].map(f => (
                <div key={f} className="text-xs text-[#475569]">{f}</div>
              ))}
              <div className="pt-2 text-[10px] text-[#334155] leading-relaxed border-t border-[#0f172a]">
                CONCORDIA is a communication facilitation tool. It does not provide legal advice.
              </div>
            </div>
          </div>
          <div className="border-t border-[#0f172a] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-[#334155] font-mono">
            <span>
              CONCORDIA by TACITUS◳ ·{" "}
              <a href="https://tacitus.me" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">tacitus.me</a>{" "}
              · <a href="mailto:hello@tacitus.me" className="hover:text-white transition-colors">hello@tacitus.me</a>
            </span>
            <span>© 2026 TACITUS Institute for Conflict Resolution</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
