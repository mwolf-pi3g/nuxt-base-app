import { getTableName } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { accounts, roles } from 'hub:db:schema';

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

export const schemaValidate: SchemaValidate = {};

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

const sv_account = {
    insert: createInsertSchema(accounts).omit({ createdAt: true, updatedAt: true }),
    select: createSelectSchema(accounts),
    update: createUpdateSchema(accounts).omit({ createdAt: true, updatedAt: true }),
}

schemaValidate.accounts = sv_account;
const sv_role = {
    insert: createInsertSchema(roles).omit({ createdAt: true, updatedAt: true }),
    select: createSelectSchema(roles),
    update: createUpdateSchema(roles).omit({ createdAt: true, updatedAt: true })
}
schemaValidate.roles = sv_role;
