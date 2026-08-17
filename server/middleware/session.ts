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

    if (!(publicPaths.includes(event.path))) {
        if (!session.user) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Not authorized'
            });
        }
    }
})