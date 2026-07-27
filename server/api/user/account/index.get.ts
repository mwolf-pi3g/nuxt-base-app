import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Get logged-in user account details.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Not logged in'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const userId = session.secure?.as_id || session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error account.read.not_logged_in',
    });
  }

  const accountService = getService();
  const { id, user, email, lang, roles, limits, validated } = await accountService.read(userId);

  return {
    data: [{ id, user, email, lang, roles, limits, validated }],
    statusMessage: 'success account.read.success',
  };
});
