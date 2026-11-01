// Initial admin. The first start creates the account `admin` (or ADMIN_USER) without a password of its own. An account
// without one signs in with ADMIN_PASSWORD (or the file named by ADMIN_PASSWORD_FILE, e.g. a Docker secret) until it
// sets its own password; from then on the variable is not used for it. While any account needs the variable, the
// server doesn't start without it (or with one that breaks the password rules). There is no default password.
import { existsSync, readFileSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";

export const DEFAULT_ADMIN_USER = 'admin';

/** Stored in accounts.password for an account that signs in with ADMIN_PASSWORD. */
export const NO_OWN_PASSWORD = '';

export const adminUser = () => process.env.ADMIN_USER || DEFAULT_ADMIN_USER;

/** ADMIN_PASSWORD, else the trimmed contents of ADMIN_PASSWORD_FILE, else undefined. */
export const envAdminPassword = (): string | undefined => {
    if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
    const file = process.env.ADMIN_PASSWORD_FILE;
    if (!file) return undefined;
    if (!existsSync(file)) throw new Error(`ADMIN_PASSWORD_FILE "${file}" does not exist`);
    return readFileSync(file, 'utf8').trim() || undefined;
};

export const hasOwnPassword = (account: { password?: string | null } | null | undefined) =>
    !!account?.password && account.password !== NO_OWN_PASSWORD;

/** Whether `password` is the configured ADMIN_PASSWORD (constant time). */
export const matchesEnvPassword = (password: string) => {
    const expected = envAdminPassword();
    if (!expected || typeof password !== 'string') return false;
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
};
