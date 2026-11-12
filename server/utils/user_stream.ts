// Live updates: the open event streams of each user (server/api/user/stream.get.ts). An event is a name only
// ("events", "emails", ...): the page then loads what it shows through its own routes. Names are the app's; the base
// only checks their form. In memory: one server process (the job queue is in memory too).

const NAME = /^[a-z_]+$/;
const COOLDOWN_MS = 1000;                           // a name is sent at most once per second per connection

/** One open stream; write() may throw when the connection is gone (it is then dropped). */
export interface StreamConnection {
    ownerId: string;
    write(chunk: string): void;
    close(): void;
}

interface Entry {
    conn: StreamConnection;
    pending: Set<string>;
    timer: ReturnType<typeof setTimeout> | null;   // cooldown after a write; names arriving meanwhile wait for it
    openedAt: number;
}

const byOwner = new Map<string, Set<Entry>>();

const drop = (entry: Entry) => {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = null;
    const set = byOwner.get(entry.conn.ownerId);
    set?.delete(entry);
    if (set && set.size === 0) byOwner.delete(entry.conn.ownerId);
};

const write = (entry: Entry, names: string[]) => {
    try {
        entry.conn.write(names.map((name) => `data: ${name}\n\n`).join(''));
    } catch {
        drop(entry);
        try { entry.conn.close(); } catch { /* already gone */ }
        return;
    }
    // Names arriving within the cooldown are sent together at its end (each once)
    entry.timer = setTimeout(() => {
        entry.timer = null;
        const waiting = [...entry.pending];
        entry.pending.clear();
        if (waiting.length) write(entry, waiting);
    }, COOLDOWN_MS);
    entry.timer.unref?.();
};

const queue = (entry: Entry, name: string) => {
    if (entry.timer) entry.pending.add(name);
    else write(entry, [name]);
};

const validName = (name: string) => {
    if (typeof name === 'string' && NAME.test(name)) return true;
    console.warn(`[user_stream] event name refused (must match ${NAME}): ${JSON.stringify(String(name)).slice(0, 60)}`);
    return false;
};

/** Tells every open stream of this user that `name` changed. Never throws, never waits. */
export const notifyUser = (ownerId: string | null | undefined, name: string): void => {
    if (!ownerId || !validName(name)) return;
    for (const entry of [...(byOwner.get(ownerId) ?? [])]) queue(entry, name);
};

/** Tells every open stream (data every signed-in user may read, e.g. the system figures). */
export const notifyAll = (name: string): void => {
    if (!validName(name)) return;
    for (const set of [...byOwner.values()]) for (const entry of [...set]) queue(entry, name);
};

/**
 * Registers an open stream. At most `maxPerUser` per user: the oldest is closed when a new one would exceed it, so
 * stale tabs can't lock a user out. Returns the function that unregisters it (on close).
 */
export const registerStream = (conn: StreamConnection, maxPerUser: number): (() => void) => {
    const set = byOwner.get(conn.ownerId) ?? new Set<Entry>();
    byOwner.set(conn.ownerId, set);
    const entry: Entry = { conn, pending: new Set(), timer: null, openedAt: Date.now() };
    set.add(entry);
    const oldestFirst = [...set].sort((a, b) => a.openedAt - b.openedAt);
    for (const old of oldestFirst.slice(0, Math.max(0, set.size - Math.max(1, maxPerUser)))) {
        drop(old);
        try { old.conn.close(); } catch { /* already gone */ }
    }
    return () => drop(entry);
};

/** Closes every open stream of a user (sign-out, account deleted). */
export const closeUserStreams = (ownerId: string | null | undefined): void => {
    if (!ownerId) return;
    for (const entry of [...(byOwner.get(ownerId) ?? [])]) {
        drop(entry);
        try { entry.conn.close(); } catch { /* already gone */ }
    }
};

/** Open streams, of one user or of all (tests, status). */
export const openStreamCount = (ownerId?: string): number =>
    ownerId ? (byOwner.get(ownerId)?.size ?? 0) : [...byOwner.values()].reduce((n, set) => n + set.size, 0);
