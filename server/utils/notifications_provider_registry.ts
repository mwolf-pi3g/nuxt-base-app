class NotificationProviderRegistry {
    providers: Record<string, any> = {};
    schemas: Record<string, any[]> | null = null;

    registerProvider(name: string, providerClass: any) {
        if (!name || !providerClass) return;
        this.providers[name.toLowerCase()] = providerClass;
        this.schemas = null;
    }

    getProviders(): Record<string, any> {
        return this.providers;
    }

    // Service descriptions per provider. Shared descriptions are cached; a provider with `static perUserSchemas = true`
    // describes the user's own resources (e.g. their IMAP sources) and is asked for each call with the user's id.
    async getSchemas(providersOverride?: Record<string, any>, forceRefresh = false, user_id?: string): Promise<Record<string, any[]>> {
        const activeProviders = providersOverride || this.providers;

        if (forceRefresh || !this.schemas) {
            const shared: Record<string, any[]> = {};
            for (const [name, provider] of Object.entries(activeProviders)) {
                if (provider?.perUserSchemas) continue;
                shared[name] = typeof provider?.getSchemas === 'function' ? await provider.getSchemas() : [];
            }
            this.schemas = shared;
        }

        const result: Record<string, any[]> = { ...this.schemas };
        for (const [name, provider] of Object.entries(activeProviders)) {
            if (provider?.perUserSchemas && typeof provider.getSchemas === 'function') {
                result[name] = await provider.getSchemas({ user_id });
            }
        }
        return result;
    }
}

export const notificationProviderRegistry = new NotificationProviderRegistry();
