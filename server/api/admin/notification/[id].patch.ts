import { getAdminService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Update a notification channel by ID (admin).',
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
  await checkRoutePermissions(event, ['notification.crud.update']);
  const service = getAdminService();
  const id = getRouterParam(event, 'id') || '';

  const body = await readBody(event);

  return {
    data: await service.update(id, body),
    statusMessage: 'success notification_channel.update.success',
  };
});
