import { getAdminService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Retrieve a notification channel by ID (admin).',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Forbidden - Missing required permissions'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  await checkRoutePermissions(event, ['notification.crud.read']);
  const service = getAdminService();
  const id = getRouterParam(event, 'id') || '';

  return {
    data: await service.read(id),
    statusMessage: 'success notification_channel.read.success',
  };
});
