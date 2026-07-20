import { getService } from '#bs/services/core/account';
import { permissionsByRoles } from '#bs/utils/permissions_by_roles';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user, password } = body;

  const accountService = getService();
  const account = await accountService.authenticate(user, password);

  // Resolve role names into concrete permission strings
  const permissions = await permissionsByRoles(account.roles);

  // Set session
  await setUserSession(event, {
    user: {
      id: account.id,
      user: account.user,
      roles: account.roles,
      permissions,
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
