import { db } from 'hub:db';
import { userEvents } from '#bs/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

defineRouteMeta({
  openAPI: {
    tags: ['User Events'],
    description: 'Mark user event messages as read by ID or array of IDs.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing or invalid event IDs'
      },
      403: {
        description: 'Not logged in'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error user_events.update.not_logged_in',
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const rawIds = body?.ids ?? body?.id ?? body?.message_id ?? body?.messageId;

  let idList: string[] = [];
  if (Array.isArray(rawIds)) {
    idList = rawIds.filter((i: any) => typeof i === 'string' && i.trim().length > 0);
  } else if (typeof rawIds === 'string' && rawIds.trim().length > 0) {
    idList = [rawIds.trim()];
  }

  if (idList.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error user_events.id.required',
    });
  }

  const updated = await db
    .update(userEvents)
    .set({ read: 1 })
    .where(and(inArray(userEvents.id, idList), eq(userEvents.owner_id, userId)))
    .returning();

  return {
    data: updated,
    statusMessage: 'success user_events.update.success',
  };
});
