import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Create a new account.',
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
  await checkRoutePermissions(event, ['account.crud.create']);

  const service = await getService();

  const body = await readBody(event);

  return {
    data: await service.create(body),
    statusMessage: 'success account.create.success',
  };
});
