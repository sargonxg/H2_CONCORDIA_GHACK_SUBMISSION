"use client";

import React from "react";

// ---------------------------------------------------------------------------
// LoadingSpinner — animated ring spinner in accent blue
// ---------------------------------------------------------------------------

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SpinnerSize, { outer: string; ring: string }> = {
  sm: { outer: "h-4 w-4",  ring: "border-2" },
  md: { outer: "h-6 w-6",  ring: "border-2" },
  lg: { outer: "h-10 w-10", ring: "border-[3px]" },
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  /** Accessible label — defaults to "Loading" */
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label = "Loading",
  className = "",
}: LoadingSpinnerProps) {
  const { outer, ring } = SIZE_CLASSES[size];

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block shrink-0 ${outer} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`block h-full w-full animate-spin rounded-full ${ring} border-[#3b82f6]/20 border-t-[#3b82f6]`}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// SkeletonLine — animated pulse placeholder for a single line of text
// ---------------------------------------------------------------------------

interface SkeletonLineProps {
  /** Tailwind width class, e.g. "w-3/4". Defaults to "w-full". */
  width?: string;
  /** Tailwind height class, e.g. "h-3". Defaults to "h-3". */
  height?: string;
  className?: string;
}

export function SkeletonLine({
  width = "w-full",
  height = "h-3",
  className = "",
}: SkeletonLineProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-full bg-[#262626] ${width} ${height} ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonBlock — animated pulse placeholder for block-level content
// ---------------------------------------------------------------------------

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-[#262626] ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// WSStatusIndicator — WebSocket connection status badge
// ---------------------------------------------------------------------------

export type WSStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface WSStatusConfig {
  label: string;
  dotClass: string;
  textClass: string;
}

const WS_STATUS_CONFIG: Record<WSStatus, WSStatusConfig> = {
  connecting: {
    label:     "Connecting",
    dotClass:  "bg-amber-400 animate-pulse",
    textClass: "text-amber-400",
  },
  connected: {
    label:     "Connected",
    dotClass:  "bg-emerald-400",
    textClass: "text-emerald-400",
  },
  reconnecting: {
    label:     "Reconnecting",
    dotClass:  "bg-amber-400 animate-pulse",
    textClass: "text-amber-400",
  },
  disconnected: {
    label:     "Disconnected",
    dotClass:  "bg-red-500",
    textClass: "text-red-400",
  },
};

interface WSStatusIndicatorProps {
  status: WSStatus;
  className?: string;
}

export function WSStatusIndicator({
  status,
  className = "",
}: WSStatusIndicatorProps) {
  const { label, dotClass, textClass } = WS_STATUS_CONFIG[status];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`WebSocket status: ${label}`}
      className={`flex items-center gap-1.5 text-xs font-medium ${textClass} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`}
      />
      {label}
    </div>
  );
}

export default LoadingSpinner;
