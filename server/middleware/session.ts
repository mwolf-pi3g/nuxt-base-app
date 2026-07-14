// if user is not admin, return 403
export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
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