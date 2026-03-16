// ── Pre-Session Briefing Generator ──
// Part of Prompt 2: Generates structured briefings from document extractions
// and cross-document synthesis for the mediator's pre-session preparation.

import { Actor, Primitive, PreSessionBriefing } from './types';
import { DocumentExtractionResult, CrossDocumentSynthesis } from './document-pipeline';

/**
 * Generate a structured pre-session briefing from document extractions and synthesis.
 * Maps extracted primitives into the TACITUS ontology format (Actor/Primitive)
 * and builds party profiles from the extracted data.
 */
export function generatePreSessionBriefing(
  extractions: DocumentExtractionResult[],
  synthesis: CrossDocumentSynthesis,
  partyAName: string,
  partyBName: string,
): PreSessionBriefing {
  // ── Build actors from all extractions ──
  const actorMap = new Map<string, Actor>();
  let actorIdCounter = 1;
  let primitiveIdCounter = 1;

  for (const ext of extractions) {
    for (const a of ext.extractedPrimitives.actors) {
      if (!actorMap.has(a.name.toLowerCase())) {
        actorMap.set(a.name.toLowerCase(), {
          id: `doc-actor-${actorIdCounter++}`,
          name: a.name,
          role: a.role,
          data: {
            name: a.name,
            type: mapActorType(a.type),
            stance: '',
            powerLevel: 3,
          },
        });
      }
    }
  }

  // Ensure party A and party B are always present
  if (!actorMap.has(partyAName.toLowerCase())) {
    actorMap.set(partyAName.toLowerCase(), {
      id: `doc-actor-${actorIdCounter++}`,
      name: partyAName,
      role: 'Party A',
    });
  }
  if (!actorMap.has(partyBName.toLowerCase())) {
    actorMap.set(partyBName.toLowerCase(), {
      id: `doc-actor-${actorIdCounter++}`,
      name: partyBName,
      role: 'Party B',
    });
  }

  const actors = Array.from(actorMap.values());

  // ── Build primitives from all extractions ──
  const primitives: Primitive[] = [];

  for (const ext of extractions) {
    const p = ext.extractedPrimitives;

    // Claims -> Claim primitives
    for (const claim of p.claims) {
      const actorId = findActorId(actorMap, claim.actorName);
      primitives.push({
        id: `doc-prim-${primitiveIdCounter++}`,
        type: 'Claim',
        actorId,
        description: claim.content,
        data: {
          content: claim.content,
          type: mapClaimType(claim.type),
          status: 'active',
          confidence: 0.7,
        },
      });
    }

    // Interests -> Interest primitives
    for (const interest of p.interests) {
      const actorId = findActorId(actorMap, interest.actorName);
      primitives.push({
        id: `doc-prim-${primitiveIdCounter++}`,
        type: 'Interest',
        actorId,
        description: interest.content,
        data: {
          content: interest.content,
          type: mapInterestType(interest.type),
          priority: mapPriority(interest.priority),
          visibility: 'stated',
        },
      });
    }

    // Constraints -> Constraint primitives
    for (const constraint of p.constraints) {
      const actorId = findActorId(actorMap, constraint.actorName);
      primitives.push({
        id: `doc-prim-${primitiveIdCounter++}`,
        type: 'Constraint',
        actorId,
        description: constraint.content,
        data: {
          content: constraint.content,
          type: mapConstraintType(constraint.type),
          rigidity: mapRigidity(constraint.rigidity),
        },
      });
    }

    // Events -> Event primitives
    for (const event of p.events) {
      // Events are not necessarily tied to a single actor; use a generic actorId
      const actorId = actors[0]?.id || 'unknown';
      primitives.push({
        id: `doc-prim-${primitiveIdCounter++}`,
        type: 'Event',
        actorId,
        description: event.content,
        data: {
          content: event.content,
          type: mapEventType(event.type),
          timestamp: event.timestamp,
          impact: mapImpact(event.impact),
        },
      });
    }

    // Narratives -> Narrative primitives
    for (const narrative of p.narratives) {
      const actorId = findActorId(actorMap, narrative.actorName);
      primitives.push({
        id: `doc-prim-${primitiveIdCounter++}`,
        type: 'Narrative',
        actorId,
        description: narrative.content,
        data: {
          content: narrative.content,
          type: mapNarrativeType(narrative.type),
          framing: mapFraming(narrative.framing),
          emotionalTone: '',
        },
      });
    }
  }

  // ── Build party profiles ──
  const partyAId = findActorId(actorMap, partyAName);
  const partyBId = findActorId(actorMap, partyBName);

  const partyAProfile = buildPartyProfile(primitives, partyAId);
  const partyBProfile = buildPartyProfile(primitives, partyBId);

  // ── Build key questions from missing information and contradictions ──
  const keyQuestions: string[] = [];

  for (const missing of synthesis.missingInformation) {
    keyQuestions.push(`Investigate: ${missing}`);
  }

  for (const contradiction of synthesis.contradictions) {
    keyQuestions.push(
      `Clarify contradiction on "${contradiction.topic}": ${partyAName} says "${contradiction.partyAVersion}" vs ${partyBName} says "${contradiction.partyBVersion}"`
    );
  }

  for (const asymmetry of synthesis.powerAsymmetries) {
    keyQuestions.push(`Address power imbalance: ${asymmetry}`);
  }

  // Add default questions if none were generated
  if (keyQuestions.length === 0) {
    keyQuestions.push(
      `What does ${partyAName} consider the most important issue to resolve?`,
      `What does ${partyBName} consider the most important issue to resolve?`,
      'Are there any time-sensitive constraints not reflected in the documents?',
    );
  }

  return {
    caseTimeline: synthesis.timeline,
    partyAProfile,
    partyBProfile,
    contradictions: synthesis.contradictions,
    keyQuestions,
    ontologySnapshot: { actors, primitives },
  };
}

