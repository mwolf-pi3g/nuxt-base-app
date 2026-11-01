import { getService } from '#bs/services/core/account';
import { checkRoutePermissions } from '#bs/utils/check_route_permissions';

defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: "Revoke one of an account's API tokens.",
    responses: {
      200: { description: 'Success response' },
      403: { description: 'Not authorized' },
      404: { description: 'Account or token not found' }
    }
  }
})

export default defineEventHandler(async (event) => {
  await checkRoutePermissions(event, ['account.crud.update']);

  const service = await getService();
  await service.deleteToken(getRouterParam(event, 'id') || '', getRouterParam(event, 'tokenId') || '');
  return {
    statusMessage: 'success api_tokens.delete.success',
  };
});
