import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'List the API tokens of the logged-in user (description and dates; the tokens themselves are not stored).',
    responses: {
      200: { description: 'Success response' },
      403: { description: 'Not logged in, or called with an API token' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  const userId = session.user?.id;
  if (!userId) {
    throw createError({ statusCode: 403, statusMessage: 'error account.read.not_logged_in' });
  }

  const accountService = await getService(event);
  return {
    data: await accountService.listTokens(userId),
    statusMessage: 'success api_tokens.read.success',
  };
});
