import { getService } from '#bs/services/core/notification';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get notification schema details for a specific provider and service.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing provider or service name'
      },
      403: {
        description: 'Not authorized'
      },
      404: {
        description: 'Service schema not found'
      },
      500: {
        description: 'Notification service error'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider');
  const service = getRouterParam(event, 'service');

  if (!provider || !service) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error notification.schema.missing_param',
    });
  }

  const notificationService = await getService(event);
  const allSchemas = await notificationService.getSchemas();

  const providerSchemas = allSchemas[provider.toLowerCase()];
  if (!providerSchemas || !Array.isArray(providerSchemas)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'error notification.schema.provider_not_found',
    });
  }

  const found = providerSchemas.find((item: any) => item && item.service_name === service);

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'error notification.schema.not_found',
    });
  }

  return found;
});
