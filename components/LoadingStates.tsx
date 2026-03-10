"use client";
import React from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export function Spinner({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8";
  return <Loader2 className={`${s} animate-spin text-blue-400`} />;
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

export function GraphSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full bg-slate-700/40"
            style={{
              width: `${40 + i * 15}px`,
              height: `${40 + i * 15}px`,
              left: `${10 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
          />
        ))}
      </div>
      <p className="relative z-10 text-xs text-slate-500">Rendering graph…</p>
    </div>
  );
}

export type WsStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export function WsStatusIndicator({ status }: { status: WsStatus }) {
  const cfg: Record<WsStatus, { label: string; color: string; dot: string }> = {
    connecting: {
      label: "Connecting",
      color: "text-amber-400",
      dot: "bg-amber-400 animate-pulse",
    },
    connected: {
      label: "Connected",
      color: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    reconnecting: {
      label: "Reconnecting",
      color: "text-orange-400",
      dot: "bg-orange-400 animate-bounce",
    },
    disconnected: {
      label: "Disconnected",
      color: "text-slate-500",
      dot: "bg-slate-600",
    },
  };
  const { label, color, dot } = cfg[status];
  return (
    <div className={`flex items-center gap-1.5 text-xs ${color}`} role="status" aria-live="polite" aria-label={`WebSocket status: ${label}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
