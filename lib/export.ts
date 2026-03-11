import type { Case, CaseSummary, PathwaysResult } from "./types";

export function exportAsMarkdown(
  caseData: Case,
  pathways?: PathwaysResult,
  summaryData?: CaseSummary,
): string {
  const lines: string[] = [];
  lines.push(`# Mediation Case: ${caseData.title}`);
  lines.push(`Date: ${new Date(caseData.updatedAt).toLocaleDateString()}`);
  lines.push(`Parties: ${caseData.partyAName} vs ${caseData.partyBName}\n`);

  if (summaryData) {
    lines.push(`## Executive Summary\n${summaryData.sessionOverview}\n`);
    lines.push(`## Key Claims\n### ${caseData.partyAName}`);
    summaryData.keyClaimsPartyA.forEach((c) => lines.push(`- ${c}`));
    lines.push(`### ${caseData.partyBName}`);
    summaryData.keyClaimsPartyB.forEach((c) => lines.push(`- ${c}`));
    if (summaryData.areasOfAgreement.length) {
      lines.push(`\n## Areas of Agreement`);
      summaryData.areasOfAgreement.forEach((a) => lines.push(`- ${a}`));
    }
    if (summaryData.recommendedNextSteps.length) {
      lines.push(`\n## Recommended Next Steps`);
      summaryData.recommendedNextSteps.forEach((s, i) =>
        lines.push(`${i + 1}. ${s}`),
      );
    }
  }

  lines.push(
    `\n## Full Transcript\n\`\`\`\n${caseData.transcript}\n\`\`\``,
  );

  lines.push(`\n## Conflict Structure`);
  lines.push(`### Actors`);
  caseData.actors.forEach((a) => lines.push(`- **${a.name}** (${a.role})`));
  lines.push(`### Primitives`);
  caseData.primitives.forEach((p) => {
    const actor = caseData.actors.find((a) => a.id === p.actorId);
    lines.push(
      `- [${p.type}] ${p.description} — *${actor?.name || "Unknown"}*`,
    );
  });

  if (pathways) {
    lines.push(`\n## Resolution Pathways`);
    lines.push(`\n### Executive Summary\n${pathways.executiveSummary}`);

    if (pathways.commonGround?.length) {
      lines.push(`\n### Common Ground`);
      pathways.commonGround.forEach((item) =>
        lines.push(
          `- **[${item.strength}]** ${item.item} — ${item.evidence}`,
        ),
      );
    }

    if (pathways.pathways?.length) {
      lines.push(`\n### Pathways`);
      pathways.pathways.forEach((p, i) => {
        lines.push(`\n#### ${i + 1}. ${p.title}`);
        lines.push(p.description);
        lines.push(`*Framework: ${p.framework} | Feasibility: ${p.feasibility}*`);
        lines.push(`- Trade-offs for ${caseData.partyAName}: ${p.tradeoffsForA}`);
        lines.push(`- Trade-offs for ${caseData.partyBName}: ${p.tradeoffsForB}`);
      });
    }

    if (pathways.momentumAssessment) {
      const m = pathways.momentumAssessment;
      lines.push(`\n### Momentum Assessment`);
      lines.push(`Readiness to Resolve: ${m.readinessToResolve}/100`);
      lines.push(`Recommended Next Move: ${m.recommendedNextMove}`);
      if (m.blockers?.length) {
        lines.push(`\n**Blockers:**`);
        m.blockers.forEach((b) => lines.push(`- ${b}`));
      }
      if (m.catalysts?.length) {
        lines.push(`\n**Catalysts:**`);
        m.catalysts.forEach((c) => lines.push(`- ${c}`));
      }
    }
  }

  return lines.join("\n");
}

export function exportAsJSON(
  caseData: Case,
  pathways?: PathwaysResult | null,
  summary?: CaseSummary | null,
): string {
  return JSON.stringify({ case: caseData, pathways, summary }, null, 2);
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
