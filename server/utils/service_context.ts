export async function resolveServiceContext(ctx?: any): Promise<string | undefined> {
    if (!ctx) return undefined;
    if (typeof ctx === 'string') return ctx;
    if (typeof ctx === 'object') {
        if ('ownerId' in ctx || 'owner_id' in ctx) {
            return ctx.ownerId || ctx.owner_id;
        }
        if ('isAdmin' in ctx && ctx.isAdmin) {
            return undefined;
        }
        try {
            const session = await getUserSession(ctx);
            return session?.user?.id;
        } catch {
            return undefined;
        }
    }
    return undefined;
}
