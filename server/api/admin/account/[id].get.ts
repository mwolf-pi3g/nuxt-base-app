import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Get account detail by ID.',
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
  await checkRoutePermissions(event, ['account.crud.read']);

  const service = await getService();
  const id = getRouterParam(event, 'id') || '';

  return {
    data: await service.read(id),
    statusMessage: 'success account.read.success',
  };
});
