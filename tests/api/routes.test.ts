import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock AI service to avoid real Gemini calls ────────────────────────────────
vi.mock('@/lib/ai-service', () => ({
  extractPrimitives: vi.fn().mockResolvedValue(
    JSON.stringify({ actors: [{ id: 'a1', name: 'Alice', role: 'Claimant' }], primitives: [] }),
  ),
  chatWithAdvisor: vi.fn().mockResolvedValue('Here is my advice based on Fisher & Ury.'),
  analyzePathways: vi.fn().mockResolvedValue(
    JSON.stringify({ executiveSummary: 'Test summary', pathways: [], zopaAnalysis: null }),
  ),
  summarizeCase: vi.fn().mockResolvedValue(
    JSON.stringify({
      sessionOverview: 'Overview text',
      keyClaimsPartyA: ['Claim A'],
      keyClaimsPartyB: ['Claim B'],
      coreInterestsPartyA: [],
      coreInterestsPartyB: [],
      areasOfAgreement: [],
      unresolvedTensions: [],
      recommendedNextSteps: [],
    }),
  ),
  generateAgreement: vi.fn().mockResolvedValue({
    preamble: 'Test preamble',
    agreedTerms: [{ number: 1, title: 'Term One', text: 'Both parties agree.' }],
    disclaimer: 'CONCORDIA is a communication facilitation tool.',
  }),
  processDocument: vi.fn().mockResolvedValue('Document summary: key facts extracted.'),
}));

// ── /api/health ───────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('includes timestamp and service fields', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const data = await response.json();
    expect(data.timestamp).toBeTruthy();
    expect(data.service).toBeTruthy();
  });
});

// ── /api/extract ──────────────────────────────────────────────────────────────
describe('POST /api/extract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with result for valid text', async () => {
    const { POST } = await import('@/app/api/extract/route');
    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Alice and Bob are in a dispute over the project timeline.' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.result).toBeDefined();
  });

  it('returns 422 when text is missing', async () => {
    const { POST } = await import('@/app/api/extract/route');
    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it('returns 422 when text is empty string', async () => {
    const { POST } = await import('@/app/api/extract/route');
    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(422);
  });
});

// ── /api/chat ─────────────────────────────────────────────────────────────────
describe('POST /api/chat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with response for valid input', async () => {
    const { POST } = await import('@/app/api/chat/route');
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is BATNA?', history: [] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.text).toBeTruthy();
  });

  it('returns error for missing message', async () => {
    const { POST } = await import('@/app/api/chat/route');
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    // Should return a 4xx error
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

// ── /api/generate-agreement ───────────────────────────────────────────────────
describe('POST /api/generate-agreement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with agreement data for valid input', async () => {
    const { POST } = await import('@/app/api/generate-agreement/route');
    const request = new Request('http://localhost/api/generate-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseTitle: 'Test Dispute',
        caseType: 'Workplace',
        partyAName: 'Alice',
        partyBName: 'Bob',
        agreements: [{ topic: 'Schedule', terms: 'Meet weekly' }],
        transcript: 'Sample transcript...',
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
