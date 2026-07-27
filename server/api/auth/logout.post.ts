defineRouteMeta({
  openAPI: {
    tags: ['Base Auth'],
    description: 'Clear active user session.',
    responses: {
      200: {
        description: 'Success response'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  await clearUserSession(event);
  return {
    statusMessage: 'success auth.logout.success',
  };
});
