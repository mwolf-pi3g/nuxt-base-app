import { db } from "hub:db";
import { roles } from "hub:db:schema";
import { zod_rules } from "#bs/../shared/rules/role";
import { genericService } from "#bs/services/generic";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import app_defaults from "#server/metadata/app_defaults.json";
import { getService as getAccountService } from "#bs/services/core/account";

class roleService extends genericService {
    async init() {

        const userRole = await dbFindAll(db, roles, { name: 'user' });
        const adminRole = await dbFindAll(db, roles, { name: 'admin' });

        if (userRole.length === 0) {
            await this.create({ name: 'user', permissions: app_defaults.roles.user });
        }

        if (adminRole.length === 0) {
            await this.create({ name: 'admin', permissions: app_defaults.roles.admin });
        }
    }

    verifyPermission(body: any) {
        if (body && body.permissions !== undefined && body.permissions !== null) {
            if (!Array.isArray(body.permissions) || !body.permissions.every((p: any) => typeof p === 'string')) {
                throw createError({
                    status: 400,
                    statusMessage: 'error roles.permissions.invalid_type'
                });
            }
            const allowed = (globalThis as any).permissions || [];
            const allAllowed = body.permissions.every((p: string) => p === '*' || allowed.includes(p));
            if (!allAllowed) {
                throw createError({
                    status: 400,
                    statusMessage: 'error roles.permissions.invalid_permission'
                });
            }
        }
    }

    async create(body: any) {
        this.verifyPermission(body)
        await super.create(body);
    }

    async update(id: string, body: any) {
        this.verifyPermission(body);
        return await super.update(id, body);
    }

    async delete(id: string) {
        const result = await super.delete(id);
        const accountService = await getAccountService();
        await accountService.deleteRoles([id]);
        return result;
    }
}

export const getService = async (ctx?: any) => {
    const ownerId = await resolveServiceContext(ctx);
    return new roleService(db, roles, zod_rules, ownerId);
}
