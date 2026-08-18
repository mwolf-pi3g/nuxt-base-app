import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// --- Accounts Table ---
export const accounts = sqliteTable('accounts', {
    id: text('id').primaryKey(),
    user: text('user').unique().notNull(),
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

// --- Notification Channels Table ---
export const notificationChannels = sqliteTable('notification_channels', {
    id: text('id').primaryKey(),
    owner_id: text('owner_id').notNull(),
    name: text('name').notNull(),
    provider: text('provider').notNull(),
    type: text('type').notNull(),
    config: text('config', { mode: 'json' }).$type<any>().notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});