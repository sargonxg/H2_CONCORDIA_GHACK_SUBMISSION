import { WebSocket } from "ws";

// ─── Types ────────────────────────────────────────────────────────────────────
export type RoomClient = {
  ws: WebSocket;
  partyId: "A" | "B" | "observer";
  name: string;
  joinedAt: number;
};

export type Room = {
  id: string;
  caseId: string;
  geminiSession: any;
  clients: Map<string, RoomClient>;
  sessionParams: any;
  createdAt: number;
  latestResumptionHandle: string | null;
};

// ─── In-memory store ──────────────────────────────────────────────────────────
const rooms = new Map<string, Room>();

// ─── Code generation ──────────────────────────────────────────────────────────
// Omits ambiguous characters (0, O, 1, I) for easy verbal sharing
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function uniqueCode(): string {
  let code = generateRoomCode();
  let tries = 0;
  while (rooms.has(code) && tries < 20) {
    code = generateRoomCode();
    tries++;
  }
  return code;
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────
export function createRoom(caseId: string): Room {
  const id = uniqueCode();
  const room: Room = {
    id,
    caseId,
    geminiSession: null,
    clients: new Map(),
    sessionParams: null,
    createdAt: Date.now(),
    latestResumptionHandle: null,
  };
  rooms.set(id, room);

  // Auto-expire after 15 min if still empty (no clients joined)
  setTimeout(() => {
    const r = rooms.get(id);
    if (r && r.clients.size === 0) {
      rooms.delete(id);
      console.log(`[Room] ${id} expired (no clients joined within 15 min)`);
    }
  }, 15 * 60 * 1000);

  console.log(`[Room] Created room ${id} for case ${caseId}`);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id.toUpperCase());
}

export function joinRoom(
  roomId: string,
  clientId: string,
  ws: WebSocket,
  partyId: "A" | "B" | "observer",
  name: string,
): Room | null {
  const room = getRoom(roomId);
  if (!room) return null;

  room.clients.set(clientId, { ws, partyId, name, joinedAt: Date.now() });
  console.log(`[Room] ${clientId} (${name}/${partyId}) joined room ${roomId}`);
  return room;
}

export function leaveRoom(roomId: string, clientId: string) {
  const room = getRoom(roomId);
  if (!room) return;

  room.clients.delete(clientId);
  console.log(`[Room] ${clientId} left room ${roomId} (${room.clients.size} remaining)`);

  // Clean up room when fully empty
  if (room.clients.size === 0) {
    if (room.geminiSession) {
      try {
        room.geminiSession.close();
      } catch {
        // ignore
      }
    }
    rooms.delete(roomId);
    console.log(`[Room] ${roomId} closed (all clients left)`);
  }
}

export function broadcastToRoom(
  room: Room,
  message: any,
  excludeClientId?: string,
) {
  const payload = JSON.stringify(message);
  for (const [clientId, client] of room.clients) {
    if (excludeClientId && clientId === excludeClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────
export function getRoomCount(): number {
  return rooms.size;
}

export function listRooms(): string[] {
  return Array.from(rooms.keys());
}
