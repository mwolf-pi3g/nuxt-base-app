import { getService as getRoleService } from '#bs/services/core/role';
import { getService as getAccountService } from '#bs/services/core/account';

export default defineNitroPlugin(async (_nitroApp) => {
  try {
    // Create the initial admin structure with specific overrides
    const roleService = getRoleService();
    await roleService.init();

    const accountService = getAccountService();
    await accountService.init();

  } catch (e: any) {
    // untranslated
    if (isError(e) && e.statusMessage) {
      const msg = e.statusMessage.split(" ")
      console.error(msg[1] || msg)
    } else {
      console.error(e)
    }
  }
});
