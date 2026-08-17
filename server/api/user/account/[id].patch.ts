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

  const { user, lang } = await readBody(event);
  const accountService = getService(userId);
  const updated = await accountService.update(userId, { user, lang });

  return {
    data: updated,
    statusMessage: 'success account.update.success',
  };
});
