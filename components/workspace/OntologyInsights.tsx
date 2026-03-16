"use client";

import { useMemo } from "react";
import {
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Link2,
  HelpCircle,
} from "lucide-react";
import type { Actor, Primitive, PrimitiveType } from "@/lib/types";
import type { ConflictKnowledgeGraph } from "@/lib/graph-builder";

// ── Primitive types required for a "complete" picture per actor ──
const REQUIRED_TYPES: PrimitiveType[] = [
  "Claim",
  "Interest",
  "Constraint",
  "Leverage",
  "Commitment",
  "Event",
  "Narrative",
];

// ── Suggested questions for missing primitive types ──
const GAP_QUESTIONS: Record<PrimitiveType, string> = {
  Actor: "Who else is involved or affected by this situation?",
  Claim: "What specifically are you asking for or asserting?",
  Interest: "What matters most to you here, underneath the specific ask?",
  Constraint:
    "Are there any hard limits — financial, legal, or personal — I should know about?",
  Leverage: "What would you do if we don't reach an agreement today?",
  Commitment: "Is there anything you're willing to commit to at this point?",
  Event: "What was the moment when things first shifted between you?",
  Narrative: "How did this start, from your perspective?",
};

interface Props {
  graph: ConflictKnowledgeGraph;
  actors: Actor[];
  primitives: Primitive[];
  partyAName: string;
  partyBName: string;
}

export default function OntologyInsights({
  graph,
  actors,
  primitives,
  partyAName,
  partyBName,
}: Props) {
  const insights = useMemo(() => {
    const partyAId = actors[0]?.id ?? "";
    const partyBId = actors[1]?.id ?? "";

    // Conflict completeness per actor
    const typesByActor = (actorId: string) => {
      const covered = new Set(
        primitives.filter((p) => p.actorId === actorId).map((p) => p.type),
      );
      return {
        covered: REQUIRED_TYPES.filter((t) => covered.has(t)),
        missing: REQUIRED_TYPES.filter((t) => !covered.has(t)),
        score: Math.round(
          (REQUIRED_TYPES.filter((t) => covered.has(t)).length /
            REQUIRED_TYPES.length) *
            100,
        ),
      };
    };

    const partyA = typesByActor(partyAId);
    const partyB = typesByActor(partyBId);
    const overallCompleteness = Math.round((partyA.score + partyB.score) / 2);

    // Resolution readiness: based on completeness + alignment edges + commitments
    const commitmentCount = primitives.filter(
      (p) => p.type === "Commitment",
    ).length;
    const alignmentCount = graph.analytics.alignmentEdges.length;
    const tensionCount = graph.analytics.tensionEdges.length;
    const resolutionReadiness = Math.min(
      100,
      Math.round(
        overallCompleteness * 0.4 +
          Math.min(alignmentCount * 10, 30) +
          Math.min(commitmentCount * 10, 30),
      ),
    );

    // Bridge opportunities
    const bridgeNodes = graph.analytics.bridgingNodes
      .map((id) => graph.nodes.find((n) => n.id === id))
      .filter(Boolean)
      .slice(0, 5);

    // Next best questions
    const nextQuestions: { party: string; type: PrimitiveType; question: string }[] = [];
    for (const type of partyA.missing) {
      nextQuestions.push({
        party: partyAName,
        type,
        question: GAP_QUESTIONS[type] ?? `Ask about ${type}`,
      });
    }
    for (const type of partyB.missing) {
      nextQuestions.push({
        party: partyBName,
        type,
        question: GAP_QUESTIONS[type] ?? `Ask about ${type}`,
      });
    }
    // Prioritize: Interests > Constraints > Narrative > rest
    const typePriority: Record<string, number> = {
      Interest: 0,
      Constraint: 1,
      Narrative: 2,
      Claim: 3,
      Leverage: 4,
      Commitment: 5,
      Event: 6,
    };
    nextQuestions.sort(
      (a, b) => (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99),
    );

    return {
      partyA,
      partyB,
      overallCompleteness,
      resolutionReadiness,
      bridgeNodes,
      nextQuestions: nextQuestions.slice(0, 4),
      tensionCount,
      alignmentCount,
    };
  }, [graph, actors, primitives, partyAName, partyBName]);

  const scoreColor = (score: number) => {
    if (score < 30) return "text-red-400";
    if (score < 60) return "text-amber-400";
    return "text-emerald-400";
  };

  const barColor = (score: number) => {
    if (score < 30) return "bg-red-500";
    if (score < 60) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Conflict Completeness */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-violet-400" />
          <span className="font-semibold text-zinc-200">
            Conflict Completeness
          </span>
          <span
            className={`ml-auto text-lg font-bold ${scoreColor(insights.overallCompleteness)}`}
          >
            {insights.overallCompleteness}%
          </span>
        </div>

        {/* Party A */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>{partyAName}</span>
            <span>{insights.partyA.score}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(insights.partyA.score)}`}
              style={{ width: `${insights.partyA.score}%` }}
            />
          </div>
          {insights.partyA.missing.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {insights.partyA.missing.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-red-900/40 text-red-300 border border-red-800/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Party B */}
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>{partyBName}</span>
            <span>{insights.partyB.score}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor(insights.partyB.score)}`}
              style={{ width: `${insights.partyB.score}%` }}
            />
          </div>
          {insights.partyB.missing.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {insights.partyB.missing.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 text-[10px] rounded bg-red-900/40 text-red-300 border border-red-800/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolution Readiness */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-zinc-200">
            Resolution Readiness
          </span>
          <span
            className={`ml-auto text-lg font-bold ${scoreColor(insights.resolutionReadiness)}`}
          >
            {insights.resolutionReadiness}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor(insights.resolutionReadiness)}`}
            style={{ width: `${insights.resolutionReadiness}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
          <span>
            {insights.tensionCount} tension
            {insights.tensionCount !== 1 ? "s" : ""}
          </span>
          <span>
            {insights.alignmentCount} alignment
            {insights.alignmentCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Bridge Opportunities */}
      {insights.bridgeNodes.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-zinc-200">
              Bridge Opportunities
            </span>
          </div>
          <ul className="space-y-1">
            {insights.bridgeNodes.map((node) => (
              <li
                key={node!.id}
                className="flex items-start gap-2 text-xs text-zinc-300"
              >
                <TrendingUp className="h-3 w-3 mt-0.5 text-amber-400 shrink-0" />
                <span>
                  <span className="text-amber-300 font-medium">
                    {node!.type}:
                  </span>{" "}
                  {node!.description || node!.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Best Questions */}
      {insights.nextQuestions.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-zinc-200">
              Next Best Questions
            </span>
          </div>
          <ul className="space-y-2">
            {insights.nextQuestions.map((q, i) => (
              <li
                key={i}
                className="text-xs rounded bg-zinc-900/50 border border-zinc-700/50 p-2"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Lightbulb className="h-3 w-3 text-blue-400" />
                  <span className="text-zinc-400">
                    Ask {q.party} about{" "}
                    <span className="text-blue-300">{q.type}</span>
                  </span>
                </div>
                <p className="text-zinc-300 italic">&quot;{q.question}&quot;</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary status */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {insights.overallCompleteness >= 70 ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span>
          {insights.overallCompleteness >= 70
            ? "Good ontology coverage — ready for deeper exploration"
            : "More discovery needed — key primitives missing"}
        </span>
      </div>
    </div>
  );
}
