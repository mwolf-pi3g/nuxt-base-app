import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Delete multiple accounts by IDs.',
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Missing IDs'
      },
      403: {
        description: 'Not authorized'
      }
    }
  }
});

export default defineEventHandler(async (event) => {
  await checkRoutePermissions(event, ['account.crud.delete']);
  const body = await readBody(event).catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  if (!ids || ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'error account.missing_ids' });
  }

  const service = await getService();
  const deleted = await service.deleteMany(ids);

  return {
    deleted: Array.isArray(deleted) ? deleted.length : ids.length,
    statusMessage: 'success account.delete_many.success',
  };
});
