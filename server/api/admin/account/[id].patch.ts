import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Update account by ID.',
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
  await checkRoutePermissions(event, ['account.crud.update']);

  const service = getService();
  const id = getRouterParam(event, 'id') || '';

  const body = await readBody(event);
  delete body.password;

  return {
    data: await service.update(id, body),
    statusMessage: 'success account.update.success',
  };
});
