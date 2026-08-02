defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get Apprise notification schema details for a specific service.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing service name'
      },
      403: {
        description: 'Not authorized'
      },
      404: {
        description: 'Service schema not found'
      },
      500: {
        description: 'Apprise service error'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const service = getRouterParam(event, 'service');
  if (!service) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error notification.schema.missing_service',
    });
  }

  const schemasObj = await $fetch<any>('/api/user/notification/schema', {
    headers: getHeaders(event),
  });
  const schemas = schemasObj?.schemas || [];
  const found = schemas.find((item: any) => item && item.service_name === service);

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'error notification.schema.not_found',
    });
  }

  return found;
});
