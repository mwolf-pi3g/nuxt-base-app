import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['App Notification Channel'],
    description: 'Retrieve all notification channels (admin).',
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
  const service = await getService({ isAdmin: true });

  return {
    data: await service.read(),
    statusMessage: 'success notification_channel.read.success',
  };
});
