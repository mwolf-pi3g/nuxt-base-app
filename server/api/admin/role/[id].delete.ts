import { getService } from '#bs/services/core/role';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Delete role by ID.',
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
  await checkRoutePermissions(event, ['role.crud.delete']);

  const id = getRouterParam(event, 'id') || '';
  const service = getService();
  await service.delete(id);

  return {
    statusMessage: 'success role.delete.success',
  };
});
