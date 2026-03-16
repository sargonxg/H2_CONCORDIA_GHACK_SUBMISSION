'use client';

import type {
  StoredSession,
  SessionSummary,
  IntakeData,
  Actor,
  Primitive,
  Agreement,
  LiveMediationState,
  TimelineEntry,
  EmotionSnapshot,
  AuditEntry,
} from './types';

const DB_NAME = 'concordia-sessions';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('caseId', 'caseId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Run a read-write transaction against the sessions store. */
async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

/** Get a session, apply a mutator, then put it back. */
async function mutateSession(
  sessionId: string,
  mutator: (session: StoredSession) => void,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(sessionId);
    getReq.onsuccess = () => {
      const session = getReq.result as StoredSession | undefined;
      if (!session) {
        reject(new Error(`Session ${sessionId} not found`));
        return;
      }
      mutator(session);
      session.updatedAt = new Date().toISOString();
      store.put(session);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

export const sessionStore = {
  /** Create a new session and return its ID. */
  async createSession(caseId: string, intakeData: IntakeData): Promise<string> {
    const id = generateId();
    const now = new Date().toISOString();
    const session: StoredSession = {
      id,
      caseId,
      intakeData,
      createdAt: now,
      updatedAt: now,
      duration: 0,
      status: 'active',
      transcript: '',
      actors: [],
      primitives: [],
      agreements: [],
      mediationState: {
        phase: 'opening',
        targetActor: '',
        currentAction: '',
        missingItems: [],
        structuredItems: [],
        partyProfiles: { partyA: null, partyB: null },
        commonGround: [],
        tensionPoints: [],
      },
      timeline: [],
      emotionTimeline: [],
      auditTrail: [
        {
          timestamp: now,
          action: 'session_created',
          details: { caseId, caseTitle: intakeData.caseTitle },
          actor: 'system',
        },
      ],
    };
    await withStore('readwrite', (store) => store.put(session));
    return id;
  },

  /** Retrieve a session by ID. */
  async getSession(sessionId: string): Promise<StoredSession | null> {
    const result = await withStore<StoredSession | undefined>(
      'readonly',
      (store) => store.get(sessionId),
    );
    return result ?? null;
  },

  /** List all sessions as lightweight summaries, newest first. */
  async listSessions(): Promise<SessionSummary[]> {
    const all = await withStore<StoredSession[]>(
      'readonly',
      (store) => store.getAll(),
    );
    return (all || [])
      .map((s) => ({
        id: s.id,
        caseId: s.caseId,
        title: s.intakeData.caseTitle,
        createdAt: s.createdAt,
        duration: s.duration,
        status: s.status,
        phaseReached: s.mediationState?.phase ?? 'unknown',
        agreementCount: s.agreements?.length ?? 0,
        partyAName: s.intakeData.partyA.name,
        partyBName: s.intakeData.partyB.name,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /** Delete a session by ID. */
  async deleteSession(sessionId: string): Promise<void> {
    await withStore('readwrite', (store) => store.delete(sessionId));
  },

  /** Partially update top-level session fields. */
  async updateSession(sessionId: string, updates: Partial<StoredSession>): Promise<void> {
    await mutateSession(sessionId, (session) => {
      Object.assign(session, updates);
    });
  },

  // ── Real-time updates ──

  /** Append text to the session transcript. */
  async appendTranscript(sessionId: string, text: string): Promise<void> {
    await mutateSession(sessionId, (session) => {
      session.transcript = text;
    });
  },

  /** Insert or update a primitive (matched by id). */
  async upsertPrimitive(sessionId: string, primitive: Primitive): Promise<void> {
    await mutateSession(sessionId, (session) => {
      const idx = session.primitives.findIndex((p) => p.id === primitive.id);
      if (idx >= 0) {
        session.primitives[idx] = primitive;
      } else {
        session.primitives.push(primitive);
      }
    });
  },

  /** Insert or update an actor (matched by id). */
  async upsertActor(sessionId: string, actor: Actor): Promise<void> {
    await mutateSession(sessionId, (session) => {
      const idx = session.actors.findIndex((a) => a.id === actor.id);
      if (idx >= 0) {
        session.actors[idx] = actor;
      } else {
        session.actors.push(actor);
      }
    });
  },

  /** Append an agreement. */
  async addAgreement(sessionId: string, agreement: Agreement): Promise<void> {
    await mutateSession(sessionId, (session) => {
      session.agreements.push(agreement);
    });
  },

  /** Replace the mediation state. */
  async updateMediationState(sessionId: string, state: LiveMediationState): Promise<void> {
    await mutateSession(sessionId, (session) => {
      session.mediationState = state;
    });
  },

  /** Append a timeline event. */
  async addTimelineEvent(sessionId: string, event: TimelineEntry): Promise<void> {
    await mutateSession(sessionId, (session) => {
      session.timeline.push(event);
    });
  },

  /** Append an emotion snapshot. */
  async addEmotionSnapshot(sessionId: string, snapshot: EmotionSnapshot): Promise<void> {
    await mutateSession(sessionId, (session) => {
      session.emotionTimeline.push(snapshot);
    });
  },

  // ── Audit trail ──

  /** Append an audit entry. */
  async addAuditEntry(sessionId: string, entry: AuditEntry): Promise<void> {
    await mutateSession(sessionId, (session) => {
      session.auditTrail.push(entry);
    });
  },

  /** Get the full audit trail for a session. */
  async getAuditTrail(sessionId: string): Promise<AuditEntry[]> {
    const session = await this.getSession(sessionId);
    return session?.auditTrail ?? [];
  },

  // ── Export ──

  /** Export session data as JSON or Markdown. */
  async exportSession(sessionId: string, format: 'json' | 'markdown'): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (format === 'json') {
      return JSON.stringify(session, null, 2);
    }

    // Markdown export
    const lines: string[] = [];
    lines.push(`# Mediation Session Report`);
    lines.push(`**Case:** ${session.intakeData.caseTitle}`);
    lines.push(`**Parties:** ${session.intakeData.partyA.name} vs ${session.intakeData.partyB.name}`);
    lines.push(`**Date:** ${new Date(session.createdAt).toLocaleDateString()}`);
    lines.push(`**Duration:** ${Math.round(session.duration / 60)} minutes`);
    lines.push(`**Status:** ${session.status}`);
    lines.push(`**Phase reached:** ${session.mediationState?.phase ?? 'N/A'}`);
    lines.push('');

    // Actors
    if (session.actors.length) {
      lines.push(`## Actors`);
      session.actors.forEach((a) => lines.push(`- **${a.name}** (${a.role})`));
      lines.push('');
    }

    // Primitives by type
    if (session.primitives.length) {
      lines.push(`## Conflict Primitives`);
      const byType = new Map<string, Primitive[]>();
      session.primitives.forEach((p) => {
        const list = byType.get(p.type) || [];
        list.push(p);
        byType.set(p.type, list);
      });
      byType.forEach((prims, type) => {
        lines.push(`### ${type}s`);
        prims.forEach((p) => {
          const actor = session.actors.find((a) => a.id === p.actorId);
          lines.push(`- ${p.description} *(${actor?.name || 'Unknown'})*`);
        });
      });
      lines.push('');
    }

    // Agreements
    if (session.agreements.length) {
      lines.push(`## Agreements`);
      session.agreements.forEach((a, i) => {
        lines.push(`### ${i + 1}. ${a.topic}`);
        lines.push(a.terms);
        if (a.conditions.length) {
          lines.push(`**Conditions:**`);
          a.conditions.forEach((c) => lines.push(`- ${c}`));
        }
        lines.push('');
      });
    }

    // Timeline
    if (session.timeline.length) {
      lines.push(`## Session Timeline`);
      session.timeline.forEach((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString();
        lines.push(`- **${time}** [${t.type}] ${t.content}${t.actor ? ` *(${t.actor})*` : ''}`);
      });
      lines.push('');
    }

    // Emotion summary
    if (session.emotionTimeline.length) {
      lines.push(`## Emotion Timeline`);
      session.emotionTimeline.forEach((e) => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        lines.push(
          `- **${time}** [${e.phase}] ` +
          `A: ${e.partyA.emotionalState} (${e.partyA.emotionalIntensity}/10 ${e.partyA.emotionalTrajectory}) | ` +
          `B: ${e.partyB.emotionalState} (${e.partyB.emotionalIntensity}/10 ${e.partyB.emotionalTrajectory})`,
        );
      });
      lines.push('');
    }

    // Transcript
    if (session.transcript) {
      lines.push(`## Full Transcript`);
      lines.push('```');
      lines.push(session.transcript);
      lines.push('```');
      lines.push('');
    }

    // Audit trail
    if (session.auditTrail.length) {
      lines.push(`## Audit Trail`);
      session.auditTrail.forEach((a) => {
        lines.push(`- **${a.timestamp}** [${a.actor}] ${a.action}: ${JSON.stringify(a.details)}`);
      });
    }

    return lines.join('\n');
  },

  // ── GDPR ──

  /** Delete all sessions from IndexedDB. */
  async deleteAllData(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error);
        db.close();
      };
    });
  },
};
