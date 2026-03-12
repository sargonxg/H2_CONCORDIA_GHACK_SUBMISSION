import { describe, it, expect } from 'vitest';
import {
  detectEscalationLevel,
  getProtocolForEscalation,
  ESCALATION_TRIGGERS,
} from '@/lib/de-escalation';

describe('detectEscalationLevel', () => {
  it('returns 0 for neutral text', () => {
    expect(detectEscalationLevel('I would like to discuss the timeline')).toBe(0);
  });

  it('detects blame language', () => {
    const level = detectEscalationLevel('You always do this to me');
    expect(level).toBeGreaterThan(0);
  });

  it('detects contempt', () => {
    const level = detectEscalationLevel("That's ridiculous and you're incompetent");
    expect(level).toBeGreaterThanOrEqual(60);
  });

  it('detects threats', () => {
    const level = detectEscalationLevel("I'll take this to court and my lawyer will handle it");
    expect(level).toBeGreaterThanOrEqual(40);
  });

  it('detects stonewalling', () => {
    const level = detectEscalationLevel("This is pointless, I'm done");
    expect(level).toBeGreaterThanOrEqual(50);
  });

  it('caps at 100', () => {
    const extreme =
      "You always do this, it's your fault, that's ridiculous, " +
      "you're pathetic, I'll take this to court, this is pointless, I'm done";
    expect(detectEscalationLevel(extreme)).toBeLessThanOrEqual(100);
  });
});

describe('getProtocolForEscalation', () => {
  it('returns level 1 for score 30-50', () => {
    const protocol = getProtocolForEscalation(40);
    expect(protocol?.level).toBe(1);
    expect(protocol?.name).toBe('Acknowledgment');
  });

  it('returns level 4 for score 86-100', () => {
    const protocol = getProtocolForEscalation(90);
    expect(protocol?.level).toBe(4);
    expect(protocol?.name).toBe('Crisis Protocol');
  });

  it('returns null for score below 30', () => {
    expect(getProtocolForEscalation(10)).toBeNull();
  });
});

describe('ESCALATION_TRIGGERS', () => {
  it('contains triggers for all four Gottman categories', () => {
    const categories = ESCALATION_TRIGGERS.map((t) => t.category);
    expect(categories).toContain('blame');
    expect(categories).toContain('contempt');
    expect(categories).toContain('threat');
    expect(categories).toContain('stonewalling');
  });

  it('every trigger has a pattern, category, and severity', () => {
    ESCALATION_TRIGGERS.forEach((t) => {
      expect(t.pattern).toBeInstanceOf(RegExp);
      expect(typeof t.category).toBe('string');
      expect(typeof t.severity).toBe('number');
      expect(t.severity).toBeGreaterThan(0);
    });
  });
});

// ── COGNITIVE_DISTORTIONS ─────────────────────────────────────────────────────
import { COGNITIVE_DISTORTIONS, detectGlaslStage } from '@/lib/de-escalation';

