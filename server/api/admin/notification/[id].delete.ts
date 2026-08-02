import { getAdminService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Delete a notification channel by ID (admin).',
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
  await checkRoutePermissions(event, ['notification.crud.delete']);
  const id = getRouterParam(event, 'id') || '';
  const service = getAdminService();
  await service.delete(id);

  return {
    statusMessage: 'success notification_channel.delete.success',
  };
});
