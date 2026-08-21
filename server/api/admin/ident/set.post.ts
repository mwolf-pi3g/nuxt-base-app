import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Impersonate another user account.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing ID'
      },
      403: {
        description: 'Not authorized'
      },
      404: {
        description: 'Account not found'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  // 1. Verify user permissions
  await checkRoutePermissions(event, ['identity.set']);

  // 2. Parse request body and check for ID
  const body = await readBody(event);
  const { id } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'error identity.set.missing_id',
    });
  }

  // 3. Verify that the account exists
  const accountService = await getService();
  let account;
  try {
    account = await accountService.read(id);
  } catch (error) {
    // If db wrapper/service fails or throws an error
  }

  if (!account) {
    throw createError({
      statusCode: 404,
      statusMessage: 'error identity.set.missing_account',
    });
  }

  // 4. Update the session
  const session = await getUserSession(event);

  // Destructure to avoid saving session ID inside the session data
  const { id: _, ...sessionData } = session;
  const newSession = {
    ...sessionData,
    secure: {
      ...sessionData.secure,
      as_id: id,
    },
  };
  await replaceUserSession(event, newSession);

  return {
    statusMessage: 'success identity.set.success',
  };
});
