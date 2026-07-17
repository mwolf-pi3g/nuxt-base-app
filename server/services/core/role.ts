import { db } from "hub:db";
import { roles } from "hub:db:schema";
import { zod_rules } from "#shared/rules/role";
import { genericService } from "#bs/services/generic";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";

class roleService extends genericService {
    async init() {

        const userRole = await dbFindAll(db, roles, { name: 'user' });
        const adminRole = await dbFindAll(db, roles, { name: 'admin' });

        if (userRole.length === 0) {
            await this.create({ name: 'user', tags: ['user'] });
        }

        if (adminRole.length === 0) {
            await this.create({ name: 'admin', tags: ['admin', 'user'] });
        }
    }
}

export const getService = () => {
    return new roleService(db, roles, zod_rules);
}
