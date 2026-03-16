import type {
  Actor,
  Primitive,
  Agreement,
  LiveMediationState,
  TimelineEntry,
  EmotionSnapshot,
  AuditEntry,
} from './types';

export interface PrintableReportData {
  caseTitle: string;
  partyAName: string;
  partyBName: string;
  createdAt: string;
  duration: number;
  transcript: string;
  actors: Actor[];
  primitives: Primitive[];
  agreements: Agreement[];
  mediationState: LiveMediationState | null;
  timeline: TimelineEntry[];
  emotionTimeline: EmotionSnapshot[];
  auditTrail: AuditEntry[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} minutes`;
}

/**
 * Generate a full HTML document suitable for opening in a new browser window
 * and printing to PDF via the browser's native Print dialog.
 */
export function generatePrintableReport(session: PrintableReportData): string {
  const createdDate = new Date(session.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── Build sections ──

  // Actors table
  const actorsRows = session.actors
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.role)}</td></tr>`,
    )
    .join('\n');

  // Primitives grouped by type
  const primsByType = new Map<string, Primitive[]>();
  session.primitives.forEach((p) => {
    const list = primsByType.get(p.type) || [];
    list.push(p);
    primsByType.set(p.type, list);
  });
  const primitiveSections = Array.from(primsByType.entries())
    .map(([type, prims]) => {
      const rows = prims
        .map((p) => {
          const actor = session.actors.find((a) => a.id === p.actorId);
          return `<tr>
            <td>${escapeHtml(p.description)}</td>
            <td>${escapeHtml(actor?.name || 'Unknown')}</td>
            <td>${p.resolved ? 'Resolved' : 'Open'}</td>
          </tr>`;
        })
        .join('\n');
      return `<h3>${escapeHtml(type)}s</h3>
        <table><thead><tr><th>Description</th><th>Actor</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    })
    .join('\n');

  // Agreements
  const agreementBlocks = session.agreements
    .map(
      (a, i) => `
      <div class="agreement-block">
        <h3>${i + 1}. ${escapeHtml(a.topic)}</h3>
        <p>${escapeHtml(a.terms)}</p>
        ${
          a.conditions.length
            ? `<p><strong>Conditions:</strong></p><ul>${a.conditions.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
            : ''
        }
        <div class="agreement-meta">
          Party A: ${a.partyAAccepts ? 'Accepted' : 'Pending'} &nbsp;|&nbsp;
          Party B: ${a.partyBAccepts ? 'Accepted' : 'Pending'}
        </div>
      </div>`,
    )
    .join('\n');

  // Timeline
  const timelineRows = session.timeline
    .map(
      (t) =>
        `<tr>
          <td>${new Date(t.timestamp).toLocaleTimeString()}</td>
          <td><span class="badge badge-${t.type}">${escapeHtml(t.type)}</span></td>
          <td>${escapeHtml(t.content)}</td>
          <td>${escapeHtml(t.actor || '-')}</td>
          <td>${escapeHtml(t.phase)}</td>
        </tr>`,
    )
    .join('\n');

  // Emotion timeline
  const emotionRows = session.emotionTimeline
    .map(
      (e) =>
        `<tr>
          <td>${new Date(e.timestamp).toLocaleTimeString()}</td>
          <td>${escapeHtml(e.phase)}</td>
          <td>${escapeHtml(e.partyA.emotionalState)} (${e.partyA.emotionalIntensity}/10 ${escapeHtml(e.partyA.emotionalTrajectory)})</td>
          <td>${escapeHtml(e.partyB.emotionalState)} (${e.partyB.emotionalIntensity}/10 ${escapeHtml(e.partyB.emotionalTrajectory)})</td>
          <td>${e.escalationScore}</td>
        </tr>`,
    )
    .join('\n');

  // Audit trail
  const auditRows = session.auditTrail
    .map(
      (a) =>
        `<tr>
          <td>${escapeHtml(a.timestamp)}</td>
          <td>${escapeHtml(a.actor)}</td>
          <td>${escapeHtml(a.action)}</td>
          <td><code>${escapeHtml(JSON.stringify(a.details))}</code></td>
        </tr>`,
    )
    .join('\n');

  // Phase reached
  const phaseReached = session.mediationState?.phase ?? 'N/A';

  // Table of contents anchors
  const tocItems = [
    { id: 'executive-summary', label: 'Executive Summary' },
    ...(session.actors.length ? [{ id: 'actors', label: 'Actors' }] : []),
    ...(session.primitives.length ? [{ id: 'primitives', label: 'Conflict Primitives' }] : []),
    ...(session.agreements.length ? [{ id: 'agreements', label: 'Agreements' }] : []),
    ...(session.timeline.length ? [{ id: 'timeline', label: 'Session Timeline' }] : []),
    ...(session.emotionTimeline.length ? [{ id: 'emotions', label: 'Emotion Timeline' }] : []),
    ...(session.transcript ? [{ id: 'transcript', label: 'Full Transcript' }] : []),
    ...(session.auditTrail.length ? [{ id: 'audit', label: 'Audit Trail' }] : []),
  ];
  const tocHtml = tocItems
    .map((t) => `<li><a href="#${t.id}">${t.label}</a></li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Session Report — ${escapeHtml(session.caseTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a2e;
      background: #fff;
      padding: 48px 56px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1, h2, h3 { font-family: 'Crimson Pro', Georgia, serif; }
    h2 { font-size: 20px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin: 28px 0 14px; color: #1a1a2e; }
    h3 { font-size: 15px; margin: 16px 0 8px; color: #374151; }

    /* Header / Letterhead */
    .header {
      text-align: center;
      border-bottom: 3px solid #1a1a2e;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header .brand {
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .header h1 { font-size: 26px; font-weight: 600; margin-bottom: 6px; }
    .header .subtitle { font-size: 13px; color: #6b7280; }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin: 20px 0 28px;
      padding: 16px 20px;
      background: #f8f9fc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .meta-grid .item label {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #9ca3af;
    }
    .meta-grid .item span { font-weight: 500; font-size: 13px; }

    /* Table of Contents */
    .toc { margin-bottom: 28px; }
    .toc ol { padding-left: 20px; }
    .toc li { margin-bottom: 4px; }
    .toc a { color: #4f46e5; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    tr:nth-child(even) { background: #fafafa; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-utterance { background: #dbeafe; color: #1e40af; }
    .badge-extraction { background: #dcfce7; color: #166534; }
    .badge-phase-change { background: #fef3c7; color: #92400e; }
    .badge-escalation { background: #fee2e2; color: #991b1b; }
    .badge-common-ground { background: #e0e7ff; color: #3730a3; }
    .badge-reflection { background: #f3e8ff; color: #6b21a8; }

    /* Agreements */
    .agreement-block {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 12px;
    }
    .agreement-meta { font-size: 11px; color: #6b7280; margin-top: 8px; }

    /* Transcript */
    .transcript-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 20px;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.6;
      max-height: none;
      overflow: visible;
    }

    code { font-size: 10px; color: #6b7280; word-break: break-all; }

    .footer {
      text-align: center;
      margin-top: 48px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      letter-spacing: 0.08em;
    }

    /* Print */
    @media print {
      body { padding: 24px; font-size: 11px; }
      .toc { page-break-after: always; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      .agreement-block { page-break-inside: avoid; }
      .no-print { display: none; }
    }

    .print-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 10px 20px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .print-btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>

  <div class="header">
    <div class="brand">CONCORDIA &middot; TACITUS Institute for Conflict Resolution</div>
    <h1>Mediation Session Report</h1>
    <div class="subtitle">${escapeHtml(session.caseTitle)}</div>
  </div>

  <div class="meta-grid">
    <div class="item"><label>Party A</label><span>${escapeHtml(session.partyAName)}</span></div>
    <div class="item"><label>Party B</label><span>${escapeHtml(session.partyBName)}</span></div>
    <div class="item"><label>Date</label><span>${createdDate}</span></div>
    <div class="item"><label>Duration</label><span>${formatDuration(session.duration)}</span></div>
    <div class="item"><label>Phase Reached</label><span>${escapeHtml(phaseReached)}</span></div>
    <div class="item"><label>Agreements</label><span>${session.agreements.length}</span></div>
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    <ol>${tocHtml}</ol>
  </div>

  <section id="executive-summary">
    <h2>Executive Summary</h2>
    <p>
      This mediation session between <strong>${escapeHtml(session.partyAName)}</strong> and
      <strong>${escapeHtml(session.partyBName)}</strong> was conducted on ${createdDate} and
      lasted ${formatDuration(session.duration)}. The session progressed to the
      <strong>${escapeHtml(phaseReached)}</strong> phase.
      ${session.agreements.length > 0 ? `A total of <strong>${session.agreements.length}</strong> agreement(s) were reached.` : 'No formal agreements were reached during this session.'}
      ${session.primitives.length > 0 ? `The conflict graph captured <strong>${session.primitives.length}</strong> primitives across <strong>${session.actors.length}</strong> actors.` : ''}
    </p>
    ${
      session.mediationState?.commonGround?.length
        ? `<h3>Common Ground Identified</h3><ul>${session.mediationState.commonGround.map((cg) => `<li>${escapeHtml(cg)}</li>`).join('')}</ul>`
        : ''
    }
    ${
      session.mediationState?.tensionPoints?.length
        ? `<h3>Remaining Tension Points</h3><ul>${session.mediationState.tensionPoints.map((tp) => `<li>${escapeHtml(tp)}</li>`).join('')}</ul>`
        : ''
    }
  </section>

  ${
    session.actors.length
      ? `<section id="actors">
    <h2>Actors</h2>
    <table>
      <thead><tr><th>Name</th><th>Role</th></tr></thead>
      <tbody>${actorsRows}</tbody>
    </table>
  </section>`
      : ''
  }

  ${
    session.primitives.length
      ? `<section id="primitives">
    <h2>Conflict Primitives</h2>
    ${primitiveSections}
  </section>`
      : ''
  }

  ${
    session.agreements.length
      ? `<section id="agreements">
    <h2>Agreements</h2>
    ${agreementBlocks}
  </section>`
      : ''
  }

  ${
    session.timeline.length
      ? `<section id="timeline">
    <h2>Session Timeline</h2>
    <table>
      <thead><tr><th>Time</th><th>Type</th><th>Content</th><th>Actor</th><th>Phase</th></tr></thead>
      <tbody>${timelineRows}</tbody>
    </table>
  </section>`
      : ''
  }

  ${
    session.emotionTimeline.length
      ? `<section id="emotions">
    <h2>Emotion Timeline</h2>
    <table>
      <thead><tr><th>Time</th><th>Phase</th><th>${escapeHtml(session.partyAName)}</th><th>${escapeHtml(session.partyBName)}</th><th>Escalation</th></tr></thead>
      <tbody>${emotionRows}</tbody>
    </table>
  </section>`
      : ''
  }

  ${
    session.transcript
      ? `<section id="transcript">
    <h2>Full Transcript</h2>
    <div class="transcript-box">${escapeHtml(session.transcript)}</div>
  </section>`
      : ''
  }

  ${
    session.auditTrail.length
      ? `<section id="audit">
    <h2>Audit Trail</h2>
    <table>
      <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead>
      <tbody>${auditRows}</tbody>
    </table>
  </section>`
      : ''
  }

  <div class="footer">
    Generated by CONCORDIA &middot; TACITUS Institute for Conflict Resolution &middot; ${createdDate}
    <br />This document is confidential and intended for the parties involved and their legal representatives only.
  </div>
</body>
</html>`;
}
