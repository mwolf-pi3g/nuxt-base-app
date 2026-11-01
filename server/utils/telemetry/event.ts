import { db } from "hub:db";
import { userEvents } from "hub:db:schema";

export enum EventScope {
  SYSTEM = 'system', // Technical runtime logs (stdout/stderr only)
  USER = 'user'      // Business domain events (persisted for UI)
}

export enum EventLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface TelemetryEvent {
  scope: EventScope;
  level: EventLevel;
  category: 'automation' | 'notification' | 'system' | string;
  message: string;        // i18n message key (e.g. 'events.automation.completed')
  owner_id?: string;     // Required for USER scope
  metadata?: Record<string, any>; // Named arguments for i18n interpolation
  timestamp?: Date;
}

/**
 * Masks credentials in free text (e.g. provider error messages) without a list of services:
 * - userinfo in any URL scheme (RFC 3986), also with "@" in the user name:
 *   "ntfy://user:pass@host" -> "ntfy://***@host"
 * - bare "user:pass@host" pairs
 * - secret-looking query parameters: "?token=abc" -> "?token=***"
 * - long token-like strings (letters + digits, >= 24 chars), e.g. API keys in URL paths
 */
export function sanitizeReason(reason: unknown): string {
  if (reason === undefined || reason === null) return '';
  return String(reason)
    .replace(/\b([a-z][a-z0-9+.-]*):\/\/[^\s/?#]*@/gi, '$1://***@')
    .replace(/(^|[\s'"(])[^\s:/@'"()]+:[^\s/@'"()]+@/g, '$1***@')
    .replace(/([?&][^=&\s#]*(?:token|key|secret|pass(?:word)?|auth)[^=&\s#]*=)[^&\s#'"]+/gi, '$1***')
    .replace(/(?=[A-Za-z0-9_:-]*\d)(?=[A-Za-z0-9_:-]*[A-Za-z])\b[A-Za-z0-9_:-]{24,}\b/g, '***');
}

/**
 * Persists a USER-scope ERROR event; metadata.reason is sanitized. No-op without owner, never throws.
 */
export async function emitUserError(
  ownerId: string | undefined,
  category: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  if (!ownerId) return;
  try {
    await emitTelemetryEvent({
      scope: EventScope.USER,
      owner_id: ownerId,
      level: EventLevel.ERROR,
      category,
      message,
      metadata: 'reason' in metadata ? { ...metadata, reason: sanitizeReason(metadata.reason) } : metadata
    });
  } catch (err) {
    console.error('[Telemetry] Failed to emit user error:', err);
  }
}

/** A notification could not be delivered (provider/channel failure). */
export const reportNotificationFailure = (ownerId: string | undefined, channel: string, reason: unknown) =>
  emitUserError(ownerId, 'notification', 'events.notification.send_failed', { channel, reason });

const LEVEL_PRIORITY: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

const getLogLevelThreshold = (envValue: string | undefined, defaultLevel: string): number => {
  const levelStr = (envValue || defaultLevel).toLowerCase().trim();
  return LEVEL_PRIORITY[levelStr] ?? LEVEL_PRIORITY[defaultLevel.toLowerCase()] ?? 3;
};

/**
 * Normalizes system and user telemetry events.
 * Controls terminal output via LOG_LEVEL_SYSTEM (default ERROR) and LOG_LEVEL_USER (default NONE).
 * Persists USER-scoped events directly to the database via a blocking pipeline.
 */
export const emitTelemetryEvent = async (event: TelemetryEvent): Promise<void> => {
  const eventLevelNum = LEVEL_PRIORITY[event.level.toLowerCase()] ?? 1;

  const timestampToSecond = (event.timestamp || new Date()).toISOString().slice(0, 19);

  // 1. Evaluate Terminal Output
  if (event.scope === EventScope.SYSTEM) {
    const sysThreshold = getLogLevelThreshold(process.env.LOG_LEVEL_SYSTEM, 'ERROR');
    if (eventLevelNum >= sysThreshold) {
      const formattedMsg = `[${timestampToSecond}] [SYSTEM] [${event.category.toUpperCase()}] [${event.level.toUpperCase()}] ${event.message}`;
      if (event.level === EventLevel.ERROR) {
        console.error(formattedMsg, event.metadata ?? '');
      } else if (event.level === EventLevel.WARN) {
        console.warn(formattedMsg, event.metadata ?? '');
      } else {
        console.log(formattedMsg, event.metadata ?? '');
      }
    }
  } else if (event.scope === EventScope.USER) {
    const userThreshold = getLogLevelThreshold(process.env.LOG_LEVEL_USER, 'NONE');
    if (eventLevelNum >= userThreshold) {
      const formattedMsg = `[${timestampToSecond}] [USER:${event.owner_id || 'unknown'}] [${event.category.toUpperCase()}] [${event.level.toUpperCase()}] ${event.message}`;
      if (event.level === EventLevel.ERROR) {
        console.error(formattedMsg, event.metadata ?? '');
      } else if (event.level === EventLevel.WARN) {
        console.warn(formattedMsg, event.metadata ?? '');
      } else {
        console.log(formattedMsg, event.metadata ?? '');
      }
    }

    // 2. Blocking Database Persistence Pipeline
    if (event.owner_id) {
      try {
        await db.insert(userEvents).values({
          id: crypto.randomUUID(),
          owner_id: event.owner_id,
          level: event.level,
          message: event.message,
          metadata: event.metadata ?? {},
          createdAt: event.timestamp || new Date()
        });
      } catch (dbError) {
        console.error('[Telemetry] Failed to persist user event:', dbError);
      }
    }
  }
};
