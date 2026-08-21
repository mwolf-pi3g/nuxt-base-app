import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Create a new notification channel (admin).',
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
  await checkRoutePermissions(event, ['notification.crud.create']);
  const service = await getService({ isAdmin: true });

  const body = await readBody(event);

  return {
    data: await service.create(body),
    statusMessage: 'success notification_channel.create.success',
  };
});
