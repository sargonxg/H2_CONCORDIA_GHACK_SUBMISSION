"use client";

import { useState } from "react";
import { cn } from "@/lib/design-system";

type ConnectionState = "connected" | "reconnecting" | "disconnected" | "error";

interface ConnectionStatusProps {
  status: ConnectionState;
}

const STATUS_CONFIG: Record<ConnectionState, { color: string; label: string; pulseClass?: string }> = {
  connected: { color: "bg-emerald-500", label: "Connected", pulseClass: "animate-pulse" },
  reconnecting: { color: "bg-yellow-500", label: "Reconnecting", pulseClass: "animate-pulse" },
  disconnected: { color: "bg-gray-500", label: "Disconnected" },
  error: { color: "bg-red-500", label: "Error" },
};

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const [showLabel, setShowLabel] = useState(false);
  const config = STATUS_CONFIG[status];

  return (
    <div
      className="relative flex items-center gap-1.5 cursor-default"
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
    >
      <span
        className={cn(
          "w-2 h-2 rounded-full transition-colors",
          config.color,
          config.pulseClass,
        )}
      />
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] transition-opacity",
          showLabel ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
        )}
      >
        {config.label}
      </span>
    </div>
  );
}
