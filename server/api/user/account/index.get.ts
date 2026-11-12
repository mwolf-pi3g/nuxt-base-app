import { db } from 'hub:db';
import { inArray } from 'drizzle-orm';
import { roles as rolesTable } from '#bs/db/schema';
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
  const session = await getAuthSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error account.read.not_logged_in',
    });
  }

  const accountService = await getService(event);
  const { id, user, lang, roles, cron_active } = await accountService.read(userId);
  // The names of the user's own roles, for display (the role list itself is an admin route)
  const roleIds: string[] = Array.isArray(roles) ? roles : [];
  const role_names = roleIds.length === 0 ? [] : (await db.select({ name: rolesTable.name }).from(rolesTable)
    .where(inArray(rolesTable.id, roleIds))).map((r) => r.name).sort();

  return {
    data: [{ id, user, lang, roles, role_names, cron_active }],
    statusMessage: 'success account.read.success',
  };
});
