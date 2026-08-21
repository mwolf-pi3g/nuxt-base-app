import { getService as getRoleService } from '#bs/services/core/role';
import { getService as getAccountService } from '#bs/services/core/account';
import { getPermissions } from '#bs/utils/perms';

export default defineNitroPlugin(async (_nitroApp) => {
  try {
    // Check if permissions global state is set, if not initialize it
    if (!(globalThis as any).permissions) {
      (globalThis as any).permissions = ['*', ...getPermissions()];
    }

    // Create the initial admin structure with specific overrides
    const roleService = await getRoleService();
    await roleService.init();

    const accountService = await getAccountService();
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
