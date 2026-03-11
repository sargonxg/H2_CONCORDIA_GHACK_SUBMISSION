"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  Shield, Mic, BookOpen, Brain, Target, TrendingUp,
  Users, Zap, Network, Activity, Heart, AlertTriangle,
  Play, ArrowRight, ChevronRight, Star, Globe, Scale,
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
    const text = DEMO_STEPS[step].text;
    if (charIdx >= text.length) return;
    const t = setTimeout(() => setCharIdx((c) => c + 1), 20);
    return () => clearTimeout(t);
  }, [step, charIdx]);

  const d = DEMO_STEPS[step];
  const PHASES = ["Opening", "Discovery", "Exploration", "Negotiation", "Resolution"];
  const phaseIdx = PHASES.indexOf(d.phase);
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
              {PHASES.map((p, i) => <span key={p} style={{ color: i <= phaseIdx ? "#3b82f6" : "#334155" }}>{p.slice(0,4)}</span>)}
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
  { name: "Actor",      color: "#0ea5e9", desc: "Parties & stakeholders" },
  { name: "Claim",      color: "#8b5cf6", desc: "Positions & demands" },
  { name: "Interest",   color: "#10b981", desc: "Underlying needs" },
  { name: "Constraint", color: "#f59e0b", desc: "Limits & boundaries" },
  { name: "Leverage",   color: "#ef4444", desc: "Power & influence" },
  { name: "Commitment", color: "#06b6d4", desc: "Promises & agreements" },
  { name: "Event",      color: "#ec4899", desc: "Key incidents" },
  { name: "Narrative",  color: "#a855f7", desc: "Meaning-making frames" },
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      <style>{`
        @keyframes meshShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .gradient-mesh { background: radial-gradient(ellipse at 20% 50%,rgba(59,130,246,.15) 0%,transparent 60%), radial-gradient(ellipse at 80% 20%,rgba(139,92,246,.12) 0%,transparent 60%), radial-gradient(ellipse at 60% 80%,rgba(16,185,129,.08) 0%,transparent 50%); background-size:300% 300%; animation:meshShift 12s ease infinite; }
        .glow-card:hover { box-shadow: 0 0 32px rgba(59,130,246,.12), 0 0 0 1px rgba(59,130,246,.2); }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#030712]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="font-bold tracking-tight">CONCORDIA</span>
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

      {/* 1. HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 gradient-mesh">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#030712_100%)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="font-mono uppercase tracking-widest text-[11px] text-[#64748b]">TACITUS Institute for Conflict Resolution</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            AI-Powered{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">Conflict</span>
            <br />Resolution
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Real-time AI mediator that listens, structures, profiles, and guides two parties toward resolution — built on 30+ peer-reviewed conflict frameworks.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/workspace" className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:shadow-xl">
              <Mic className="w-5 h-5" />Start Mediation
            </Link>
            <Link href="/demo" className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-medium text-base transition-all">
              <Play className="w-5 h-5" />Watch Demo
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-wrap justify-center gap-6 text-[11px] text-[#475569] font-mono uppercase tracking-wider pt-4">
            {["Gemini Live API","TACITUS Ontology","Real-time Audio","8 Primitive Types","6 Mediation Frameworks"].map(t => (
              <span key={t} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-500" />{t}</span>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#334155]">
          <span className="text-[10px] font-mono uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-4 h-6 rounded-full border border-[#334155] flex items-center justify-center">
            <div className="w-1 h-1.5 rounded-full bg-[#475569]" />
          </motion.div>
        </motion.div>
      </section>

      {/* 2. CREDIBILITY BAND */}
      <InViewSection className="border-y border-[#0f172a] bg-[#050a14] py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-mono uppercase tracking-widest text-[#334155] mb-8">Built on the TACITUS Conflict Grammar — 30+ peer-reviewed frameworks</p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {["Fisher & Ury","Lederach","Glasl","Zartman","Thomas-Kilmann","Bush & Folger","Winslade & Monk","Gottman"].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full border border-[#1e293b] bg-[#0a0e1a] text-[#64748b] font-mono hover:border-blue-500/40 hover:text-blue-400 transition-colors cursor-default">{f}</span>
            ))}
          </div>
          <p className="text-center text-xs text-[#334155]">Created by a former UN Political Affairs Officer — <span className="text-[#475569]">conflict resolution as a science, not an art</span></p>
        </div>
      </InViewSection>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-16 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Process</p>
              <h2 className="text-4xl font-bold">Three Steps to Resolution</h2>
              <p className="text-[#64748b] max-w-xl mx-auto">From raw conversation to structured agreement — in a single session.</p>
            </div>
          </InViewSection>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[36%] right-[36%] h-px bg-gradient-to-r from-blue-500/30 to-violet-500/30" />
            {[
              { step: "01", title: "Speak Naturally", color: "#0ea5e9", desc: "Both parties speak in their own words. CONCORDIA listens, transcribes, and directs the conversation — one question at a time.",
                svg: <svg viewBox="0 0 64 64" className="w-14 h-14"><circle cx="32" cy="32" r="22" fill="rgba(14,165,233,0.1)" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5"/><rect x="24" y="16" width="16" height="22" rx="8" fill="rgba(14,165,233,0.2)" stroke="#0ea5e9" strokeWidth="1.5"/><line x1="22" y1="44" x2="22" y2="50" stroke="#0ea5e9" strokeWidth="1.5"/><line x1="42" y1="44" x2="42" y2="50" stroke="#0ea5e9" strokeWidth="1.5"/><path d="M20 38 Q20 46 32 46 Q44 46 44 38" stroke="#0ea5e9" strokeWidth="1.5" fill="none"/><line x1="26" y1="50" x2="38" y2="50" stroke="#0ea5e9" strokeWidth="1.5"/></svg>
              },
              { step: "02", title: "AI Structures", color: "#8b5cf6", desc: "8 conflict primitives are extracted, psychological profiles built, escalation risk tracked — all in real time on the knowledge graph.",
                svg: <svg viewBox="0 0 64 64" className="w-14 h-14"><circle cx="32" cy="32" r="22" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" strokeWidth="1.5"/><circle cx="32" cy="20" r="3.5" fill="#8b5cf6"/><circle cx="20" cy="38" r="3.5" fill="#8b5cf6"/><circle cx="44" cy="38" r="3.5" fill="#8b5cf6"/><circle cx="26" cy="48" r="2.5" fill="rgba(139,92,246,0.6)"/><circle cx="38" cy="48" r="2.5" fill="rgba(139,92,246,0.6)"/><line x1="32" y1="20" x2="20" y2="38" stroke="rgba(139,92,246,0.5)" strokeWidth="1"/><line x1="32" y1="20" x2="44" y2="38" stroke="rgba(139,92,246,0.5)" strokeWidth="1"/><line x1="20" y1="38" x2="26" y2="48" stroke="rgba(139,92,246,0.4)" strokeWidth="1"/><line x1="44" y1="38" x2="38" y2="48" stroke="rgba(139,92,246,0.4)" strokeWidth="1"/></svg>
              },
              { step: "03", title: "Find Resolution", color: "#10b981", desc: "Common ground surfaces. ZOPA identified, ripeness tested, concrete agreement terms generated and confirmed by both parties.",
                svg: <svg viewBox="0 0 64 64" className="w-14 h-14"><circle cx="32" cy="32" r="22" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1.5"/><path d="M20 32 L28 42 L44 24" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              },
            ].map((s, i) => (
              <InViewSection key={s.step}>
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-2xl border flex items-center justify-center mx-auto" style={{ borderColor: `${s.color}30`, backgroundColor: `${s.color}08` }}>
                      {s.svg}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: s.color }}>{i+1}</div>
                  </div>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">{s.desc}</p>
                </div>
              </InViewSection>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CAPABILITIES */}
      <section id="capabilities" className="py-24 px-6 bg-[#050a14]">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-16 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Capabilities</p>
              <h2 className="text-4xl font-bold">Everything a Mediator Needs</h2>
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

      {/* 5. DEMO PREVIEW */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-12 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Live Preview</p>
              <h2 className="text-4xl font-bold">Watch It Work</h2>
              <p className="text-[#64748b]">Sarah (Team Lead) and Michael (Senior Dev) — workplace dispute, live resolution.</p>
            </div>
          </InViewSection>
          <InViewSection><AnimatedDemoPreview /></InViewSection>
          <InViewSection>
            <div className="text-center mt-8">
              <Link href="/demo" className="inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                Try Full Interactive Demo <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </InViewSection>
        </div>
      </section>

      {/* 6. USE CASES */}
      <section className="py-24 px-6 bg-[#050a14]">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-16 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Use Cases</p>
              <h2 className="text-4xl font-bold">Built for Every Context</h2>
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

      {/* 7. TECH — TACITUS 8-PRIMITIVE GRID */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <InViewSection>
            <div className="text-center mb-16 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-blue-500">Architecture</p>
              <h2 className="text-4xl font-bold">The TACITUS Ontology</h2>
              <p className="text-[#64748b] max-w-2xl mx-auto">A neurosymbolic conflict grammar — 8 primitive types capturing every dimension of human conflict, extracted in real time from natural language.</p>
            </div>
          </InViewSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {PRIMITIVES.map((p) => (
              <InViewSection key={p.name}>
                <motion.div whileHover={{ scale: 1.04 }} className="bg-[#0a0e1a] border border-[#1e293b] rounded-xl p-4 text-center space-y-2 cursor-default transition-all hover:border-opacity-60">
                  <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-xs font-bold font-mono" style={{ backgroundColor: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25` }}>{p.name[0]}</div>
                  <div className="text-sm font-bold" style={{ color: p.color }}>{p.name}</div>
                  <div className="text-[10px] text-[#475569]">{p.desc}</div>
                </motion.div>
              </InViewSection>
            ))}
          </div>
          <InViewSection>
            <div className="bg-[#0a0e1a] border border-[#1e293b] rounded-2xl p-8">
              <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
                {[
                  { label: "Natural Language", sub: "Live audio + transcription", color: "#0ea5e9" },
                  { label: "Gemini Live API", sub: "Real-time multimodal AI", color: "#8b5cf6" },
                  { label: "TACITUS Extraction", sub: "8-primitive ontology", color: "#10b981" },
                  { label: "Mediation Intelligence", sub: "6-framework fusion", color: "#f59e0b" },
                  { label: "Resolution Output", sub: "Structured agreements", color: "#ef4444" },
                ].map((node, i) => (
                  <div key={node.label} className="flex items-center gap-4 md:flex-col md:gap-0">
                    <div>
                      <div className="text-xs font-bold mb-0.5" style={{ color: node.color }}>{node.label}</div>
                      <div className="text-[10px] text-[#334155]">{node.sub}</div>
                    </div>
                    {i < 4 && <ChevronRight className="w-4 h-4 text-[#1e293b] shrink-0 md:rotate-90 md:my-2" />}
                  </div>
                ))}
              </div>
            </div>
          </InViewSection>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-[#0f172a] bg-[#050a14] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-lg">CONCORDIA</span>
                <span className="text-[10px] font-mono text-[#334155] border border-[#1e293b] px-1.5 py-0.5 rounded">by TACITUS ◳</span>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed max-w-xs">Conflict resolution as a science. The TACITUS Institute's AI-native mediation platform — built for professionals, accessible to everyone.</p>
              <div className="flex items-center gap-1.5 text-xs text-[#334155]">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Built with Gemini AI · Google Cloud Run · Next.js 15
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#334155]">Platform</h4>
              {[["Live Workspace","/workspace"],["Interactive Demo","/demo"],["Resolution Library","/library"],["Advisor Chat","/chat"]].map(([l,h]) => (
                <Link key={l} href={h} className="block text-sm text-[#475569] hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#334155]">Frameworks</h4>
              {["Fisher & Ury","Lederach","Glasl","Zartman","Thomas-Kilmann"].map(f => (
                <div key={f} className="text-sm text-[#475569]">{f}</div>
              ))}
            </div>
          </div>
          <div className="border-t border-[#0f172a] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#334155] font-mono">
            <span>CONCORDIA by TACITUS◳ — <a href="https://tacitus.me" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">tacitus.me</a> — <a href="mailto:hello@tacitus.me" className="hover:text-white transition-colors">hello@tacitus.me</a></span>
            <span>© 2026 TACITUS Institute for Conflict Resolution</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
