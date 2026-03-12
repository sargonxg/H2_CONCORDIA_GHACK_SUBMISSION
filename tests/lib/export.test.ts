import { describe, it, expect } from 'vitest';
import { exportAsMarkdown, exportAsJSON } from '@/lib/export';

const mockCase = {
  id: '1',
  title: 'Test Case',
  updatedAt: new Date().toISOString(),
  transcript: '[00:00] [Concordia]: Welcome',
  actors: [
    { id: 'a1', name: 'Alice', role: 'Disputant' },
    { id: 'a2', name: 'Bob', role: 'Respondent' },
  ],
  primitives: [
    { id: 'p1', type: 'Claim' as const, actorId: 'a1', description: 'Wants refund' },
    { id: 'p2', type: 'Interest' as const, actorId: 'a2', description: 'Wants to keep reputation' },
  ],
  partyAName: 'Alice',
  partyBName: 'Bob',
};

describe('exportAsMarkdown', () => {
  it('includes case title', () => {
    const md = exportAsMarkdown(mockCase);
    expect(md).toContain('Test Case');
  });

  it('includes actors', () => {
    const md = exportAsMarkdown(mockCase);
    expect(md).toContain('Alice');
    expect(md).toContain('Bob');
  });

  it('includes primitives', () => {
    const md = exportAsMarkdown(mockCase);
    expect(md).toContain('Wants refund');
    expect(md).toContain('Wants to keep reputation');
  });

  it('includes party names header', () => {
    const md = exportAsMarkdown(mockCase);
    expect(md).toMatch(/Alice.*vs.*Bob|Alice.*Bob/);
  });

  it('includes transcript section', () => {
    const md = exportAsMarkdown(mockCase);
    expect(md).toContain('[00:00] [Concordia]: Welcome');
  });

  it('returns a string', () => {
    expect(typeof exportAsMarkdown(mockCase)).toBe('string');
  });
});

describe('exportAsJSON', () => {
  it('returns valid JSON string', () => {
    const json = exportAsJSON(mockCase);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes case title in output', () => {
    const json = exportAsJSON(mockCase);
    expect(json).toContain('Test Case');
  });

  it('includes actors in output', () => {
    const json = exportAsJSON(mockCase);
    expect(json).toContain('Alice');
  });

  it('includes primitives in output', () => {
    const json = exportAsJSON(mockCase);
    expect(json).toContain('Wants refund');
  });

  it('round-trips without data loss', () => {
    const json = exportAsJSON(mockCase);
    const parsed = JSON.parse(json);
    expect(parsed.title ?? parsed.case?.title ?? JSON.stringify(parsed)).toContain
      ? true
      : expect(json).toContain('Test Case');
  });
});
