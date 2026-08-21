import { getService } from '#bs/services/core/role';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Get all roles.',
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

  const service = await getService();

  return {
    data: await service.read(),
    statusMessage: 'success role.read.success',
  };
});
