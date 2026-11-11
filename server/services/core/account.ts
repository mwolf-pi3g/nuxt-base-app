import { db } from "hub:db";
import { accounts, roles } from "hub:db:schema";
import { zod_rules, token_rules } from "#bs/../shared/rules/account";
import { genericService } from "#bs/services/generic";
import { scryptSync, randomBytes, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import appDefaults from "#server/metadata/app_defaults.json";
import { generateApiToken, hashApiToken } from "#bs/utils/api_token";
import { appLimits } from "#bs/utils/app_limits";
import { permissionsByRoles } from "#bs/utils/permissions_by_roles";
import { dbJsonFindAllAndDelete } from "#bs/db/wrappers/db_json_find_all_and_delete";
import { dbCount } from "#bs/db/wrappers/db_count";
import { dbFindOne } from "#bs/db/wrappers/db_find_one";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";
import { dbCreate } from "#bs/db/wrappers/db_create";
import {
    adminUser, envAdminPassword, hasOwnPassword, matchesEnvPassword, NO_OWN_PASSWORD,
} from "#bs/services/core/initial_admin";

type ApiTokenRecord = typeof accounts.$inferSelect['tokens'][number];

// Accounts leave the service without the password hash and the token hashes
const publicAccount = (account: any) => {
    if (!account) return account;
    const { password, tokens, ...rest } = account;
    return rest;
};
const publicToken = ({ hash, ...rest }: ApiTokenRecord) => rest;

// last_used_at is written at most this often per token, not on every request
const LAST_USED_RESOLUTION_MS = 60_000;

class accountAdminService extends genericService {
    async init() {
        // Seeding Admin Account
        const existingAccounts = await dbFindAll(db, accounts, {});
        const adminRole = await dbFindAll(db, roles, { name: 'admin' }); // should exist by default
        const adminRoleId = adminRole[0]?.id;

        // FIXME: stupid way of forming query
        const adminExists = existingAccounts.some((u: any) => u.roles.includes(adminRoleId));

        // The first admin gets no password of its own: it signs in with ADMIN_PASSWORD until it sets one
        if (!adminExists) {
            await dbCreate(db, accounts, {
                user: adminUser(),
                password: NO_OWN_PASSWORD,
                lang: 'en',
                cron_active: 1,
                roles: [adminRoleId],
            });
            console.log(`Initial admin account "${adminUser()}" created: it signs in with ADMIN_PASSWORD until it sets its own password.`);
        }

        // Accounts without their own password can't sign in without a valid ADMIN_PASSWORD: don't start
        const waiting = (await dbFindAll(db, accounts, {}, { cols: ['user', 'password'] })).filter((a: any) => !hasOwnPassword(a)).map((a: any) => a.user);
        if (waiting.length > 0) {
            let password: string | undefined;
            try {
                password = envAdminPassword();
            } catch (e: any) {
                console.error(`${e.message}. Not starting.`);
                process.exit(1);
            }
            if (!password) {
                console.error(`ADMIN_PASSWORD (or ADMIN_PASSWORD_FILE) is not set, and account(s) ${waiting.join(', ')} have no password of their own yet. Not starting.`);
                process.exit(1);
            }
            const check = zod_rules.password.safeParse(password);
            if (!check.success) {
                console.error(`ADMIN_PASSWORD is invalid (${check.error.issues[0]?.message}): 12 to 128 characters. Not starting.`);
                process.exit(1);
            }
        }
        return existingAccounts[0];
    }

    hashPass(password: string, salt?: string): string {
        if (!salt) {
            salt = randomBytes(16).toString('hex');
        }
        const hash = scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    async verifyRoles(body: any) {
        if (body && body.roles !== undefined && body.roles !== null) {
            if (!Array.isArray(body.roles) || !body.roles.every((r: any) => typeof r === 'string')) {
                throw createError({
                    status: 400,
                    statusMessage: 'error accounts.roles.invalid_type'
                });
            }
            const wanted = [...new Set(body.roles as string[])];
            const allExist = (await dbCount(db, roles, { id: wanted })) === wanted.length;
            if (!allExist) {
                throw createError({
                    status: 400,
                    statusMessage: 'error accounts.roles.invalid_role'
                });
            }
        }
    }

    async deleteRoles(roleIds: string[]) {
        const count = await dbJsonFindAllAndDelete(db, accounts, { roles: roleIds });
        return count;
    }

    async read(id?: string) {
        const result = await super.read(id);
        return Array.isArray(result) ? result.map(publicAccount) : publicAccount(result);
    }

    // Override create; tokens are only added with addToken
    async create(body: any) {
        await this.verifyRoles(body);
        const { tokens, ...rest } = body ?? {};

        return publicAccount(await super.create(rest, { postValidate: { password: this.hashPass } }));
    }

    async update(id: string, body: any) {
        const { tokens, ...rest } = body ?? {};
        const updated = await super.update(id, rest, { postValidate: { password: this.hashPass } });
        return publicAccount(updated);
    }

    /** The user object a login puts into the session (an API token request gets the same). */
    async sessionUser(account: any) {
        return {
            id: account.id,
            user: account.user,
            roles: account.roles,
            permissions: await permissionsByRoles(account.roles),
            lang: account.lang,
            cron_active: account.cron_active,
        };
    }

    async #storedTokens(accountId: string): Promise<ApiTokenRecord[]> {
        const account = await dbFindOne(db, accounts, { id: accountId });
        if (!account) {
            throw createError({ statusCode: 404, statusMessage: 'error accounts.not_found' });
        }
        return account.tokens ?? [];
    }

    async #writeTokens(accountId: string, tokens: ApiTokenRecord[]) {
        await db.update(accounts).set({ tokens }).where(eq(accounts.id, accountId));
    }

    /** The account's tokens without their hashes. */
    async listTokens(accountId: string) {
        return (await this.#storedTokens(accountId)).map(publicToken);
    }

    /** Adds a token; the result carries the token itself, which is never shown again. */
    async addToken(accountId: string, body: any) {
        const check = token_rules.description.safeParse(body?.description);
        if (!check.success) {
            throw createError({
                statusCode: 422,
                statusMessage: `error ${check.error.issues[0]?.message}`,
                data: { field: 'description' },
            });
        }
        const tokens = await this.#storedTokens(accountId);
        if (tokens.length >= appLimits().accounts.max_api_tokens) {
            throw createError({ statusCode: 422, statusMessage: 'error table.api_tokens.rules.too_many' });
        }

        const token = generateApiToken((appDefaults as any).api_token_prefix);
        const record: ApiTokenRecord = {
            id: randomUUID(),
            description: check.data,
            hash: hashApiToken(token),
            created_at: new Date().toISOString(),
            last_used_at: null,
        };
        await this.#writeTokens(accountId, [...tokens, record]);
        return { ...publicToken(record), token };
    }

    async deleteToken(accountId: string, tokenId: string) {
        const tokens = await this.#storedTokens(accountId);
        const kept = tokens.filter((t) => t.id !== tokenId);
        if (kept.length === tokens.length) {
            throw createError({ statusCode: 404, statusMessage: 'error table.api_tokens.not_found' });
        }
        await this.#writeTokens(accountId, kept);
    }

    /** The session user for an API token; 401 when no account has it. */
    async authenticateToken(token: string) {
        const hash = hashApiToken(token);
        const [account] = await db.select().from(accounts).where(
            sql`exists (select 1 from json_each(${accounts.tokens}) where json_extract(value, '$.hash') = ${hash})`
        );
        if (!account) {
            throw createError({ statusCode: 401, statusMessage: 'error auth.token.invalid' });
        }

        const used = account.tokens?.find((t) => t.hash === hash);
        const now = new Date();
        if (used && (!used.last_used_at || now.getTime() - Date.parse(used.last_used_at) > LAST_USED_RESOLUTION_MS)) {
            // Changed in place in the database, so a token deleted meanwhile is not written back
            await db.update(accounts).set({
                tokens: sql`(select json_group_array(case when json_extract(value, '$.hash') = ${hash}
                    then json_set(value, '$.last_used_at', ${now.toISOString()}) else json(value) end)
                    from json_each(${accounts.tokens}))`,
            }).where(eq(accounts.id, account.id));
        }
        return this.sessionUser(account);
    }

    /** Whether this account still signs in with ADMIN_PASSWORD, having no password of its own (UI reminder). */
    async usesInitialPassword(user: string) {
        if (!user) return false;
        const account = await dbFindOne(db, accounts, { user }).catch(() => null);
        return !!account && !hasOwnPassword(account);
    }

    async authenticate(user: string, password: string) {
        let account;

        try {
            account = await dbFindOne(db, accounts, { user });
        } catch (e) {
            throw createError({
                statusCode: 401,
                statusMessage: 'error auth.login.invalid_credentials',
            });
        }

        // Verify password: the account's own, or ADMIN_PASSWORD while it has none
        let valid = false;
        if (account && hasOwnPassword(account)) {
            const [salt] = account.password.split(':');
            valid = this.hashPass(password, salt) === account.password;
        } else if (account) {
            valid = matchesEnvPassword(password);
        } else {
            this.hashPass(password);   // same work as for a real account: no hint which user names exist
        }

        if (!valid) {
            throw createError({
                statusCode: 401,
                statusMessage: 'error auth.login.invalid_credentials',
            });
        }

        return account;
    }
}

export const getService = async (ctx?: any) => {
    const ownerId = await resolveServiceContext(ctx);
    return new accountAdminService(db, accounts, zod_rules, ownerId);
}
