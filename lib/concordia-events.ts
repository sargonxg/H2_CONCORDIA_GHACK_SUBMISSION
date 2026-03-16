export interface ConcordiaEvents {
  'session:started': { sessionId: string; caseId: string };
  'session:ended': { sessionId: string; duration: number; summary?: any };
  'session:paused': { sessionId: string; reason: string };
  'phase:changed': { from: string; to: string; timestamp: string };
  'primitive:extracted': { primitive: any; source: 'live' | 'document' };
  'agreement:reached': { agreement: any };
  'escalation:detected': { flag: any };
  'commonGround:identified': { items: string[] };
  'graph:updated': { nodes: any[]; edges: any[] };
  'speaker:identified': { name: string; confidence: number };
  'emotion:detected': { party: string; emotion: string; intensity: number };
}

export type ConcordiaEventName = keyof ConcordiaEvents;

export class ConcordiaEventBus {
  private listeners = new Map<string, Set<Function>>();

  on<E extends ConcordiaEventName>(event: E, callback: (data: ConcordiaEvents[E]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit<E extends ConcordiaEventName>(event: E, data: ConcordiaEvents[E]): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export const globalEventBus = new ConcordiaEventBus();
