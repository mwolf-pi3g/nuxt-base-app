import { db } from "hub:db";
import { accounts, roles } from "hub:db:schema";
import { zod_rules } from "#bs/../shared/rules/account";
import { genericService } from "#bs/services/generic";
import { scryptSync, randomBytes, createHmac } from "node:crypto";
import { dbJsonFindAllAndDelete } from "#bs/db/wrappers/db_json_find_all_and_delete";
import { dbRead } from "#bs/db/wrappers/db_read";
import { dbFindOne } from "#bs/db/wrappers/db_find_one";
import { dbFindAll } from "#bs/db/wrappers/db_find_all";

class accountAdminService extends genericService {
    async init() {
        // Seeding Admin Account
        const existingAccounts = await dbRead(db, accounts);
        const adminRole = await dbFindAll(db, roles, { name: 'admin' }); // should exist by default
        const adminRoleId = adminRole[0]?.id;

        // FIXME: stupid way of forming query
        const adminExists = existingAccounts.some((u: any) => u.roles.includes(adminRoleId));

        if (!adminExists) {
            const adminRecord = {
                user: 'admin@admin.com',
                password: '!1adminadmin',
                lang: 'en',
                validated: 1,
                roles: [adminRoleId],
                limits: 'basic'
            }

            console.log('--- DEFAULT ADMIN NOT FOUND ---');
            await this.create(adminRecord);
        }
        return existingAccounts[0];
    }

    async sendValidationEmail(record: any) {
        const token = createHmac('sha256', process.env.SERVER_SECRET!)
            .update(record.user.toString())
            .digest('hex');
        const url = `${process.env.BASE_URL}/auth/validate?user=${record.user}&token=${token}`;
        // FIXME: send email
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
            const dbRoles = await dbRead(db, roles);
            const dbRoleIds = dbRoles.map((r: any) => r.id);
            const allExist = body.roles.every((r: string) => dbRoleIds.includes(r));
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

    // Override create 
    async create(body: any) {
        await this.verifyRoles(body);

        // const domain = process.env.EMAIL_DOMAIN || 'localhost';
        // // Generate a random 16-character email-legal string
        // const randomPrefix = randomBytes(8).toString('hex');
        // const email = `${randomPrefix}@${domain}`;

        const record = await super.create(body, { postValidate: { password: this.hashPass } });
        await this.sendValidationEmail(record);
        return record;

    }

    async update(id: string, body: any) {
        return await super.update(id, body, { postValidate: { password: this.hashPass } });
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

        // Verify password
        const passwordHash = account?.password || "";
        const [salt, storedHash] = passwordHash.split(':');
        const enteredHash = this.hashPass(password, salt);

        if (!account || enteredHash !== passwordHash) {
            throw createError({
                statusCode: 401,
                statusMessage: 'error auth.login.invalid_credentials',
            });
        }

        return account;
    }
}

export const getService = () => {
    return new accountAdminService(db, accounts, zod_rules);
}