/**
 * Format a pre-session briefing as a context string for the AI mediator.
 * This gets injected into the system prompt for live mediation sessions.
 */
export function formatBriefingForContext(briefing: PreSessionBriefing): string {
  const lines: string[] = [];

  lines.push('[PRE-SESSION DOCUMENT ANALYSIS]');
  lines.push('');

  // Timeline
  if (briefing.caseTimeline.length > 0) {
    lines.push('Timeline:');
    for (const entry of briefing.caseTimeline) {
      lines.push(`  - ${entry.date}: ${entry.event} (source: ${entry.source})`);
    }
    lines.push('');
  }

  // Party A profile
  lines.push('Party A known positions:');
  if (briefing.partyAProfile.statedPositions.length > 0) {
    for (const pos of briefing.partyAProfile.statedPositions) {
      lines.push(`  - ${pos}`);
    }
  } else {
    lines.push('  - No positions documented yet');
  }
  lines.push('Party A known interests:');
  if (briefing.partyAProfile.knownInterests.length > 0) {
    for (const int of briefing.partyAProfile.knownInterests) {
      lines.push(`  - ${int}`);
    }
  } else {
    lines.push('  - No interests documented yet');
  }
  lines.push('Party A constraints:');
  if (briefing.partyAProfile.constraints.length > 0) {
    for (const c of briefing.partyAProfile.constraints) {
      lines.push(`  - ${c}`);
    }
  } else {
    lines.push('  - No constraints documented yet');
  }
  lines.push('');

  // Party B profile
  lines.push('Party B known positions:');
  if (briefing.partyBProfile.statedPositions.length > 0) {
    for (const pos of briefing.partyBProfile.statedPositions) {
      lines.push(`  - ${pos}`);
    }
  } else {
    lines.push('  - No positions documented yet');
  }
  lines.push('Party B known interests:');
  if (briefing.partyBProfile.knownInterests.length > 0) {
    for (const int of briefing.partyBProfile.knownInterests) {
      lines.push(`  - ${int}`);
    }
  } else {
    lines.push('  - No interests documented yet');
  }
  lines.push('Party B constraints:');
  if (briefing.partyBProfile.constraints.length > 0) {
    for (const c of briefing.partyBProfile.constraints) {
      lines.push(`  - ${c}`);
    }
  } else {
    lines.push('  - No constraints documented yet');
  }
  lines.push('');

  // Contradictions
  if (briefing.contradictions.length > 0) {
    lines.push('Contradictions found:');
    for (const c of briefing.contradictions) {
      lines.push(`  - ${c.topic}: Party A says "${c.partyAVersion}" vs Party B says "${c.partyBVersion}" (source: ${c.source})`);
    }
    lines.push('');
  }

  // Key questions
  if (briefing.keyQuestions.length > 0) {
    lines.push('Key questions to investigate:');
    for (const q of briefing.keyQuestions) {
      lines.push(`  - ${q}`);
    }
    lines.push('');
  }

  // Ontology snapshot summary
  const snap = briefing.ontologySnapshot;
  lines.push(`Pre-populated ontology: ${snap.actors.length} actors, ${snap.primitives.length} primitives extracted from documents.`);

  lines.push('[END PRE-SESSION ANALYSIS]');

  return lines.join('\n');
}

// ── Helper Functions ──

