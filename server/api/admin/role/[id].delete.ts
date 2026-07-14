import { getService } from '#bs/services/core/role';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';
  const service = getService();
  await service.delete(id);

  return {
    statusMessage: 'success role.delete.success',
  };
});
