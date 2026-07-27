import { getService } from '#bs/services/core/role';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Get role detail by ID.',
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
  await checkRoutePermissions(event, ['role.crud.read']);

  const service = getService();
  const id = getRouterParam(event, 'id') || '';

  return {
    data: await service.read(id),
    statusMessage: 'success role.read.success',
  };
});
