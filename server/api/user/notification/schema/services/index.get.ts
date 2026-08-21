import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get notification service names grouped by provider.',
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
  const notificationService = await getService(event);
  const allSchemas = await notificationService.getSchemas();
  const result: Record<string, string[]> = {};

  for (const [provider, schemas] of Object.entries(allSchemas)) {
    if (Array.isArray(schemas)) {
      result[provider] = schemas
        .map((s: any) => s?.service_name)
        .filter(Boolean);
    } else {
      result[provider] = [];
    }
  }

  return result;
});
