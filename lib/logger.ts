type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
const MIN_LEVEL =
  LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"] ?? 1;

function log(
  level: LogLevel,
  component: string,
  message: string,
  data?: unknown,
) {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...(data !== undefined ? { data } : {}),
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (component: string, msg: string, data?: unknown) =>
    log("debug", component, msg, data),
  info: (component: string, msg: string, data?: unknown) =>
    log("info", component, msg, data),
  warn: (component: string, msg: string, data?: unknown) =>
    log("warn", component, msg, data),
  error: (component: string, msg: string, data?: unknown) =>
    log("error", component, msg, data),

  // Session lifecycle logging
  sessionEvent: (sessionId: string, event: string, details?: unknown) =>
    log("info", "Session", `${event} [${sessionId}]`, details),

  // Tool call logging with duration
  toolCall: (toolName: string, durationMs: number, success: boolean) =>
    log("info", "ToolCall", `${toolName} ${success ? "✓" : "✗"} ${durationMs}ms`),

  // Reconnection logging
  reconnect: (attempt: number, maxAttempts: number, reason: string) =>
    log("warn", "Reconnect", `Attempt ${attempt}/${maxAttempts}: ${reason}`),
};
