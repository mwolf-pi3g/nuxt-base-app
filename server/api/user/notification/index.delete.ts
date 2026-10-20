import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Delete multiple notification channels by IDs.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing IDs'
      },
      403: {
        description: 'Forbidden'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  const service = await getService(event);
  const body = await readBody(event).catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  if (!ids || ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'error notification_channel.missing_ids' });
  }

  const deleted = await service.deleteMany(ids);

  return {
    deleted: Array.isArray(deleted) ? deleted.length : ids.length,
    statusMessage: 'success notification_channel.delete_many.success',
  };
});
