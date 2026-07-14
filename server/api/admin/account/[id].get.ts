import { getService } from '#bs/services/core/account';

export default defineEventHandler(async (event) => {
  const service = getService();
  const id = getRouterParam(event, 'id') || '';

  return {
    data: await service.read(id),
    statusMessage: 'success account.read.success',
  };
});
