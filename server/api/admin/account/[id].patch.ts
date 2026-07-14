import { getService } from '#bs/services/core/account';

export default defineEventHandler(async (event) => {
  const service = getService();
  const id = getRouterParam(event, 'id') || '';

  const body = await readBody(event);

  return {
    data: await service.update(id, body),
    statusMessage: 'success account.update.success',
  };
});
