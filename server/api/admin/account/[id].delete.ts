import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Delete account by ID.',
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
  await checkRoutePermissions(event, ['account.crud.delete']);

  const id = getRouterParam(event, 'id') || '';
  const service = getService();
  await service.delete(id);

  return {
    statusMessage: 'success account.delete.success',
  };
});
