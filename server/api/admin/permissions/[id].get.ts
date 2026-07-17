import permissionsJson from '#bs/metadata/permissions.json';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';

  const rubricActions = (permissionsJson as Record<string, string[]>)[id];

  if (!rubricActions) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Permissions not found',
    });
  }

  const data = rubricActions.map((action) => `${id}.${action}`);

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});
