import { getService } from '#bs/services/core/role';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Delete multiple roles by IDs.',
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
  await checkRoutePermissions(event, ['role.crud.delete']);
  const body = await readBody(event).catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  if (!ids || ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'error role.missing_ids' });
  }

  const service = await getService();
  const deleted = await service.deleteMany(ids);

  return {
    deleted: Array.isArray(deleted) ? deleted.length : ids.length,
    statusMessage: 'success role.delete_many.success',
  };
});