describe('COGNITIVE_DISTORTIONS', () => {
  it('has at least 10 entries', () => {
    expect(COGNITIVE_DISTORTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('every entry has name and intervention', () => {
    COGNITIVE_DISTORTIONS.forEach((d) => {
      expect(typeof d.name).toBe('string');
      expect(d.name.length).toBeGreaterThan(0);
      expect(typeof d.intervention).toBe('string');
      expect(d.intervention.length).toBeGreaterThan(0);
    });
  });

  it('every entry has a description', () => {
    COGNITIVE_DISTORTIONS.forEach((d) => {
      expect(typeof d.description).toBe('string');
      expect(d.description.length).toBeGreaterThan(0);
    });
  });

  it('includes Fundamental Attribution Error', () => {
    const names = COGNITIVE_DISTORTIONS.map((d) => d.name);
    expect(names).toContain('Fundamental Attribution Error');
  });

  it('includes Zero-Sum Thinking', () => {
    const names = COGNITIVE_DISTORTIONS.map((d) => d.name);
    expect(names).toContain('Zero-Sum Thinking');
  });

  it('includes Anchoring', () => {
    const names = COGNITIVE_DISTORTIONS.map((d) => d.name);
    expect(names).toContain('Anchoring');
  });

  it('includes Catastrophizing', () => {
    const names = COGNITIVE_DISTORTIONS.map((d) => d.name);
    expect(names).toContain('Catastrophizing');
  });
});

// ── detectGlaslStage ──────────────────────────────────────────────────────────
describe('detectGlaslStage', () => {
  it('returns stage 1 for early-stage dialogue', () => {
    const result = detectGlaslStage({
      personalAttacks: false,
      coalitionBuilding: false,
      threats: false,
      lossOfFace: false,
      destructiveBehavior: false,
      empathyPresent: true,
      dialogueWillingness: true,
    });
    expect(result.stage).toBe(1);
  });

  it('returns stage 2 for dialogue willingness without empathy', () => {
    const result = detectGlaslStage({
      personalAttacks: false,
      coalitionBuilding: false,
      threats: false,
      lossOfFace: false,
      destructiveBehavior: false,
      empathyPresent: false,
      dialogueWillingness: true,
    });
    expect(result.stage).toBe(2);
    expect(result.intervention).toContain('dialogue');
  });

  it('returns stage 3 for personal attacks without empathy', () => {
    const result = detectGlaslStage({
      personalAttacks: true,
      coalitionBuilding: false,
      threats: false,
      lossOfFace: false,
      destructiveBehavior: false,
      empathyPresent: false,
      dialogueWillingness: false,
    });
    expect(result.stage).toBe(3);
  });

  it('returns stage 4 for coalition building', () => {
    const result = detectGlaslStage({
      personalAttacks: true,
      coalitionBuilding: true,
      threats: false,
      lossOfFace: false,
      destructiveBehavior: false,
      empathyPresent: false,
      dialogueWillingness: false,
    });
    expect(result.stage).toBe(4);
  });

  it('returns stage 5 for loss of face', () => {
    const result = detectGlaslStage({
      personalAttacks: true,
      coalitionBuilding: false,
      threats: false,
      lossOfFace: true,
      destructiveBehavior: false,
      empathyPresent: false,
      dialogueWillingness: false,
    });
    expect(result.stage).toBe(5);
  });

  it('returns stage 6 for threats', () => {
    const result = detectGlaslStage({
      personalAttacks: true,
      coalitionBuilding: true,
      threats: true,
      lossOfFace: true,
      destructiveBehavior: false,
      empathyPresent: false,
      dialogueWillingness: false,
    });
    expect(result.stage).toBe(6);
  });

  it('returns stage 7 for destructive behavior', () => {
    const result = detectGlaslStage({
      personalAttacks: true,
      coalitionBuilding: true,
      threats: true,
      lossOfFace: true,
      destructiveBehavior: true,
      empathyPresent: false,
      dialogueWillingness: false,
    });
    expect(result.stage).toBe(7);
    expect(result.intervention).toContain('Arbitration');
  });

  it('every result has a stage number and intervention string', () => {
    const scenarios = [
      { personalAttacks: false, coalitionBuilding: false, threats: false, lossOfFace: false, destructiveBehavior: false, empathyPresent: true, dialogueWillingness: true },
      { personalAttacks: true, coalitionBuilding: false, threats: false, lossOfFace: false, destructiveBehavior: false, empathyPresent: false, dialogueWillingness: false },
      { personalAttacks: true, coalitionBuilding: true, threats: true, lossOfFace: true, destructiveBehavior: true, empathyPresent: false, dialogueWillingness: false },
    ];
    scenarios.forEach((s) => {
      const result = detectGlaslStage(s);
      expect(typeof result.stage).toBe('number');
      expect(result.stage).toBeGreaterThanOrEqual(1);
      expect(result.stage).toBeLessThanOrEqual(9);
      expect(typeof result.intervention).toBe('string');
      expect(result.intervention.length).toBeGreaterThan(0);
    });
  });
});
