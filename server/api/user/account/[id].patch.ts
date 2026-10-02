import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Update logged-in user account.',
    responses: {
      200: {
        description: 'Success response'
      },
      403: {
        description: 'Not authorized'
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

  const { user, lang, cron_active } = await readBody(event);
  const accountService = await getService(event);
  const updatePayload: Record<string, any> = { user, lang };
  if (cron_active !== undefined) {
    updatePayload.cron_active = cron_active;
  }
  const updated = await accountService.update(userId, updatePayload);

  return {
    data: updated,
    statusMessage: 'success account.update.success',
  };
});
