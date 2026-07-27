defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Get permission detail by key/id.',
    responses: {
      200: {
        description: 'Success response'
      },
      404: {
        description: 'Permissions not found'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '';

  const allPerms = (globalThis as any).permissions || [];
  const data = allPerms.filter((p: string) => p === id || p.startsWith(id + ':'));

  if (data.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'error permissions.read.not_found',
    });
  }

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});
