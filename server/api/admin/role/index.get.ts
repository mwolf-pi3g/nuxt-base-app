import { getService } from '#bs/services/core/role';

export default defineEventHandler(async (event) => {
  const service = getService();

  return {
    data: await service.read(),
    statusMessage: 'success role.read.success',
  };
});
