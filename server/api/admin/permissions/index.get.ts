defineRouteMeta({
  openAPI: {
    tags: ['Base Admin'],
    description: 'Get all permissions.',
    responses: {
      200: {
        description: 'Success response'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const data = (globalThis as any).permissions || [];

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});
