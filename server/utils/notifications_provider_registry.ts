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

    async getSchemas(providersOverride?: Record<string, any>, forceRefresh = false): Promise<Record<string, any[]>> {
        if (!forceRefresh && this.schemas) {
            return this.schemas;
        }

        const activeProviders = providersOverride || this.providers;
        const result: Record<string, any[]> = {};

        for (const [name, provider] of Object.entries(activeProviders)) {
            if (provider && typeof provider.getSchemas === 'function') {
                result[name] = await provider.getSchemas();
            } else {
                result[name] = [];
            }
        }

        this.schemas = result;
        return this.schemas;
    }
}

export const notificationProviderRegistry = new NotificationProviderRegistry();
