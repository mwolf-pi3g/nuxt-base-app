import { getService } from '#bs/services/core/account';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user, password } = body;

  const accountService = getService();
  const account = await accountService.authenticate(user, password);

  // Set session
  await setUserSession(event, {
    user: {
      id: account.id,
      user: account.user,
      roles: account.roles,
      limits: account.limits,
      lang: account.lang,
      email: account.email
    },
    loggedInAt: new Date().toISOString()
  });

  return {
    statusMessage: 'success auth.login.success',
  };
});
