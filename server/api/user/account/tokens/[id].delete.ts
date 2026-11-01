import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Delete (revoke) an API token of the logged-in user.',
    responses: {
      200: { description: 'Success response' },
      403: { description: 'Not logged in, or called with an API token' },
      404: { description: 'Token not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  const userId = session.user?.id;
  if (!userId) {
    throw createError({ statusCode: 403, statusMessage: 'error account.update.not_logged_in' });
  }

  const accountService = await getService(event);
  await accountService.deleteToken(userId, getRouterParam(event, 'id') || '');
  return {
    statusMessage: 'success api_tokens.delete.success',
  };
});
