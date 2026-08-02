import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Delete notification channel by ID.',
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
  const id = getRouterParam(event, 'id') || '';
  const service = await getService(event);
  await service.delete(id);

  return {
    statusMessage: 'success notification_channel.delete.success',
  };
});
