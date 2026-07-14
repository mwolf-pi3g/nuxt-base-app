// if user is not admin, return 403
export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (event.path.startsWith('/api/admin')) {
        // if (!session.user || !session.user.roles.includes('admin')) {
        if (!session.user || !session.user.roles.includes('admin')) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Not authorized'
            });
        }
    }
})