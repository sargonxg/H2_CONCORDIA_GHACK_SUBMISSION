"use client";

import { motion } from "motion/react";
import { BookOpen, Scale, HeartHandshake, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ResolutionLibrary() {
  const frameworks = [
    {
      title: "Principled Negotiation (Harvard Method)",
      icon: Scale,
      description: "Focuses on interests rather than positions. Separates the people from the problem and invents options for mutual gain.",
      keyConcepts: ["BATNA", "Objective Criteria", "Mutual Gain"],
      bestFor: "Commercial disputes, contract negotiations, clear resource allocation."
    },
    {
      title: "Transformative Mediation",
      icon: HeartHandshake,
      description: "Focuses on empowering the parties and fostering recognition of each other's perspectives, rather than just settling the dispute.",
      keyConcepts: ["Empowerment", "Recognition", "Relationship Building"],
      bestFor: "Workplace conflicts, family disputes, long-term relationships."
    },
    {
      title: "Narrative Mediation",
      icon: FileText,
      description: "Deconstructs the conflict-saturated stories parties tell about themselves and each other, helping them author new, collaborative narratives.",
      keyConcepts: ["Externalizing the Problem", "Alternative Storylines", "Deconstruction"],
      bestFor: "Deeply entrenched identity conflicts, community disputes."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--color-accent)]" />
            Resolution Library
          </h1>
          <p className="text-lg text-[var(--color-text-muted)]">
            Concordia's AI agents draw upon these established conflict resolution frameworks to guide parties toward common ground.
          </p>
        </header>

        <div className="space-y-6">
          {frameworks.map((fw, idx) => {
            const Icon = fw.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={fw.title}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{fw.title}</h2>
                      <p className="text-[var(--color-text-muted)] mt-1 leading-relaxed">{fw.description}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Key Concepts</h3>
                        <div className="flex flex-wrap gap-2">
                          {fw.keyConcepts.map(concept => (
                            <span key={concept} className="text-xs font-mono bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-white">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Best For</h3>
                        <p className="text-sm text-white">{fw.bestFor}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Want to apply these frameworks?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Start a live mediation session and select your preferred approach.</p>
          </div>
          <Link href="/workspace" className="flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-medium transition-colors">
            Go to Workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
