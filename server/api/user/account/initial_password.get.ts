import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base User'],
    description: 'Whether the logged-in account still signs in with ADMIN_PASSWORD (it has no password of its own yet).',
    responses: {
      200: {
        description: 'Success response'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  const accountService = await getService();
  return {
    active: await accountService.usesInitialPassword(session.user?.user || ''),
  };
});
