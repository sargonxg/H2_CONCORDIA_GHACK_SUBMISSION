"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/design-system";

interface WorkspaceLayoutProps {
  topBar: ReactNode;
  statusBar?: ReactNode;
  banners?: ReactNode;
  leftRail: ReactNode;
  center: ReactNode;
  rightRail?: ReactNode;
  bottomBar?: ReactNode;
  modals?: ReactNode;
  mobilePanel: "left" | "center" | "right";
  onMobilePanelChange: (panel: "left" | "center" | "right") => void;
}

export default function WorkspaceLayout({
  topBar,
  statusBar,
  banners,
  leftRail,
  center,
  rightRail,
  bottomBar,
  modals,
  mobilePanel,
  onMobilePanelChange,
}: WorkspaceLayoutProps) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg)]">
      {topBar}
      {statusBar}
      {banners}

      {/* Mobile panel tabs */}
      <div className="flex lg:hidden shrink-0 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 gap-1 py-2">
        {([
          { id: "left" as const, label: "Profiles" },
          { id: "center" as const, label: "Workspace" },
          { id: "right" as const, label: "Tools" },
        ]).map((p) => (
          <button
            key={p.id}
            onClick={() => onMobilePanelChange(p.id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              mobilePanel === p.id
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-muted)] hover:text-white bg-[var(--color-bg)] border border-[var(--color-border)]"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Desktop: three-column layout */}
      <div className="flex-1 overflow-hidden hidden lg:flex">
        {/* LEFT RAIL */}
        <div className="w-[280px] min-w-[200px] max-w-[360px] border-r border-[var(--color-border)] overflow-y-auto p-4 pr-2 shrink-0">
          {leftRail}
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 min-w-0">
          {center}
        </div>

        {/* RIGHT RAIL */}
        {rightRail && (
          <div className="w-[320px] min-w-[240px] max-w-[420px] border-l border-[var(--color-border)] overflow-y-auto p-4 pl-2 shrink-0">
            {rightRail}
          </div>
        )}
      </div>

      {/* Mobile: show one panel at a time */}
      <div className="flex-1 overflow-hidden flex lg:hidden">
        <div className={cn("flex-1 flex flex-col overflow-hidden p-4", mobilePanel !== "left" && "hidden")}>
          {leftRail}
        </div>
        <div className={cn("flex-1 flex flex-col overflow-hidden p-4", mobilePanel !== "center" && "hidden")}>
          {center}
        </div>
        <div className={cn("flex-1 flex flex-col overflow-hidden p-4", mobilePanel !== "right" && "hidden")}>
          {rightRail}
        </div>
      </div>

      {bottomBar}
      {modals}
    </div>
  );
}
