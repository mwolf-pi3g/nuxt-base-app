import { getServiceNoAuth } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get notification schema details from all registered providers.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Not authorized'
      },
      500: {
        description: 'Notification service error'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  try {
    const notificationService = await getServiceNoAuth();
    return await notificationService.getSchemas();
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'error notification.schema.failed',
    });
  }
});
