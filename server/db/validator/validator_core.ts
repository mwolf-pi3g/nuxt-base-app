import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { accounts, roles } from 'hub:db:schema';

const sv_account = {
    insert: createInsertSchema(accounts).omit({ createdAt: true, updatedAt: true }),
    select: createSelectSchema(accounts),
    update: createUpdateSchema(accounts).omit({ createdAt: true, updatedAt: true }),
}

const sv_role = {
    insert: createInsertSchema(roles).omit({ createdAt: true, updatedAt: true }),
    select: createSelectSchema(roles),
    update: createUpdateSchema(roles).omit({ createdAt: true, updatedAt: true })
}

export default {
    accounts: sv_account,
    roles: sv_role
}