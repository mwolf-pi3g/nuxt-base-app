import { getTableName } from 'drizzle-orm';
import core from '#bs/db/validator/validator_core';
import app from '#server/db/validator/validator_app';

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

export const schemaValidate: SchemaValidate = { ...core, ...app };

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


