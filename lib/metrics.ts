// Server-side metrics counters (reset on restart, fine for Cloud Run)

const metrics = {
  sessionsStarted: 0,
  activeSessionsEstimate: 0,
  toolCallsTotal: 0,
  errorsTotal: 0,
};

export function getMetrics() {
  return {
    ...metrics,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

export function incrementMetric(key: keyof typeof metrics) {
  metrics[key]++;
}

export function decrementMetric(key: keyof typeof metrics) {
  metrics[key] = Math.max(0, metrics[key] - 1);
}
