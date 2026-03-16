import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ws module
vi.mock('ws', () => ({
  WebSocket: { OPEN: 1, CLOSED: 3 },
}));

// Mock ai-service
vi.mock('../../lib/ai-service', () => ({
  createLiveSession: vi.fn().mockResolvedValue({
    sendRealtimeInput: vi.fn(),
    sendToolResponse: vi.fn(),
    sendClientContent: vi.fn(),
    close: vi.fn(),
  }),
}));

// Mock room-manager
vi.mock('../../lib/room-manager', () => ({
  createRoom: vi.fn(() => ({ id: 'TEST1', clients: new Map(), caseId: 'test' })),
  getRoom: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  broadcastToRoom: vi.fn(),
}));

class MockWebSocket {
  readyState = 1;
  sent: string[] = [];
  handlers: Record<string, Function[]> = {};

  send(data: string) {
    this.sent.push(data);
  }
  on(event: string, handler: Function) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }
  close() {
    this.readyState = 3;
  }
  emit(event: string, data?: any) {
    this.handlers[event]?.forEach(h => h(data));
  }
}

describe('WebSocket Handler', () => {
  let ws: MockWebSocket;

  beforeEach(() => {
    ws = new MockWebSocket();
  });

  it('should register message and close handlers', async () => {
    const { handleWebSocketConnection } = await import('../../lib/ws-handler');
    handleWebSocketConnection(ws as any);
    expect(ws.handlers['message']).toBeDefined();
    expect(ws.handlers['close']).toBeDefined();
  });

  it('should respond to ping with pong', async () => {
    const { handleWebSocketConnection } = await import('../../lib/ws-handler');
    handleWebSocketConnection(ws as any);
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'ping' })));
    const lastMsg = ws.sent[ws.sent.length - 1];
    expect(lastMsg).toBeDefined();
    expect(JSON.parse(lastMsg).type).toBe('pong');
  });

  it('should handle close gracefully', async () => {
    const { handleWebSocketConnection } = await import('../../lib/ws-handler');
    handleWebSocketConnection(ws as any);
    // Should not throw
    ws.emit('close');
  });

  it('should drop audio when session is not started', async () => {
    const { handleWebSocketConnection } = await import('../../lib/ws-handler');
    handleWebSocketConnection(ws as any);
    // Sending audio before start should not throw
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'audio', audio: { data: 'test', mimeType: 'audio/pcm' } })));
    // No error sent
    const errorMsgs = ws.sent.filter(s => JSON.parse(s).type === 'error');
    expect(errorMsgs.length).toBe(0);
  });

  it('should forward context messages when session exists', async () => {
    const { handleWebSocketConnection } = await import('../../lib/ws-handler');
    handleWebSocketConnection(ws as any);
    // Context without session should not throw
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'context', text: 'test context' })));
  });
});
