import { getService } from '#bs/services/core/account';

export default defineEventHandler(async (event) => {
  const service = getService();

  return {
    data: await service.read(),
    statusMessage: 'success account.read.success',
  };
});
