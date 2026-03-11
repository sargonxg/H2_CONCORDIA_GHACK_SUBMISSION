"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { MessageSquare, Send, User, ShieldAlert, Database, Zap } from "lucide-react";
import { chatWithAdvisor } from "@/services/gemini-client";
import Markdown from "react-markdown";
import type { Case } from "@/lib/types";

// ── Quick-action prompts ──
const QUICK_ACTIONS = [
  { label: "Brief Me", prompt: "Give me a full briefing on the current state of this case." },
  { label: "What's Missing?", prompt: "What information gaps exist in our case structure? What should I ask next?" },
  { label: "Suggest Questions", prompt: "Generate 5 targeted questions I should ask, based on what's missing from the ontology." },
  { label: "Escalation Risk", prompt: "Assess the current escalation dynamics. What are the risk factors?" },
  { label: "Draft Agreement", prompt: "Based on the common ground and agreements so far, draft preliminary agreement language." },
  { label: "Compare Frameworks", prompt: "Which conflict resolution framework best fits this case and why? Compare top 3." },
];

function safeJsonParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}

function safeLocalStorageSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

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

const INITIAL_MESSAGE = { role: "model", text: "Hello. I am the CONCORDIA Strategic Advisor. I have access to your active case structure and transcript. Ask me anything about the conflict, or use a quick action below." };

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeCaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load most-recently-updated case from localStorage + restore chat history
  useEffect(() => {
    try {
      const saved = localStorage.getItem("concordia_cases");
      if (saved) {
        const cases: Case[] = JSON.parse(saved);
        if (cases.length > 0) {
          const sorted = [...cases].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
          const c = sorted[0];
          setActiveCase(c);
          activeCaseIdRef.current = c.id;
          // Restore per-case chat history
          const chatKey = `concordia_chat_${c.id}`;
          const savedChat = safeJsonParse<{ role: string; text: string }[]>(
            localStorage.getItem(chatKey), []
          );
          if (savedChat.length > 0) {
            setMessages([INITIAL_MESSAGE, ...savedChat]);
          }
        }
      }
    } catch (_) {}
  }, []);

  const saveHistory = useCallback((msgs: { role: string; text: string }[]) => {
    if (!activeCaseIdRef.current) return;
    const chatKey = `concordia_chat_${activeCaseIdRef.current}`;
    // Save all messages except the initial system greeting
    safeLocalStorageSet(chatKey, msgs.slice(1));
  }, []);

  const handleSend = async (messageOverride?: string) => {
    const userMessage = messageOverride ?? input;
    if (!userMessage.trim()) return;

    setInput("");
    const newUserMsg = { role: "user", text: userMessage };
    const updatedWithUser = [...messages, newUserMsg];
    setMessages(updatedWithUser);
    setIsLoading(true);

    try {
      const caseContext = buildCaseContext(activeCase);
      const response = await chatWithAdvisor(
        userMessage,
        messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        caseContext,
      );
      const newModelMsg = { role: "model", text: response };
      const final = [...updatedWithUser, newModelMsg];
      setMessages(final);
      saveHistory(final);
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
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
