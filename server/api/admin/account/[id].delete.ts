import { getService } from '#bs/services/core/account';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';
  const service = getService();
  await service.delete(id);

  return {
    statusMessage: 'success account.delete.success',
  };
});
