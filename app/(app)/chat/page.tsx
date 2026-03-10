"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { MessageSquare, Send, User, ShieldAlert } from "lucide-react";
import { chatWithAdvisor } from "@/services/gemini-client";
import Markdown from "react-markdown";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "model",
      text: "Hello. I am the CONCORDIA Advisor Agent. How can I assist you in analyzing or resolving a conflict today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithAdvisor(
        userMessage,
        messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      );
      setMessages((prev) => [...prev, { role: "model", text: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Error: Could not reach the Advisor Agent. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <header className="p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[var(--color-accent)]" />
          Advisor Chat
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Synthesize conflict primitives into actionable talking points and
          resolution pathways.
        </p>
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
                msg.role === "user"
                  ? "bg-[var(--color-surface-hover)]"
                  : "bg-[var(--color-accent)]"
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
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-200"></span>
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
            placeholder="Ask the Advisor Agent..."
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl pl-4 pr-12 py-4 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
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
