import { db } from 'hub:db';
import { userEvents } from '#bs/db/schema';
import { eq, desc } from 'drizzle-orm';

defineRouteMeta({
  openAPI: {
    tags: ['User Events'],
    description: 'Get all event messages for the authenticated user.',
    responses: {
      200: {
        description: 'Success response'
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
      statusMessage: 'error user_events.read.not_logged_in',
    });
  }

  const events = await db
    .select()
    .from(userEvents)
    .where(eq(userEvents.owner_id, userId))
    .orderBy(desc(userEvents.createdAt));

  return {
    data: events,
    statusMessage: 'success user_events.read.success',
  };
});
