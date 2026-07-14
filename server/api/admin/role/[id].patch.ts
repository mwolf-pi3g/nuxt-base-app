import { getService } from '#bs/services/core/role';

export default defineEventHandler(async (event) => {
  const service = getService();
  const id = getRouterParam(event, 'id') || '';

  const body = await readBody(event);

  return {
    data: await service.update(id, body),
    statusMessage: 'success role.update.success',
  };
});
