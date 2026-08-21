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
  category: 'automation' | 'imap_poll' | 'notification' | 'system' | string;
  message: string;        // i18n message key (e.g. 'events.automation.completed')
  owner_id?: string;     // Required for USER scope
  metadata?: Record<string, any>; // Named arguments for i18n interpolation
  timestamp?: Date;
}

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
