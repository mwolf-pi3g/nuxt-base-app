import { getTableName } from "drizzle-orm";
import { dbFindOne } from "#bs/db/wrappers/db_find_one";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import { dbCreate } from "#bs/db/wrappers/db_create";
import { dbFindOneAndUpdate } from "#bs/db/wrappers/db_find_one_and_update";
import { dbFindOneAndDelete } from "#bs/db/wrappers/db_find_one_and_delete";

export class genericService {
    db: any;
    table: any;
    table_name: string;
    zod_rules: any;
    user_id: string | undefined;

    constructor(db: any, table: any, zod_rules: any, user_id?: string) {
        this.db = db;
        this.table = table;
        this.zod_rules = zod_rules;
        this.table_name = getTableName(table);
        this.user_id = user_id;
    }

    test(obj: Record<string, unknown>) {
        for (const key in obj) {
            if (obj[key] === null) {
                throw createError({
                    status: 400,
                    statusMessage: `error ${this.table_name}.${key}.missing`
                });
            }
        }
    }

    // All user routes need to pass the constructor a user_id
    addOwner(searchSpec: any) {
        if (this.user_id) {
            searchSpec.owner_id = this.user_id;
        }
        return searchSpec;
    }

    validate(val: any, mode: 'create' | 'update' = 'create'): true | string {
        for (const key in this.zod_rules) {
            const rule = this.zod_rules[key as keyof typeof this.zod_rules];
            if (mode === 'update' && !val[key]) continue;
            const result = rule.safeParse(val[key]);
            if (!result.success) {
                console.log("validation error", result.error);
                throw createError({ status: 422, statusMessage: `error ${this.table_name}.bad_payload` });
            }
        }
        return true;
    }

    async read(id?: string) {
        try {
            if (id) {
                const searchSpec = this.addOwner({ id });
                return await dbFindOne(this.db, this.table, searchSpec);
            }
            const searchSpec = this.addOwner({});
            return await dbFindAll(this.db, this.table, searchSpec);
        } catch (e) {
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.read_failed`
            });
        }
    }

    async create(body: any) {
        const payload = this.addOwner({ ...body });
        this.validate(payload);
        try {
            return await dbCreate(this.db, this.table, payload);
        } catch (e) {
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.create_failed`
            });
        }
    }

    async update(id: string, body: any) {
        const payload = this.addOwner({ ...body });
        this.validate(payload, 'update');
        const searchSpec = this.addOwner({ id });
        try {
            return await dbFindOneAndUpdate(this.db, this.table, searchSpec, payload);
        } catch (e) {
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.update_failed`
            });
        }
    }

    async delete(id: string) {
        const searchSpec = this.addOwner({ id });
        try {
            return await dbFindOneAndDelete(this.db, this.table, searchSpec);
        } catch (e) {
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.delete_failed`
            });
        }
    }
}

