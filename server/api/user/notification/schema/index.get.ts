defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get Apprise notification schema details.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Not authorized'
      },
      500: {
        description: 'Apprise service error'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  try {
    return await getNotificationSchemas();
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'error notification.schema.failed',
    });
  }
});
