import { getPermissions } from '#bs/utils/perms'

export default defineEventHandler(async (event) => {
  const data = getPermissions();

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});

