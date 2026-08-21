defineRouteMeta({
  openAPI: {
    tags: ['User Permissions'],
    description: 'Get all permissions.',
    responses: {
      200: {
        description: 'Success response'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const raw = (globalThis as any).permissions || [];
  const data = ['*', ...raw.filter((p: string) => p !== '*')];

  return {
    data,
    statusMessage: 'success permissions.read.success',
  };
});
