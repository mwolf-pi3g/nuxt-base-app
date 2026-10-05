import { notificationProviderRegistry } from '#bs/utils/notifications_provider_registry';
import { Local } from '#bs/services/core/notification_local';
import { Apprise } from '#bs/services/core/notification_apprise';

export default defineNitroPlugin((_nitroApp) => {
  notificationProviderRegistry.registerProvider('local', Local);
  notificationProviderRegistry.registerProvider('apprise', Apprise);
});
