import { getPermissions } from '#bs/utils/perms';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';

  const data = getPermissions(id);

  if (data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Permissions not found',
    });
  }

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});
