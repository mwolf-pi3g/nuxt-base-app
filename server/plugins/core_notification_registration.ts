import { getServiceNoAuth as notificationService } from '#bs/services/core/notification';
import { Apprise } from '#bs/services/core/notification_apprise';

export default defineNitroPlugin((_nitroApp) => {
  notificationService.registerProvider('apprise', Apprise);
});
