import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: "List an account's API tokens (description and dates).",
    responses: {
      200: { description: 'Success response' },
      403: { description: 'Not authorized' },
      404: { description: 'Account not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkRoutePermissions(event, ['account.crud.read']);

  const service = await getService();
  return {
    data: await service.listTokens(getRouterParam(event, 'id') || ''),
    statusMessage: 'success api_tokens.read.success',
  };
});
