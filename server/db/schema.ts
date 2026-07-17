import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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