function findActorId(actorMap: Map<string, Actor>, name: string): string {
  const actor = actorMap.get(name.toLowerCase());
  if (actor) return actor.id;

  // Try partial match
  for (const [key, val] of actorMap) {
    if (key.includes(name.toLowerCase()) || name.toLowerCase().includes(key)) {
      return val.id;
    }
  }

  return 'unknown';
}

function buildPartyProfile(
  primitives: Primitive[],
  actorId: string,
): { knownInterests: string[]; statedPositions: string[]; constraints: string[] } {
  const knownInterests: string[] = [];
  const statedPositions: string[] = [];
  const constraints: string[] = [];

  for (const p of primitives) {
    if (p.actorId !== actorId) continue;

    switch (p.type) {
      case 'Interest':
        knownInterests.push(p.description);
        break;
      case 'Claim':
        statedPositions.push(p.description);
        break;
      case 'Constraint':
        constraints.push(p.description);
        break;
    }
  }

  return { knownInterests, statedPositions, constraints };
}

// ── Type Mapping Helpers ──
// These map free-form extraction strings to the strict ontology enums

function mapActorType(type: string): 'individual' | 'group' | 'organization' | 'state' {
  const t = type.toLowerCase();
  if (t.includes('group')) return 'group';
  if (t.includes('org')) return 'organization';
  if (t.includes('state') || t.includes('gov')) return 'state';
  return 'individual';
}

function mapClaimType(type: string): 'position' | 'demand' | 'assertion' | 'accusation' {
  const t = type.toLowerCase();
  if (t.includes('demand')) return 'demand';
  if (t.includes('accus')) return 'accusation';
  if (t.includes('assert')) return 'assertion';
  return 'position';
}

function mapInterestType(type: string): 'substantive' | 'procedural' | 'psychological' | 'relational' {
  const t = type.toLowerCase();
  if (t.includes('proced')) return 'procedural';
  if (t.includes('psych')) return 'psychological';
  if (t.includes('relat')) return 'relational';
  return 'substantive';
}

function mapPriority(priority: string): 'critical' | 'important' | 'desirable' {
  const p = priority.toLowerCase();
  if (p.includes('crit')) return 'critical';
  if (p.includes('desir')) return 'desirable';
  return 'important';
}

function mapConstraintType(type: string): 'legal' | 'financial' | 'temporal' | 'organizational' | 'cultural' | 'emotional' {
  const t = type.toLowerCase();
  if (t.includes('legal')) return 'legal';
  if (t.includes('financ')) return 'financial';
  if (t.includes('temp') || t.includes('time')) return 'temporal';
  if (t.includes('org')) return 'organizational';
  if (t.includes('cultur')) return 'cultural';
  if (t.includes('emot')) return 'emotional';
  return 'legal';
}

function mapRigidity(rigidity: string): 'hard' | 'soft' | 'negotiable' {
  const r = rigidity.toLowerCase();
  if (r.includes('hard')) return 'hard';
  if (r.includes('negot')) return 'negotiable';
  return 'soft';
}

function mapEventType(type: string): 'trigger' | 'escalation' | 'de-escalation' | 'turning-point' | 'deadline' | 'milestone' {
  const t = type.toLowerCase();
  if (t.includes('trigger')) return 'trigger';
  if (t.includes('escal') && !t.includes('de-')) return 'escalation';
  if (t.includes('de-escal')) return 'de-escalation';
  if (t.includes('turn')) return 'turning-point';
  if (t.includes('dead')) return 'deadline';
  return 'milestone';
}

function mapImpact(impact: string): 'high' | 'medium' | 'low' {
  const i = impact.toLowerCase();
  if (i.includes('high')) return 'high';
  if (i.includes('low')) return 'low';
  return 'medium';
}

function mapNarrativeType(type: string): 'origin-story' | 'grievance' | 'justification' | 'aspiration' | 'identity-claim' | 'counter-narrative' {
  const t = type.toLowerCase();
  if (t.includes('origin')) return 'origin-story';
  if (t.includes('griev')) return 'grievance';
  if (t.includes('justif')) return 'justification';
  if (t.includes('aspir')) return 'aspiration';
  if (t.includes('ident')) return 'identity-claim';
  if (t.includes('counter')) return 'counter-narrative';
  return 'grievance';
}

function mapFraming(framing: string): 'victim' | 'hero' | 'villain' | 'mediator' | 'neutral' {
  const f = framing.toLowerCase();
  if (f.includes('victim')) return 'victim';
  if (f.includes('hero')) return 'hero';
  if (f.includes('villain')) return 'villain';
  if (f.includes('mediat')) return 'mediator';
  return 'neutral';
}
