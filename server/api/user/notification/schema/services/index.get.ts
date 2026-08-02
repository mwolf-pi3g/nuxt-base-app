defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get list of all notification service names.',
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
  const schemasObj = await $fetch<any>('/api/user/notification/schema', {
    headers: getHeaders(event),
  });
  const schemas = schemasObj?.schemas || [];
  return schemas.map((s: any) => s.service_name);
});
