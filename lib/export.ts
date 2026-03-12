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

export function generateAgreementHTML(
  agreement: {
    preamble?: string;
    background?: string;
    agreedTerms?: { number: number; title: string; text: string; responsible?: string; deadline?: string }[];
    implementationPlan?: string;
    reviewMechanism?: string;
    contingencies?: string;
    confidentiality?: string;
    acknowledgment?: string;
    disclaimer?: string;
  },
  meta: {
    caseTitle: string;
    caseType: string;
    partyAName: string;
    partyBName: string;
    date: string;
  },
): string {
  const terms = (agreement.agreedTerms ?? [])
    .map(
      (t) => `
        <div class="term">
          <div class="term-header">
            <span class="term-number">${t.number}.</span>
            <span class="term-title">${t.title}</span>
          </div>
          <p>${t.text}</p>
          ${t.responsible ? `<div class="term-meta"><strong>Responsible:</strong> ${t.responsible}</div>` : ""}
          ${t.deadline ? `<div class="term-meta"><strong>Deadline:</strong> ${t.deadline}</div>` : ""}
        </div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Settlement Agreement — ${meta.caseTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: #1a1a2e;
      background: #fff;
      padding: 48px;
      max-width: 860px;
      margin: 0 auto;
    }
    h1, h2, h3 { font-family: 'Crimson Pro', serif; }
    .header {
      text-align: center;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .header .brand {
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .header .meta {
      font-size: 13px;
      color: #444;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 24px 0;
      padding: 20px;
      background: #f8f9fc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .meta-grid .item label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #888;
      display: block;
    }
    .meta-grid .item span {
      font-weight: 500;
      font-size: 14px;
    }
    section {
      margin-bottom: 28px;
    }
    section h2 {
      font-size: 18px;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      margin-bottom: 14px;
      color: #1a1a2e;
    }
    section p {
      color: #374151;
    }
    .term {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 12px;
    }
    .term-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;
    }
    .term-number {
      font-family: 'Crimson Pro', serif;
      font-size: 20px;
      font-weight: 600;
      color: #4f46e5;
    }
    .term-title {
      font-weight: 500;
      font-size: 15px;
    }
    .term-meta {
      font-size: 12px;
      color: #6b7280;
      margin-top: 6px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
    }
    .sig-block {
      padding-top: 12px;
    }
    .sig-line {
      border-bottom: 1px solid #1a1a2e;
      height: 48px;
      margin-bottom: 8px;
    }
    .sig-label {
      font-size: 12px;
      color: #444;
    }
    .disclaimer-box {
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 16px;
      font-size: 12px;
      color: #78350f;
      margin-top: 32px;
    }
    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      letter-spacing: 0.05em;
    }
    @media print {
      body { padding: 24px; }
      .term { break-inside: avoid; }
      .signatures { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">CONCORDIA · TACITUS Institute for Conflict Resolution</div>
    <h1>Mediation Settlement Agreement</h1>
    <div class="meta">${meta.caseTitle} &nbsp;·&nbsp; ${meta.caseType} &nbsp;·&nbsp; ${meta.date}</div>
  </div>

  <div class="meta-grid">
    <div class="item"><label>Party A</label><span>${meta.partyAName}</span></div>
    <div class="item"><label>Party B</label><span>${meta.partyBName}</span></div>
    <div class="item"><label>Case Type</label><span>${meta.caseType}</span></div>
    <div class="item"><label>Date</label><span>${meta.date}</span></div>
  </div>

  ${agreement.preamble ? `<section><h2>Preamble</h2><p>${agreement.preamble}</p></section>` : ""}
  ${agreement.background ? `<section><h2>Background</h2><p>${agreement.background}</p></section>` : ""}

  ${terms ? `<section><h2>Agreed Terms</h2>${terms}</section>` : ""}

  ${agreement.implementationPlan ? `<section><h2>Implementation Plan</h2><p>${agreement.implementationPlan}</p></section>` : ""}
  ${agreement.reviewMechanism ? `<section><h2>Review Mechanism</h2><p>${agreement.reviewMechanism}</p></section>` : ""}
  ${agreement.contingencies ? `<section><h2>Contingencies</h2><p>${agreement.contingencies}</p></section>` : ""}
  ${agreement.confidentiality ? `<section><h2>Confidentiality</h2><p>${agreement.confidentiality}</p></section>` : ""}
  ${agreement.acknowledgment ? `<section><h2>Acknowledgment</h2><p>${agreement.acknowledgment}</p></section>` : ""}

  <section>
    <h2>Signatures</h2>
    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">${meta.partyAName} &nbsp;·&nbsp; Party A</div>
        <div class="sig-label" style="margin-top:4px">Date: ___________________</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">${meta.partyBName} &nbsp;·&nbsp; Party B</div>
        <div class="sig-label" style="margin-top:4px">Date: ___________________</div>
      </div>
    </div>
    <div class="signatures" style="margin-top:24px">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Mediator / Facilitator</div>
        <div class="sig-label" style="margin-top:4px">Date: ___________________</div>
      </div>
    </div>
  </section>

  ${agreement.disclaimer ? `<div class="disclaimer-box">${agreement.disclaimer}</div>` : ""}

  <div class="footer">
    Generated by CONCORDIA &nbsp;·&nbsp; TACITUS Institute for Conflict Resolution &nbsp;·&nbsp; ${meta.date}
  </div>
</body>
</html>`;
}
