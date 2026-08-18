import { db } from "hub:db";
import { notificationChannels } from "#bs/db/schema";
import { genericService } from "#bs/services/generic";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";

class notificationService extends genericService {
    providers: Record<string, any> = {};
    schemas: Record<string, any[]> | null = null;

    constructor(db: any, table: any, zod_rules: any, user_id?: string) {
        super(db, table, zod_rules, user_id);
        this.providers = {};
        this.schemas = null;
    }

    registerProvider(name: string, providerClass: any) {
        if (!name || !providerClass) return;
        this.providers[name.toLowerCase()] = providerClass;
    }

    async getSchemas(forceRefresh = false): Promise<Record<string, any[]>> {
        if (!forceRefresh && this.schemas) {
            return this.schemas;
        }

        const result: Record<string, any[]> = {};
        for (const [name, provider] of Object.entries(this.providers)) {
            if (provider && typeof provider.getSchemas === 'function') {
                result[name] = await provider.getSchemas();
            } else {
                result[name] = [];
            }
        }

        this.schemas = result;
        return this.schemas;
    }

    cleanConfigKeys(config: any, template: string) {
        if (!config || !template) return;

        const allowedKeys = new Set<string>(['template']);
        const matches = template.match(/\{([a-zA-Z0-9_-]+)\}/g);
        if (matches) {
            for (const match of matches) {
                allowedKeys.add(match.slice(1, -1));
            }
        }

        for (const key of Object.keys(config)) {
            if (!allowedKeys.has(key)) {
                delete config[key];
            }
        }
    }

    async create(body: any, hooks?: any) {
        if (body?.provider?.toLowerCase() === 'apprise' && body?.config?.template) {
            this.cleanConfigKeys(body.config, body.config.template);
        }
        return super.create(body, hooks);
    }

    async update(id: string, body: any, hooks?: any) {
        if (body?.provider?.toLowerCase() === 'apprise' && body?.config?.template) {
            this.cleanConfigKeys(body.config, body.config.template);
        }
        return super.update(id, body, hooks);
    }

    async sendItems(id: string, title: string, items: Array<{ content: string; mime_type?: string }> | string) {
        const record = await dbFindAll(
            this.db,
            this.table,
            this.user_id ? { id, owner_id: this.user_id } : { id }
        );

        const channel = record && record.length > 0 ? record[0] : null;

        if (!channel) {
            console.log("No notification channel found for id:", id);
            return;
        }

        const options = {
            channel
        };

        const providerName = (channel?.provider || channel?.type || '').toLowerCase();

        const provider = this.providers[providerName] || this.providers['apprise'];
        if (!provider) {
            console.error(`Notification provider '${providerName}' not registered.`);
            return;
        }

        return await provider.sendItems(title, items, options);
    }
}

// Pre-instantiated singleton instance exported using ES Node module caching pattern
const notificationServiceInstance = new notificationService(db, notificationChannels, {});

const getServiceNoAuthFn = async (owner_id?: string) => {
    if (owner_id) notificationServiceInstance.user_id = owner_id;
    return notificationServiceInstance;
};

export const getServiceNoAuth = new Proxy(getServiceNoAuthFn, {
    get(target, prop, receiver) {
        if (prop in target) {
            return (target as any)[prop];
        }
        const value = Reflect.get(notificationServiceInstance, prop, notificationServiceInstance);
        if (typeof value === 'function') {
            return value.bind(notificationServiceInstance);
        }
        return value;
    },
    set(target, prop, value, receiver) {
        return Reflect.set(notificationServiceInstance, prop, value, notificationServiceInstance);
    }
}) as typeof getServiceNoAuthFn & notificationService;

export const getService = async (event: any = null) => {
    const session = await getUserSession(event);
    return new notificationService(db, notificationChannels, {}, session.user?.id);
}

export const getAdminService = () => {
    return new notificationService(db, notificationChannels, {});
}
