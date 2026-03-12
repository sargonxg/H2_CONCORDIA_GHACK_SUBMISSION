import { describe, it, expect, beforeEach } from 'vitest';
import { createRoom, getRoom, joinRoom, leaveRoom, broadcastToRoom, getRoomCount, listRooms } from '@/lib/room-manager';

// Minimal WebSocket mock
function makeMockWs(readyState = 1 /* OPEN */) {
  const sent: string[] = [];
  return {
    readyState,
    send: (data: string) => sent.push(data),
    _sent: sent,
  } as any;
}

describe('createRoom', () => {
  it('creates a room with a 6-character code', () => {
    const room = createRoom('case-1');
    expect(room.id).toHaveLength(6);
  });

  it('room code contains only valid characters (no 0, O, 1, I)', () => {
    for (let i = 0; i < 20; i++) {
      const room = createRoom(`case-${i}`);
      expect(room.id).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it('stores caseId on the room', () => {
    const room = createRoom('my-case-id');
    expect(room.caseId).toBe('my-case-id');
  });

  it('starts with no clients', () => {
    const room = createRoom('empty');
    expect(room.clients.size).toBe(0);
  });

  it('initializes geminiSession as null', () => {
    const room = createRoom('case-x');
    expect(room.geminiSession).toBeNull();
  });

  it('sets createdAt to approximately now', () => {
    const before = Date.now();
    const room = createRoom('timing');
    const after = Date.now();
    expect(room.createdAt).toBeGreaterThanOrEqual(before);
    expect(room.createdAt).toBeLessThanOrEqual(after);
  });
});

describe('getRoom', () => {
  it('retrieves a room by its id', () => {
    const room = createRoom('retrieve-me');
    const found = getRoom(room.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(room.id);
  });

  it('returns undefined for unknown room code', () => {
    expect(getRoom('XXXXXX')).toBeUndefined();
  });

  it('is case-insensitive (normalizes to uppercase)', () => {
    const room = createRoom('case-insensitive');
    const lower = room.id.toLowerCase();
    const found = getRoom(lower);
    expect(found).toBeDefined();
  });
});

describe('joinRoom', () => {
  it('adds a client to the room', () => {
    const room = createRoom('join-test');
    const ws = makeMockWs();
    const result = joinRoom(room.id, 'client-1', ws, 'A', 'Alice');
    expect(result).not.toBeNull();
    expect(room.clients.size).toBe(1);
  });

  it('returns null for unknown room', () => {
    const ws = makeMockWs();
    const result = joinRoom('ZZZZZZ', 'c1', ws, 'A', 'Bob');
    expect(result).toBeNull();
  });

  it('stores party id and name', () => {
    const room = createRoom('party-id-test');
    const ws = makeMockWs();
    joinRoom(room.id, 'client-a', ws, 'B', 'Bob');
    const client = room.clients.get('client-a');
    expect(client?.partyId).toBe('B');
    expect(client?.name).toBe('Bob');
  });

  it('sets joinedAt to approximately now', () => {
    const room = createRoom('timing-join');
    const ws = makeMockWs();
    const before = Date.now();
    joinRoom(room.id, 'c1', ws, 'observer', 'Observer');
    const after = Date.now();
    const client = room.clients.get('c1');
    expect(client?.joinedAt).toBeGreaterThanOrEqual(before);
    expect(client?.joinedAt).toBeLessThanOrEqual(after);
  });
});

describe('leaveRoom', () => {
  it('removes the client from the room', () => {
    const room = createRoom('leave-test');
    const ws = makeMockWs();
    joinRoom(room.id, 'c1', ws, 'A', 'Alice');
    expect(room.clients.size).toBe(1);
    leaveRoom(room.id, 'c1');
    // Room should be deleted since it's now empty
    expect(getRoom(room.id)).toBeUndefined();
  });

  it('does not throw for unknown room', () => {
    expect(() => leaveRoom('ZZZZZZ', 'nobody')).not.toThrow();
  });

  it('keeps room alive when other clients remain', () => {
    const room = createRoom('multi-client');
    const ws1 = makeMockWs();
    const ws2 = makeMockWs();
    joinRoom(room.id, 'c1', ws1, 'A', 'Alice');
    joinRoom(room.id, 'c2', ws2, 'B', 'Bob');
    leaveRoom(room.id, 'c1');
    expect(getRoom(room.id)).toBeDefined();
    expect(room.clients.size).toBe(1);
  });
});

describe('broadcastToRoom', () => {
  it('sends message to all open clients', () => {
    const room = createRoom('broadcast-test');
    const ws1 = makeMockWs();
    const ws2 = makeMockWs();
    joinRoom(room.id, 'c1', ws1, 'A', 'Alice');
    joinRoom(room.id, 'c2', ws2, 'B', 'Bob');
    broadcastToRoom(room, { type: 'test', data: 'hello' });
    expect(ws1._sent).toHaveLength(1);
    expect(ws2._sent).toHaveLength(1);
    expect(JSON.parse(ws1._sent[0])).toEqual({ type: 'test', data: 'hello' });
  });

  it('excludes a client when excludeClientId is provided', () => {
    const room = createRoom('exclude-test');
    const ws1 = makeMockWs();
    const ws2 = makeMockWs();
    joinRoom(room.id, 'c1', ws1, 'A', 'Alice');
    joinRoom(room.id, 'c2', ws2, 'B', 'Bob');
    broadcastToRoom(room, { type: 'test' }, 'c1');
    expect(ws1._sent).toHaveLength(0);
    expect(ws2._sent).toHaveLength(1);
  });

  it('skips closed WebSocket connections', () => {
    const room = createRoom('closed-ws-test');
    const ws1 = makeMockWs(3); // CLOSED
    const ws2 = makeMockWs(1); // OPEN
    joinRoom(room.id, 'c1', ws1, 'A', 'Alice');
    joinRoom(room.id, 'c2', ws2, 'B', 'Bob');
    expect(() => broadcastToRoom(room, { type: 'test' })).not.toThrow();
    expect(ws2._sent).toHaveLength(1);
    expect(ws1._sent).toHaveLength(0);
  });
});

describe('utility functions', () => {
  it('getRoomCount returns count of active rooms', () => {
    const before = getRoomCount();
    createRoom('count-test-1');
    createRoom('count-test-2');
    expect(getRoomCount()).toBeGreaterThanOrEqual(before + 2);
  });

  it('listRooms returns array of room codes', () => {
    const room = createRoom('list-test');
    const list = listRooms();
    expect(Array.isArray(list)).toBe(true);
    expect(list).toContain(room.id);
  });
});
