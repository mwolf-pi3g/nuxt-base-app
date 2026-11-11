import { db } from "hub:db";
import { notificationChannels } from "#bs/db/schema";
import { genericService } from "#bs/services/generic";
import { zod_rules, configSchema } from "#bs/../shared/rules/notification_channels";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import { notificationProviderRegistry } from "#bs/utils/notifications_provider_registry";
import { emitTelemetryEvent, EventScope, EventLevel, reportNotificationFailure } from "#bs/utils/telemetry/event";

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
        return await notificationProviderRegistry.getSchemas(this.providers, forceRefresh, this.user_id);
    }

    // The service description ({ templates, tokens }) of a provider's type; refreshed once when not found
    // (e.g. the Apprise server was unreachable when the cache was filled).
    async serviceDetails(provider: string, type: string) {
        const find = (all: Record<string, any[]>) =>
            (all[provider.toLowerCase()] || []).find((item: any) => item?.service_name === type)?.details;
        return find(await this.getSchemas()) || find(await this.getSchemas(true));
    }

    // Validates a whole channel: the fixed fields, the type against the provider, and the config against the type's
    // description. Keys the template doesn't use are removed from config first (the form keeps helper keys there).
    async checkChannel(channel: any) {
        const reject = (message: string, field: string) => {
            throw createError({ status: 422, statusMessage: `error ${message}`, data: { field } });
        };
        for (const key of Object.keys(zod_rules) as (keyof typeof zod_rules)[]) {
            const rv = zod_rules[key].safeParse(channel?.[key]);
            if (!rv.success) reject(rv.error.issues[0]?.message || 'notification_channels.bad_payload', key);
        }
        this.validateProvider(channel.provider, true);

        const details = await this.serviceDetails(channel.provider, channel.type);
        if (!details) reject('table.notification_channels.rules.type.invalid', 'type');

        if (channel.config.template) this.cleanConfigKeys(channel.config, channel.config.template);
        const rv = configSchema(details, channel.config).safeParse(channel.config);
        if (!rv.success) {
            const issue = rv.error.issues[0];
            reject(issue?.message || 'table.notification_channels.rules.config.invalid', `config.${issue?.path.join('.')}`);
        }
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
            throw createError({
                status: 400,
                statusMessage: `error notification_channels.invalid_provider`
            });
        }
    }

    async create(body: any, hooks?: any) {
        const channel = { ...body, config: { ...(body?.config || {}) } };
        await this.checkChannel(channel);
        return super.create(channel, hooks);
    }

    // A partial update is checked as the whole channel it produces
    async update(id: string, body: any, hooks?: any) {
        const existing: any = await this.read(id);
        if (!existing) {
            throw createError({ status: 404, statusMessage: `error notification_channels.not_found` });
        }
        const config = body?.config !== undefined ? { ...(body.config || {}) } : { ...(existing.config || {}) };
        await this.checkChannel({ ...existing, ...body, config });
        return super.update(id, body?.config !== undefined ? { ...body, config } : body, hooks);
    }

    // Delivers through the channel's provider. Never throws: failures go to the owner's event log.
    private async deliver(channel: any, title: string, items: Array<{ content: string; mime_type?: string; filename?: string; metadata?: any }> | string, extraOptions?: Record<string, any>): Promise<{ ok: boolean }> {
        const ownerId = channel.owner_id || this.user_id;
        const channelName = channel.name || channel.id || 'notification channel';
        const providerName = (channel.provider || channel.type || '').toLowerCase();
        const provider = this.providers[providerName] || this.providers['apprise'];
        if (!provider) {
            await reportNotificationFailure(ownerId, channelName, `Notification provider '${providerName}' not registered`);
            return { ok: false };
        }

        try {
            const res = await provider.sendItems(title, items, { channel, user_id: ownerId, owner_id: ownerId, ...extraOptions });
            return { ok: Boolean(res?.ok) };
        } catch (error: any) {
            await reportNotificationFailure(ownerId, channelName, error?.message || 'Notification send failed');
            return { ok: false };
        }
    }

    async sendItems(id: string, title: string, items: Array<{ content: string; mime_type?: string; filename?: string; metadata?: any }> | string, extraOptions?: Record<string, any>): Promise<{ ok: boolean }> {
        const record = await dbFindAll(
            this.db,
            this.table,
            this.user_id ? { id, owner_id: this.user_id } : { id }
        ).catch(() => null);

        const channel = record && record.length > 0 ? record[0] : null;
        if (!channel) {
            await reportNotificationFailure(this.user_id || extraOptions?.owner_id, id, `Channel '${id}' not found`);
            return { ok: false };
        }

        return this.deliver(channel, title, items, extraOptions);
    }

    // Sends a real test message through a (possibly unsaved) channel definition from the form.
    async testChannel(data: any): Promise<{ ok: boolean }> {
        const channel = { ...data, config: { ...(data?.config || {}) }, owner_id: this.user_id };
        try {
            await this.checkChannel(channel);
        } catch (e: any) {
            // An invalid channel is a failed test like any other: reported in the event log, not thrown
            if (this.user_id) await reportNotificationFailure(this.user_id, channel.name || channel.type || 'notification channel', String(e?.statusMessage || e).replace(/^error /, ''));
            return { ok: false };
        }

        const res = await this.deliver(channel, 'Test notification', [{ content: 'This is a test notification.', mime_type: 'text/plain' }]);
        if (res.ok && this.user_id) {
            await emitTelemetryEvent({
                scope: EventScope.USER,
                owner_id: this.user_id,
                level: EventLevel.INFO,
                category: 'notification',
                message: 'events.notification.test_ok',
                metadata: { channel: channel.name || channel.type || 'notification channel' }
            });
        }
        return res;
    }

    async export(id?: string, stripFields: string[] = ['id', 'owner_id', 'createdAt', 'updatedAt'], transformFields: string[] = []) {
        return super.export(stripFields, transformFields, id);
    }

    async import(payload: any, transformFields: string[] = []) {
        return super.import(payload, transformFields);
    }
}

export const getService = async (ctx?: any) => {
    const ownerId = await resolveServiceContext(ctx);
    return new notificationService(db, notificationChannels, {}, ownerId);
}
