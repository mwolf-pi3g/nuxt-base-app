import { getTableName } from "drizzle-orm";
import { dbFindOne } from "#bs/db/wrappers/db_find_one";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import { dbSearch } from "#bs/db/wrappers/db_search";
import { dbCreate } from "#bs/db/wrappers/db_create";
import { dbFindOneAndUpdate } from "#bs/db/wrappers/db_find_one_and_update";
import { dbFindOneAndDelete } from "#bs/db/wrappers/db_find_one_and_delete";
import { accounts } from "hub:db:schema";
import appDefaults from "#server/metadata/app_defaults.json";

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
        if (this.user_id && this.table && 'owner_id' in this.table) {
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
                console.log(`validation error: ${key}`, result.error);
                throw createError({ status: 422, statusMessage: `error ${this.table_name}.bad_payload` });
            }
        }
        return true;
    }

    async prepopulate() {
        if (!this.user_id) return;

        const exampleContent = appDefaults?.example_content;
        if (!exampleContent) return;

        const tableKey = this.table_name;
        const contentForTable = (exampleContent as any)[tableKey];
        if (!contentForTable) return;

        let userLang = 'en';
        try {
            const account = await dbFindOne(this.db, accounts, { id: this.user_id });
            if (account && account.lang) {
                userLang = account.lang;
            }
        } catch (e) {
            console.error("Failed to retrieve user language preference", e);
        }

        let itemsToCopy = contentForTable[userLang];
        if (!itemsToCopy && userLang !== 'en') {
            itemsToCopy = contentForTable['en'];
        }

        if (itemsToCopy && Array.isArray(itemsToCopy)) {
            for (const item of itemsToCopy) {
                await this.create({ ...item });
            }
        }
    }

    async read(id?: string) {
        try {
            if (id) {
                const searchSpec = this.addOwner({ id });
                return await dbFindOne(this.db, this.table, searchSpec);
            }
            const searchSpec = this.addOwner({});
            let results = await dbFindAll(this.db, this.table, searchSpec);
            if (results.length === 0) {
                await this.prepopulate();
                results = await dbFindAll(this.db, this.table, searchSpec);
            }
            return results;
        } catch (e) {
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.read_failed`
            });
        }
    }

    async search(searchSpec: any = {}, options: any = {}) {
        let spec: Record<string, any>;
        if (Array.isArray(searchSpec)) {
            spec = { id: searchSpec };
        } else if (typeof searchSpec === "object" && searchSpec !== null) {
            spec = { ...searchSpec };
        } else if (typeof searchSpec === "string") {
            spec = { id: searchSpec };
        } else {
            spec = {};
        }
        if (this.user_id && this.table && "owner_id" in this.table) {
            spec.owner_id = this.user_id;
        }
        if (options?.user_id && this.table && "owner_id" in this.table) {
            spec.owner_id = options.user_id;
        }
        if (options?.userId && this.table && "owner_id" in this.table) {
            spec.owner_id = options.userId;
        }

        try {
            return await dbSearch(this.db, this.table, spec, options);
        } catch (e: any) {
            if (e.statusCode || e.status) {
                throw e;
            }
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.search_failed`
            });
        }
    }


    async create(body: any, hooks?: any) {
        const payload = this.addOwner({ ...body });

        this.validate(payload);

        if (hooks?.postValidate) {
            for (const key of Object.keys(hooks.postValidate)) {
                payload[key] = await hooks.postValidate[key](payload[key]);
            }
        }
        console.log("after hooks: ", payload, this.user_id);

        try {
            return await dbCreate(this.db, this.table, payload);
        } catch (e) {
            throw createError({
                status: 500,
                statusMessage: `error ${this.table_name}.create_failed`
            });
        }
    }

    async update(id: string, body: any, hooks?: any) {
        const payload = this.addOwner({ ...body });
        this.validate(payload, 'update');

        if (hooks?.postValidate) {
            for (const key of Object.keys(hooks.postValidate)) {
                if (payload[key]) {
                    payload[key] = await hooks.postValidate[key](payload[key]);
                }
            }
        }

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

    async export(
        stripFields: string[] = ['id', 'owner_id', 'createdAt', 'updatedAt'],
        transformFields: string[] = [],
        id?: string,
        transformMap?: Record<string, { exportKey?: string; fn: (val: any, record: any) => Promise<any> | any }>
    ) {
        const rawData = await this.read(id);
        if (!rawData) return null;

        const isSingle = !Array.isArray(rawData);
        const items: any[] = isSingle ? [rawData] : rawData;

        const exportedData = await Promise.all(items.map(async (item: any) => {
            const result = { ...item };

            for (const field of stripFields) {
                delete result[field];
            }

            for (const field of transformFields) {
                if (transformMap && transformMap[field]) {
                    const { exportKey, fn } = transformMap[field];
                    const transformedVal = await fn(result[field], item);
                    const targetKey = exportKey || field;
                    if (exportKey && exportKey !== field) {
                        delete result[field];
                    }
                    result[targetKey] = transformedVal;
                }
            }

            return result;
        }));

        return {
            version: CURRENT_API_VERSION,
            table: this.table_name,
            timestamp: new Date().toISOString(),
            data: isSingle ? exportedData[0] : exportedData
        };
    }

    async import(
        payload: any,
        transformFields: string[] = [],
        transformMap?: Record<string, { importKey?: string; fn: (val: any, record: any) => Promise<any> | any }>
    ) {
        if (!payload) {
            throw createError({
                status: 400,
                statusMessage: `error ${this.table_name}.import_empty`
            });
        }

        let rawItems: any[];
        let payloadVersion = CURRENT_API_VERSION;

        if (typeof payload === 'object' && payload !== null && 'version' in payload && 'data' in payload) {
            payloadVersion = payload.version;
            if (payloadVersion !== CURRENT_API_VERSION) {
                throw createError({
                    status: 400,
                    statusMessage: `error ${this.table_name}.unsupported_version:${payloadVersion}`
                });
            }
            rawItems = Array.isArray(payload.data) ? payload.data : [payload.data];
        } else {
            rawItems = Array.isArray(payload) ? payload : [payload];
        }

        const isSingleInput = typeof payload === 'object' && payload !== null && 'version' in payload
            ? !Array.isArray(payload.data)
            : !Array.isArray(payload);

        const importedResults = await Promise.all(rawItems.map(async (item: any) => {
            const record = { ...item };

            delete record.id;
            delete record.owner_id;
            delete record.createdAt;
            delete record.updatedAt;

            for (const field of transformFields) {
                if (transformMap && transformMap[field]) {
                    const { importKey, fn } = transformMap[field];
                    const sourceKey = importKey || field;
                    const sourceVal = record[sourceKey];
                    const resolvedVal = await fn(sourceVal, record);
                    record[field] = resolvedVal;
                    if (importKey && importKey !== field) {
                        delete record[sourceKey];
                    }
                }
            }

            return await this.create(record);
        }));

        return isSingleInput ? importedResults[0] : importedResults;
    }
}
export const CURRENT_API_VERSION = "v0.1";

