import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { getTableName } from 'drizzle-orm';

// zod does not define this?
interface SchemaOp {
    safeParse: (data: unknown) => { success: true; data: any } | { success: false; error: any };
}

type SchemaOperations = {
    insert: SchemaOp;
    select: SchemaOp;
    update: SchemaOp;
    prep?: Object;
};

type SchemaValidate = Record<string, SchemaOperations>;

const schemaValidate: SchemaValidate = {};

export const getValidator = (table: any, operation: 'insert' | 'select' | 'update') => {
    return (item: any) => {
        const validation = schemaValidate[getTableName(table)]?.[operation]?.safeParse(item);

        if (!(validation?.success)) {
            console.log("reason", validation?.error);
            throw createError({
                statusCode: 400,
                statusMessage: `error ${getTableName(table)}.${operation}.bad_payload`
            });
        }
        return validation.data;
    }
}

// --- Accounts Table ---
export const accounts = sqliteTable('accounts', {
    id: text('id').primaryKey(),
    user: text('user').unique().notNull(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    lang: text('lang').default('en'),
    roles: text('roles', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default([]),
    limits: text('limits').default('free'),
    validated: integer('validated').default(0), // 0 or 1 
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    // validatedAt: text('validated_at').notNull(),
});

const sv_account = {
    insert: createInsertSchema(accounts).omit({ createdAt: true, updatedAt: true }),
    select: createSelectSchema(accounts),
    update: createUpdateSchema(accounts).omit({ createdAt: true, updatedAt: true }),
}
schemaValidate.accounts = sv_account;

// --- Roles Table ---
export const roles = sqliteTable('roles', {
    id: text('id').primaryKey(),
    name: text('name').unique().notNull(),
    permissions: text('permissions', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default([]),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

const sv_role = {
    insert: createInsertSchema(roles).omit({ createdAt: true, updatedAt: true }),
    select: createSelectSchema(roles),
    update: createUpdateSchema(roles).omit({ createdAt: true, updatedAt: true })
}
schemaValidate.roles = sv_role;
