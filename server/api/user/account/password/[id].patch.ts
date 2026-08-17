import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Update logged-in user password.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing password'
      },
      403: {
        description: 'Not logged in'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error account.update.not_logged_in',
    });
  }

  const body = await readBody(event);
  const { password } = body;

  if (!password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error account.update.missing_account',
    });
  }

  const accountService = getService();
  await accountService.update(userId, { password });

  return {
    statusMessage: 'success account.update.success',
  };
});
