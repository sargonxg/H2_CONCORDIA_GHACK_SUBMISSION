"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { MessageSquare, Send, User, ShieldAlert, Database, Zap } from "lucide-react";
import { chatWithAdvisor } from "@/services/gemini-client";
import Markdown from "react-markdown";
import type { Case } from "@/lib/types";

// ── Quick-action prompts ──
const QUICK_ACTIONS = [
  { label: "What to ask next?", icon: "🎯", prompt: "Based on the current case structure and transcript, what is the single most important question to ask next in the mediation, and why? Be specific." },
  { label: "Power dynamics", icon: "⚖️", prompt: "Analyze the power dynamics in this case using the CONCORDIA framework. Who has stronger BATNA? What leverage does each party hold? Identify any power imbalances affecting the process." },
  { label: "De-escalation", icon: "🌊", prompt: "What de-escalation techniques would you recommend for this case right now? Identify any escalation signals in the transcript and suggest specific Ury or Glasl interventions." },
  { label: "Find common ground", icon: "🤝", prompt: "Identify all potential areas of common ground between the parties using principled negotiation (Fisher & Ury). What shared interests, values, or goals could form the basis of an agreement?" },
  { label: "Draft terms", icon: "📋", prompt: "Based on the case structure and transcript, draft potential agreement terms. What commitments could each party realistically make? What would a fair resolution look like in concrete terms?" },
];

function buildCaseContext(activeCase: Case | null): string | undefined {
  if (!activeCase) return undefined;
  const lines: string[] = [
    `Case: ${activeCase.title}`,
    `Parties: ${activeCase.partyAName} vs ${activeCase.partyBName}`,
    "",
    "ACTORS:",
    ...activeCase.actors.map((a) => `  - ${a.name} (${a.role})`),
    "",
    `PRIMITIVES (${activeCase.primitives.length} total):`,
    ...activeCase.primitives.map((p) => {
      const actor = activeCase.actors.find((a) => a.id === p.actorId);
      return `  [${p.type}] ${actor?.name ?? "Unknown"}: ${p.description}`;
    }),
    "",
    "TRANSCRIPT (last 2000 chars):",
    activeCase.transcript.slice(-2000) || "(no transcript yet)",
  ];
  return lines.join("\n");
}

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "model",
      text: "Hello. I am the CONCORDIA Strategic Advisor. I have access to your active case structure and transcript. Ask me anything about the conflict, or use a quick action below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load most-recently-updated case from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("concordia_cases");
      if (saved) {
        const cases: Case[] = JSON.parse(saved);
        if (cases.length > 0) {
          const sorted = [...cases].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
          setActiveCase(sorted[0]);
        }
      }
    } catch (_) {}
  }, []);

  const handleSend = async (messageOverride?: string) => {
    const userMessage = messageOverride ?? input;
    if (!userMessage.trim()) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const caseContext = buildCaseContext(activeCase);
      const response = await chatWithAdvisor(
        userMessage,
        messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        caseContext,
      );
      setMessages((prev) => [...prev, { role: "model", text: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Error: Could not reach the Advisor Agent. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <header className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[var(--color-accent)]" />
              Strategic Advisor
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              AI-powered analysis using Fisher &amp; Ury, Lederach, Glasl, Zartman, and TACITUS frameworks.
            </p>
          </div>
          {/* Active case indicator */}
          {activeCase ? (
            <div className="flex items-center gap-2 text-[11px] bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg shrink-0">
              <Database className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span className="text-[var(--color-text-muted)]">Case:</span>
              <span className="text-white font-medium truncate max-w-[140px]">{activeCase.title}</span>
              <span className="text-[var(--color-text-muted)]">· {activeCase.primitives.length} primitives</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              Open a case in Workspace for case-aware analysis
            </div>
          )}
        </div>

        {/* ── Quick-action buttons ── */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex gap-4 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-[var(--color-surface-hover)]" : "bg-[var(--color-accent)]"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-white" />
              )}
            </div>

            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--color-surface)] border border-[var(--color-border)] text-white"
                  : "bg-transparent text-[var(--color-text)]"
              }`}
            >
              {msg.role === "user" ? (
                msg.text
              ) : (
                <div className="markdown-body prose prose-invert max-w-none prose-sm">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div className="p-4 rounded-2xl text-sm text-[var(--color-text-muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-100" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-200" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask the Strategic Advisor..."
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl pl-4 pr-12 py-4 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
