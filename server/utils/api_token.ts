import { createHash, randomBytes } from 'node:crypto';

// API tokens are shown once when created; only their hash is stored. A token has 256 random bits, so a fast
// unsalted hash is enough (nothing to brute force) and lets the lookup find the account by the hash alone.

/** A new token: prefix + 32 random bytes, base64url. */
export const generateApiToken = (prefix = 'api_'): string => prefix + randomBytes(32).toString('base64url');

/** The stored form of a token (sha256, hex). */
export const hashApiToken = (token: string): string => createHash('sha256').update(token).digest('hex');
