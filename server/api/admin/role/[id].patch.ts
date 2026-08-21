import { getService } from '#bs/services/core/role';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Update role by ID.',
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
  await checkRoutePermissions(event, ['role.crud.update']);

  const service = await getService();
  const id = getRouterParam(event, 'id') || '';

  const body = await readBody(event);

  return {
    data: await service.update(id, body),
    statusMessage: 'success role.update.success',
  };
});
