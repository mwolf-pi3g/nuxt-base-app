/**
 * Startup check for environment variables, called from each layer's Nitro plugin.
 * - required: missing or empty stops the server with one error listing all of them.
 * - features: { VAR: 'what needs it' }; missing only logs a warning, the feature fails when used.
 */
export function checkEnv(layer: string, required: string[], features: Record<string, string> = {}): void {
    const isSet = (name: string) => !!process.env[name]?.trim();

    for (const [name, feature] of Object.entries(features)) {
        if (!isSet(name)) console.warn(`[${layer}] ${name} is not set: ${feature} will not work`);
    }

    const missing = required.filter((name) => !isSet(name));
    if (missing.length > 0) {
        throw new Error(`[${layer}] Missing required environment variables: ${missing.join(', ')} (see .env.example)`);
    }
}
