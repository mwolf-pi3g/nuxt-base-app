// if user is not admin, return 403
export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (session.user && session.secure?.as_id) {
        const path = event.path;
        if (path.startsWith('/api/user') || path.startsWith('/api/v0')) {
            session.user.id = session.secure.as_id;
        }
    }

    // only auth allowed without session
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/landing', '/login', '/register', '/', '/api/_auth/session'];

    // Prefix-matched public paths. @nuxtjs/i18n lazy-loads message bundles from
    // /_i18n/<build-hash>/<locale>/messages.json, and the hash changes on every build, so
    // these cannot be exact matches. Without this the login page renders raw translation
    // keys (frontend.auth.login_title) because SSR's message fetch is rejected before the
    // visitor can possibly have a session.
    const publicPathPrefixes = ['/_i18n/'];

    const isPublic = publicPaths.includes(event.path)
        || publicPathPrefixes.some((prefix) => event.path.startsWith(prefix));

    if (!isPublic) {
        if (!session.user) {
            throw createError({
                statusCode: 403,
                statusMessage: 'error auth.not_authorized'
            });
        }
    }
})