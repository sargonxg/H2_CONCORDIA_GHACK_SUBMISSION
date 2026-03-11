"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Tag,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { FRAMEWORKS } from "@/lib/mediation-library";
import type { FrameworkEntry } from "@/lib/mediation-library";

const CATEGORY_LABELS: Record<FrameworkEntry["category"], string> = {
  negotiation: "Negotiation",
  mediation: "Mediation",
  transformation: "Transformation",
  analysis: "Analysis",
  escalation: "Escalation",
  psychology: "Psychology",
};

const CATEGORY_COLORS: Record<FrameworkEntry["category"], string> = {
  negotiation: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  mediation: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  transformation: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  analysis: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  escalation: "text-red-400 bg-red-500/10 border-red-500/30",
  psychology: "text-pink-400 bg-pink-500/10 border-pink-500/30",
};

const PRIMITIVE_COLORS: Record<string, string> = {
  Actor: "text-sky-300 bg-sky-500/10",
  Claim: "text-violet-300 bg-violet-500/10",
  Interest: "text-emerald-300 bg-emerald-500/10",
  Constraint: "text-red-300 bg-red-500/10",
  Leverage: "text-amber-300 bg-amber-500/10",
  Commitment: "text-orange-300 bg-orange-500/10",
  Event: "text-cyan-300 bg-cyan-500/10",
  Narrative: "text-pink-300 bg-pink-500/10",
};

function FrameworkCard({ fw }: { fw: FrameworkEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [showTechniques, setShowTechniques] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const catColor = CATEGORY_COLORS[fw.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-accent)]/40 transition-colors"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${catColor}`}>
              {CATEGORY_LABELS[fw.category]}
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{fw.year}</span>
          </div>
          <h2 className="text-base font-semibold text-white leading-tight">{fw.name}</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {fw.authors.join(", ")} · <em>{fw.seminalWork.split("(")[0].trim()}</em>
          </p>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </div>
      </button>

      {/* TACITUS primitives row */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {fw.tacitusPrimitives.map((p) => (
          <span
            key={p}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${PRIMITIVE_COLORS[p] || "text-gray-400 bg-gray-500/10"}`}
          >
            {p}
          </span>
        ))}
        <span className="text-[10px] text-[var(--color-text-muted)] px-1.5 py-0.5 ml-auto">
          Glasl {fw.glaslStages}
        </span>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--color-border)]"
          >
            <div className="p-5 space-y-5">
              {/* Core principles */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Core Principles
                </h3>
                <ul className="space-y-1.5">
                  {fw.corePrinciples.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-accent)] mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key techniques (expandable) */}
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTechniques((v) => !v); }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-white transition-colors mb-2"
                >
                  {showTechniques ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Key Techniques ({fw.keyTechniques.length})
                </button>
                <AnimatePresence>
                  {showTechniques && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2"
                    >
                      {fw.keyTechniques.map((t) => (
                        <div
                          key={t.name}
                          className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3"
                        >
                          <p className="text-xs font-semibold text-[var(--color-accent)] mb-0.5">{t.name}</p>
                          <p className="text-xs text-white leading-relaxed">{t.description}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 italic">
                            When: {t.whenToUse}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Diagnostic questions (expandable) */}
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowQuestions((v) => !v); }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-white transition-colors mb-2"
                >
                  {showQuestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Diagnostic Questions ({fw.diagnosticQuestions.length})
                </button>
                <AnimatePresence>
                  {showQuestions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1.5"
                    >
                      {fw.diagnosticQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          {q}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Best for / Limitations */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Best For</h3>
                  <ul className="space-y-1">
                    {fw.bestFor.map((b, i) => (
                      <li key={i} className="text-xs text-white flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5 shrink-0">▪</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">Limitations</h3>
                  <ul className="space-y-1">
                    {fw.limitations.map((l, i) => (
                      <li key={i} className="text-xs text-white flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />{l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Best-for tags */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]">
                <Link
                  href={`/workspace?framework=${fw.id}`}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
                >
                  Apply to Current Case <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const CATEGORIES: Array<FrameworkEntry["category"] | "all"> = [
  "all",
  "negotiation",
  "mediation",
  "transformation",
  "analysis",
  "escalation",
  "psychology",
];

export default function ResolutionLibrary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    FrameworkEntry["category"] | "all"
  >("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FRAMEWORKS.filter((fw) => {
      const matchCategory =
        activeCategory === "all" || fw.category === activeCategory;
      if (!matchCategory) return false;
      if (!q) return true;
      return (
        fw.name.toLowerCase().includes(q) ||
        fw.shortName.toLowerCase().includes(q) ||
        fw.authors.some((a) => a.toLowerCase().includes(q)) ||
        fw.corePrinciples.some((p) => p.toLowerCase().includes(q)) ||
        fw.tacitusPrimitives.some((p) => p.toLowerCase().includes(q)) ||
        fw.keyTechniques.some((t) => t.name.toLowerCase().includes(q))
      );
    });
  }, [search, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FRAMEWORKS.length };
    for (const fw of FRAMEWORKS) {
      counts[fw.category] = (counts[fw.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[var(--color-accent)]" />
            Resolution Library
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {FRAMEWORKS.length} conflict resolution frameworks and technique collections — the theoretical foundation
            of CONCORDIA&apos;s AI mediator and advisor.
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, author, concept, technique…"
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activeCategory === cat
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-white hover:border-[var(--color-accent)]/30"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
              <span className={`font-mono ${activeCategory === cat ? "text-white/70" : "text-[var(--color-text-muted)]"}`}>
                {categoryCounts[cat] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        {search && (
          <p className="text-xs text-[var(--color-text-muted)]">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}

        {/* Framework cards */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((fw) => <FrameworkCard key={fw.id} fw={fw} />)
          ) : (
            <div className="text-center py-16 text-[var(--color-text-muted)]">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No frameworks match your search</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("all"); }}
                className="text-xs text-[var(--color-accent)] mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Apply a framework in your session</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Open a case in the workspace, then click &ldquo;Apply to Current Case&rdquo; on any framework above.
            </p>
          </div>
          <Link
            href="/workspace"
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Go to Workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bibliography */}
        <div className="border-t border-[var(--color-border)] pt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Seminal Works
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {FRAMEWORKS.map((fw) => (
              <div key={fw.id} className="flex items-start gap-2 py-1 border-b border-[var(--color-border)]/50">
                <div className="shrink-0 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[fw.category].split(" ")[2].replace("border-", "bg-")}`} />
                </div>
                <div>
                  <p className="text-xs text-white leading-snug">{fw.seminalWork}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{fw.authors.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
