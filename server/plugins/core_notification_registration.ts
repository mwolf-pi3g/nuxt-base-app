import { notificationProviderRegistry } from '#bs/utils/notifications_provider_registry';
import { Apprise } from '#bs/services/core/notification_apprise';

export default defineNitroPlugin((_nitroApp) => {
  notificationProviderRegistry.registerProvider('apprise', Apprise);
});
