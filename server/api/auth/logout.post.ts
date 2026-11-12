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
  // Live update streams end with the sign-out (the user's other devices reconnect with their own sessions)
  closeUserStreams((await getUserSession(event)).user?.id);
  await clearUserSession(event);
  return {
    statusMessage: 'success auth.logout.success',
  };
});
