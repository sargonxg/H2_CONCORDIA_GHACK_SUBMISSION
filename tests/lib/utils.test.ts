import { describe, it, expect } from 'vitest';
import { safeJsonParse } from '@/lib/utils';

describe('safeJsonParse', () => {
  it('parses valid JSON object', () => {
    expect(safeJsonParse('{"a":1}', null)).toEqual({ a: 1 });
  });

  it('parses valid JSON array', () => {
    expect(safeJsonParse('[1,2,3]', null)).toEqual([1, 2, 3]);
  });

  it('parses valid JSON string', () => {
    expect(safeJsonParse('"hello"', null)).toBe('hello');
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('not json', 'fallback')).toBe('fallback');
  });

  it('returns fallback for empty string', () => {
    expect(safeJsonParse('', null)).toBeNull();
  });

  it('returns fallback for null input', () => {
    expect(safeJsonParse(null, 42)).toBe(42);
  });

  it('returns fallback for undefined input', () => {
    expect(safeJsonParse(undefined, 'default')).toBe('default');
  });

  it('returns fallback for partial JSON', () => {
    expect(safeJsonParse('{"a":1', null)).toBeNull();
  });

  it('preserves nested objects', () => {
    const result = safeJsonParse('{"a":{"b":{"c":3}}}', null);
    expect(result).toEqual({ a: { b: { c: 3 } } });
  });
});
