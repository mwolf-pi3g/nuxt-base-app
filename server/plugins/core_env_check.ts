import { checkEnv } from '#bs/utils/check_env';

// Runs before anything else of the base layer needs these; a missing required variable stops startup.
export default defineNitroPlugin(() => {
  checkEnv('base', ['NUXT_SESSION_PASSWORD'], {
    APPRISE_URL: 'Apprise notification channels',
  });
});
