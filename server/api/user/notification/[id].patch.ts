import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Update notification channel by ID.',
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
  const id = getRouterParam(event, 'id') || '';

  const body = await readBody(event);

  return {
    data: await service.update(id, body),
    statusMessage: 'success notification_channel.update.success',
  };
}); 