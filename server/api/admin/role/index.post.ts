import { getService } from '#bs/services/core/role';

export default defineEventHandler(async (event) => {
  const service = getService();

  const body = await readBody(event);

  return {
    data: await service.create(body),
    statusMessage: 'success role.create.success',
  };
});
