import { getService } from '#bs/services/core/account';

export default defineEventHandler(async (event) => {
  const service = getService();

  const body = await readBody(event);

  return {
    data: await service.create(body),
    statusMessage: 'success account.create.success',
  };
});
