import crypto from 'crypto';

export default defineEventHandler(async (event) => {

    const { user, token } = getQuery(event);

    const expectedToken = crypto
        .createHmac('sha256', process.env.SERVER_SECRET!)
        .update(user?.toString() ?? "")
        .digest('hex');

    // Use timingSafeEqual to prevent timing side-channel attacks
    return crypto.timingSafeEqual(
        Buffer.from(token?.toString() ?? "", 'hex'),
        Buffer.from(expectedToken, 'hex')
    );

    // TODO: validate account
});