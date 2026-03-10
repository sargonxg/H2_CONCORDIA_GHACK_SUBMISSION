"use client";

import { motion } from "motion/react";
import {
  Info,
  Database,
  Mic,
  MessageSquare,
  ArrowRight,
  Brain,
  Target,
  Shield,
  Users,
  Activity,
  Heart,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Info className="w-8 h-8 text-[var(--color-accent)]" />
            How Concordia Works
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
            Concordia combines real-time audio conversation with structured
            conflict analysis. Two parties speak naturally while the system
            builds a live understanding of their case, tracks psychological
            indicators, and guides them toward resolution.
          </p>
        </header>

        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-white">The Session Flow</h2>

          <div className="space-y-4">
            {[
              {
                phase: "Opening",
                icon: Shield,
                color: "text-sky-400 border-sky-500/20 bg-sky-500/5",
                desc: "Concordia welcomes both parties, establishes ground rules (mutual respect, confidentiality, one speaker at a time), and creates a safe space for dialogue.",
              },
              {
                phase: "Discovery",
                icon: Mic,
                color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                desc: "Each party shares their perspective individually. Concordia asks targeted questions to understand what happened, how it felt, what each party needs, and what they've already tried.",
              },
              {
                phase: "Exploration",
                icon: Brain,
                color: "text-violet-400 border-violet-500/20 bg-violet-500/5",
                desc: "The system cross-references both perspectives, identifies shared vs. disputed facts, uncovers overlapping interests, and detects emotional patterns and power dynamics.",
              },
              {
                phase: "Negotiation",
                icon: Users,
                color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
                desc: "Concordia guides parties to brainstorm options together. 'What would it look like if...?' questions help explore flexibility without forcing commitment.",
              },
              {
                phase: "Resolution",
                icon: Target,
                color: "text-orange-400 border-orange-500/20 bg-orange-500/5",
                desc: "Viable pathways are narrowed down. The system tests potential agreements: 'If X happened, would that address your concern about Y?' Building specific, actionable terms.",
              },
              {
                phase: "Agreement",
                icon: TrendingUp,
                color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                desc: "Concordia summarizes agreements, confirms with both parties, identifies remaining concerns, and outlines next steps for implementation.",
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={step.phase}
                  className={`border rounded-xl p-5 flex items-start gap-4 ${step.color}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1">
                      {idx + 1}. {step.phase}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6 border-t border-[var(--color-border)] pt-12">
          <h2 className="text-2xl font-semibold text-white">
            Real-Time Intelligence
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-3">
              <Heart className="w-6 h-6 text-rose-400" />
              <h3 className="text-lg font-semibold text-white">
                Psychological Indicators
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                As parties speak, Concordia tracks emotional state (calm,
                anxious, defensive, hopeful), engagement level,
                cooperativeness, defensiveness, communication style, underlying
                needs, and risk factors — all updated in real time.
              </p>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-3">
              <Database className="w-6 h-6 text-sky-400" />
              <h3 className="text-lg font-semibold text-white">
                Case Structure (TACITUS Ontology)
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                The conversation is parsed into structured primitives: Claims,
                Interests, Constraints, Leverage, Commitments, and Events. Each
                is mapped to the relevant party, building a ground-truth graph
                that prevents hallucination.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] pt-12">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Agent Architecture
          </h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 font-mono text-sm text-[var(--color-text-muted)] space-y-4">
            <p className="text-white font-semibold text-base font-sans">
              Multi-Agent System:
            </p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              <li>
                <span className="text-sky-400">Listener Agent</span>{" "}
                (Live Audio) — Real-time voice I/O, conversational flow,
                tool-calling to update workspace UI
              </li>
              <li>
                <span className="text-violet-400">Profiler Agent</span>{" "}
                — Continuous psychological assessment of both parties
                (emotional state, needs, risks)
              </li>
              <li>
                <span className="text-amber-400">Extraction Agent</span>{" "}
                — Parses transcripts into structured JSON primitives using
                TACITUS ontology
              </li>
              <li>
                <span className="text-emerald-400">Advisor Agent</span>{" "}
                — Analyzes the case graph to generate pathways, critical
                questions, and common ground
              </li>
            </ul>
          </div>
        </section>

        <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Ready to try it?
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Create a case and start a live mediation session.
            </p>
          </div>
          <Link
            href="/workspace"
            className="flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors"
          >
            Go to Workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
