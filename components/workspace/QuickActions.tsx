"use client";

import { Database, TrendingUp, Download, Users, BookOpen, Activity } from "lucide-react";
import { cn } from "@/lib/design-system";

interface QuickActionsProps {
  onExtractPrimitives: () => void;
  onAnalyzePathways: () => void;
  onExport: () => void;
  onToggleCaucus?: () => void;
  onGenerateSummary?: () => void;
  isExtracting?: boolean;
  isAnalyzing?: boolean;
  hasTranscript?: boolean;
  isRecording?: boolean;
  caucusActive?: boolean;
}

export default function QuickActions({
  onExtractPrimitives,
  onAnalyzePathways,
  onExport,
  onToggleCaucus,
  onGenerateSummary,
  isExtracting,
  isAnalyzing,
  hasTranscript,
  isRecording,
  caucusActive,
}: QuickActionsProps) {
  const actions = [
    {
      label: "Extract",
      icon: Database,
      onClick: onExtractPrimitives,
      disabled: !hasTranscript || isExtracting || isRecording,
      loading: isExtracting,
      color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10",
    },
    {
      label: "Analyze",
      icon: TrendingUp,
      onClick: onAnalyzePathways,
      disabled: !hasTranscript || isAnalyzing,
      loading: isAnalyzing,
      color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10",
    },
    ...(onGenerateSummary ? [{
      label: "Summary",
      icon: BookOpen,
      onClick: onGenerateSummary,
      disabled: !hasTranscript,
      color: "text-violet-400 border-violet-500/30 hover:bg-violet-500/10",
    }] : []),
    {
      label: "Export",
      icon: Download,
      onClick: onExport,
      disabled: !hasTranscript,
      color: "text-amber-400 border-amber-500/30 hover:bg-amber-500/10",
    },
    ...(onToggleCaucus ? [{
      label: caucusActive ? "Joint" : "Caucus",
      icon: Users,
      onClick: onToggleCaucus,
      disabled: !isRecording,
      active: caucusActive,
      color: caucusActive
        ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
        : "text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10",
    }] : []),
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
              action.color,
            )}
          >
            {(action as any).loading ? (
              <Activity className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Icon className="w-3.5 h-3.5" />
            )}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
