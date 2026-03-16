"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Keyboard } from "lucide-react";

interface Props {
  partyAName: string;
  partyBName: string;
  onSendMessage: (text: string, asParty: string) => void;
  disabled?: boolean;
}

export default function TextInput({ partyAName, partyBName, onSendMessage, disabled }: Props) {
  const [text, setText] = useState("");
  const [selectedParty, setSelectedParty] = useState(partyAName);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed, selectedParty);
    setText("");
    inputRef.current?.focus();
  }, [text, disabled, selectedParty, onSendMessage]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors"
      >
        <Keyboard className="w-3 h-3" />
        Type instead of speaking
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
      {/* Party selector toggle */}
      <div className="flex rounded-md overflow-hidden border border-[var(--color-border)] shrink-0">
        {[
          { name: partyAName, color: "#4ECDC4" },
          { name: partyBName, color: "#A78BFA" },
        ].map(({ name, color }) => (
          <button
            key={name}
            onClick={() => setSelectedParty(name)}
            className="px-2.5 py-1 text-[10px] font-semibold transition-colors"
            style={{
              backgroundColor: selectedParty === name ? color + "20" : "transparent",
              color: selectedParty === name ? color : "var(--color-text-muted)",
              borderRight: name === partyAName ? "1px solid var(--color-border)" : "none",
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
        placeholder={`Type as ${selectedParty}...`}
        disabled={disabled}
        className="flex-1 min-w-0 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        autoFocus
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="p-1.5 rounded-md bg-[var(--color-accent)] text-white disabled:opacity-25 hover:bg-[var(--color-accent-hover)] transition-colors shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
