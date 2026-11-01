import { isRegistrationEnabled } from '#bs/utils/registration';

defineRouteMeta({
  openAPI: {
    tags: ['Base Auth'],
    description: 'Report whether public registration is enabled.',
    responses: {
      200: {
        description: 'Success response'
      }
    }
  }
})

export default defineEventHandler(() => {
  return {
    enabled: isRegistrationEnabled(),
  };
});
