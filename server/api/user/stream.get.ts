import { db } from 'hub:db';
import { eq } from 'drizzle-orm';
import { accounts } from '#bs/db/schema';

defineRouteMeta({
  openAPI: {
    tags: ['User Events'],
    description: 'Live updates (server-sent events) for the signed-in user: each message is an event name only (data: <name>), never data. Session cookie only; API tokens are refused.',
    responses: {
      200: { description: 'text/event-stream' },
      401: { description: 'Not signed in' },
      403: { description: 'API tokens cannot open a stream' },
    },
  },
});

const PING_MS = 25_000;

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  if (session.via_token) {
    throw createError({ statusCode: 403, statusMessage: 'error user_stream.token_not_allowed' });
  }
  // The owner comes from the session only (an admin impersonating a user gets that user's stream, like /api/user/*)
  const ownerId: string | undefined = session.user?.id;
  if (!ownerId) {
    throw createError({ statusCode: 401, statusMessage: 'error user_stream.not_logged_in' });
  }

  const req = event.node.req;
  const res = event.node.res;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',              // nginx: don't buffer
  });
  res.write('retry: 5000\n\n');

  let closed = false;
  const unregister = registerStream({
    ownerId,
    write: (chunk) => {
      if (closed || res.writableEnded) throw new Error('stream closed');
      res.write(chunk);
    },
    close: () => { if (!res.writableEnded) res.end(); },
  }, Number(appLimits().stream?.max_per_user ?? 10));

  // Keeps proxies from closing an idle connection, finds dead ones, and ends the stream of a deleted account
  const ping = setInterval(async () => {
    try {
      const account = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, ownerId)).get();
      if (!account) { res.end(); return; }
      res.write(': ping\n\n');
    } catch {
      res.end();
    }
  }, PING_MS);

  await new Promise<void>((resolve) => {
    req.on('close', resolve);
    res.on('close', resolve);
    res.on('finish', resolve);
  });
  closed = true;
  clearInterval(ping);
  unregister();
});
