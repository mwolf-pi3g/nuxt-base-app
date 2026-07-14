import { getService } from '#bs/services/core/role';

export default defineEventHandler(async (event) => {
  const service = getService();
  const id = getRouterParam(event, 'id') || '';

  return {
    data: await service.read(id),
    statusMessage: 'success role.read.success',
  };
});
