import type { H3Event } from 'h3';

/**
 * The session of the request: the API token's user when the request came with one (set by middleware/session.ts),
 * else the cookie session. Use it instead of getUserSession wherever the user is read.
 */
export async function getAuthSession(event: H3Event): Promise<{ user?: any; secure?: any; via_token?: boolean }> {
  if (event.context.tokenUser) return { user: event.context.tokenUser, via_token: true };
  return await getUserSession(event);
}

export default getAuthSession
