import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Send a test notification through a (possibly unsaved) channel. Details go to the event log.',
    responses: {
      200: {
        description: '{ ok: boolean }'
      },
      403: {
        description: 'Not logged in'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  if (!session.user?.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error auth.not_authenticated',
    });
  }

  const service = await getService(event);
  return service.testChannel(await readBody(event).catch(() => ({})));
});
