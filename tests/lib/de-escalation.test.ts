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
