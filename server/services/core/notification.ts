import { db } from "hub:db";
import { notificationChannels } from "#bs/db/schema";
import { genericService } from "#bs/services/generic";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import { notificationProviderRegistry } from "#bs/utils/notifications_provider_registry";

class notificationService extends genericService {
    constructor(db: any, table: any, zod_rules: any, user_id?: string) {
        super(db, table, zod_rules, user_id);
    }

    get providers(): Record<string, any> {
        return notificationProviderRegistry.providers;
    }

    // set providers(val: Record<string, any>) {
    //     notificationProviderRegistry.providers = val;
    // }

    registerProvider(name: string, providerClass: any) {
        notificationProviderRegistry.registerProvider(name, providerClass);
    }

    async getSchemas(forceRefresh = false): Promise<Record<string, any[]>> {
        return await notificationProviderRegistry.getSchemas(this.providers, forceRefresh);
    }

    // removes any keys in config that are not in the template
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

    validateProvider(providerName?: string, required = true) {
        if (!providerName) {
            if (required) {
                throw createError({
                    status: 400,
                    statusMessage: `error notification_channels.provider.missing`
                });
            }
            return;
        }

        const normalized = providerName.toLowerCase();
        if (!this.providers[normalized]) {
            console.log(`Provider ${providerName} not found`);
            console.log(`Available providers: ${Object.keys(this.providers).join(', ')}`);
            throw createError({
                status: 400,
                statusMessage: `error notification_channels.invalid_provider`
            });
        }
    }

    async create(body: any, hooks?: any) {
        this.validateProvider(body?.provider, true);
        if (body?.provider?.toLowerCase() === 'apprise' && body?.config?.template) {
            this.cleanConfigKeys(body.config, body.config.template);
        }
        return super.create(body, hooks);
    }

    async update(id: string, body: any, hooks?: any) {
        this.validateProvider(body?.provider, false);
        if (body?.provider?.toLowerCase() === 'apprise' && body?.config?.template) {
            this.cleanConfigKeys(body.config, body.config.template);
        }
        return super.update(id, body, hooks);
    }

    async sendItems(id: string, title: string, items: Array<{ content: string; mime_type?: string; metadata?: any }> | string, extraOptions?: Record<string, any>) {
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
            channel,
            ...extraOptions
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

export const getService = async (ctx?: any) => {
    const ownerId = await resolveServiceContext(ctx);
    return new notificationService(db, notificationChannels, {}, ownerId);
}
