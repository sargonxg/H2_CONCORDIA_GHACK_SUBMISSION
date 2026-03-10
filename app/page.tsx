"use client";

import { motion } from "motion/react";
import {
  Shield,
  Activity,
  Users,
  BookOpen,
  Brain,
  Target,
  Mic,
  TrendingUp,
  Heart,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function Overview() {
  return (
    <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--color-accent)]" />
            CONCORDIA
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono uppercase tracking-wider">
            by TACITUS
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { path: "/", icon: Shield, label: "Overview" },
            { path: "/workspace", icon: Activity, label: "Live Workspace" },
            { path: "/library", icon: BookOpen, label: "Resolution Library" },
            { path: "/how-it-works", icon: Brain, label: "How It Works" },
            { path: "/chat", icon: Activity, label: "Advisor Chat" },
            { path: "/transcribe", icon: Mic, label: "Transcription" },
            { path: "/tts", icon: Activity, label: "Speech Engine" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/";
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-surface-hover)] text-white font-medium"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[var(--color-accent)]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)] font-mono">
          <div className="flex justify-between items-center mb-2">
            <span>SYSTEM STATUS</span>
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ONLINE
            </span>
          </div>
          <div>CONCORDIA Mediation Engine v2.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto p-8 lg:p-12"
        >
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Hero Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 text-[var(--color-accent)]">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-mono uppercase tracking-widest">
                  TACITUS Institute
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                AI-Powered
                <br />
                <span className="bg-gradient-to-r from-[var(--color-accent)] to-violet-500 bg-clip-text text-transparent">
                  Live Mediation
                </span>
              </h1>
              <p className="text-xl text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
                Two parties. One conversation. Concordia listens, structures the
                conflict in real time, tracks psychological indicators, identifies
                common ground, and guides both sides toward resolution.
              </p>
              <div className="flex gap-4 pt-4">
                <Link
                  href="/workspace"
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-[var(--color-accent)]/25 hover:shadow-xl hover:shadow-[var(--color-accent)]/35 flex items-center gap-3"
                >
                  <Mic className="w-6 h-6" />
                  Start Mediation
                </Link>
                <Link
                  href="/how-it-works"
                  className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-3"
                >
                  <BookOpen className="w-6 h-6" />
                  How It Works
                </Link>
              </div>
            </section>

            {/* Live Session Visual */}
            <section className="relative">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-violet-500/5" />
                <div className="relative grid grid-cols-3 gap-8 items-center">
                  <div className="bg-[var(--color-bg)] border border-sky-500/30 rounded-xl p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mx-auto">
                      <span className="text-sky-400 font-bold text-lg">A</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Party A</h3>
                    <div className="space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                      <p>Emotional State</p>
                      <p>Communication Style</p>
                      <p>Key Needs & Risks</p>
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)]/40 flex items-center justify-center mx-auto shadow-lg shadow-[var(--color-accent)]/10">
                      <Brain className="w-10 h-10 text-[var(--color-accent)]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">CONCORDIA</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Guides conversation, tracks indicators, finds common ground
                    </p>
                    <div className="flex justify-center gap-2">
                      <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Listening</span>
                      <span className="text-[9px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Structuring</span>
                      <span className="text-[9px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">Resolving</span>
                    </div>
                  </div>
                  <div className="bg-[var(--color-bg)] border border-violet-500/30 rounded-xl p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto">
                      <span className="text-violet-400 font-bold text-lg">B</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Party B</h3>
                    <div className="space-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                      <p>Emotional State</p>
                      <p>Communication Style</p>
                      <p>Key Needs & Risks</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Summary */}
            <section className="space-y-8 border-t border-[var(--color-border)] pt-12">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-[var(--color-accent)]" />
                What Happens in a Session
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Mic, title: "Live Audio", desc: "Both parties speak naturally. The AI mediator guides the conversation turn by turn.", color: "text-sky-400" },
                  { icon: Brain, title: "Psychological Profiling", desc: "Real-time tracking of emotional states, defensiveness, cooperativeness, and underlying needs.", color: "text-violet-400" },
                  { icon: Target, title: "Case Structuring", desc: "Claims, interests, constraints, and leverage are extracted and mapped to each party.", color: "text-amber-400" },
                  { icon: TrendingUp, title: "Resolution Pathways", desc: "Common ground is identified, critical questions generated, and concrete pathways proposed.", color: "text-emerald-400" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-3 hover:border-[var(--color-accent)]/30 transition-colors"
                    >
                      <Icon className={`w-6 h-6 ${item.color}`} />
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Who It's For */}
            <section className="space-y-8 border-t border-[var(--color-border)] pt-12">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-[var(--color-accent)]" />
                Who Uses Concordia
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Professional Mediators", items: ["Real-time case structuring", "Psychological indicator tracking", "Automated resolution drafting"] },
                  { title: "HR & Employee Relations", items: ["Workplace dispute resolution", "Neutral, objective facilitation", "Structured outcome pathways"] },
                  { title: "Individuals & Couples", items: ["Guided self-mediation", "De-escalation assistance", "Finding common ground"] },
                ].map((group) => (
                  <div key={group.title} className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
                    <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
                    <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 mt-0.5 text-[var(--color-accent)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
