import { getService } from '#bs/services/core/account';

defineRouteMeta({
  openAPI: {
    tags: ['Base Auth'],
    description: 'Authenticate user and establish session.',
    responses: {
      200: {
        description: 'Success response'
      },
      401: {
        description: 'Invalid credentials'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user, password } = body;

  const accountService = await getService();
  const account = await accountService.authenticate(user, password);

  // Set session (the user object holds the permissions resolved from the roles)
  await setUserSession(event, {
    user: await accountService.sessionUser(account),
    loggedInAt: new Date().toISOString()
  });

  return {
    statusMessage: 'success auth.login.success',
  };
});
