import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Create an API token for the logged-in user. The response holds the token; it is shown only this once.',
    responses: {
      200: { description: 'Success response' },
      403: { description: 'Not logged in, or called with an API token' },
      422: { description: 'Invalid description, or too many tokens' }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  const userId = session.user?.id;
  if (!userId) {
    throw createError({ statusCode: 403, statusMessage: 'error account.update.not_logged_in' });
  }

  const { description } = await readBody(event) ?? {};
  const accountService = await getService(event);
  return {
    data: await accountService.addToken(userId, { description }),
    statusMessage: 'success api_tokens.create.success',
  };
});
