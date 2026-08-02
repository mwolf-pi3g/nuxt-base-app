import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Create a new notification channel.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Forbidden'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  const service = await getService(event);

  const body = await readBody(event);

  return {
    data: await service.create(body),
    statusMessage: 'success notification_channel.create.success',
  };
});
