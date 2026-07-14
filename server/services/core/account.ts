import { db } from "hub:db";
import { accounts } from "#server/db/schema";
import { zod_rules } from "#shared/rules/account";
import { genericService } from "#bs/services/generic";
import { scryptSync, randomBytes } from "node:crypto";
import { dbCreate } from "#bs/db/wrappers/db_create";
import { dbRead } from "#bs/db/wrappers/db_read";
import { dbFindOne } from "#bs/db/wrappers/db_find_one";
import crypto from "crypto";

class accountAdminService extends genericService {
    async init() {
        // Seeding Admin Account
        const existingAccounts = await dbRead(db, accounts);
        // FIXME: stupid way of forming query
        const adminExists = existingAccounts.some((u: any) => u.roles.includes('admin'));

        if (!adminExists) {
            const adminRecord = {
                user: 'admin@admin.com',
                password: '!1adminadmin',
                lang: 'en',
                validated: true,
                roles: ['admin'],
                limits: 'free'
            }

            console.log('--- DEFAULT ADMIN NOT FOUND ---');
            await this.create(adminRecord);
        }
        return existingAccounts[0];
    }

    async sendValidationEmail(record: any) {
        const token = crypto.createHmac('sha256', process.env.SERVER_SECRET!)
            .update(record.user.toString())
            .digest('hex');
        const url = `${process.env.BASE_URL}/auth/validate?user=${record.user}&token=${token}`;
        console.log('Validation URL:', url);
        // FIXME: send email
    }

    hashPass(password: string, salt?: string): string {
        if (!salt) {
            salt = randomBytes(16).toString('hex');
        }
        const hash = scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    // Override create 
    async create(body: any) {
        const domain = process.env.EMAIL_DOMAIN || 'localhost';

        // Generate a random 16-character email-legal string
        const randomPrefix = randomBytes(8).toString('hex');
        const generatedEmail = `${randomPrefix}@${domain}`;

        // Merge overrides
        const account = {
            ...body,
            email: generatedEmail,
        };

        this.validate(account);
        account.password = this.hashPass(account.password);
        account.validated = account.validated ? 1 : 0;
        try {
            const record = await dbCreate(db, accounts, account);
            console.log('Account created:', record);
            await this.sendValidationEmail(record);
            return record;
        } catch (error) {
            console.error('Error creating account:', error);
            throw createError({
                status: 500,
                statusMessage: 'error core.account.create_failed'
            });
        }
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
