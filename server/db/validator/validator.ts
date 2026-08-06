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
        const tableName = getTableName(table);
        const tableValidator = schemaValidate[tableName];
        
        if (!tableValidator) {
            console.log(`Validator error: table '${tableName}' has no validator registered in schemaValidate.`);
            throw createError({
                statusCode: 400,
                statusMessage: `error ${tableName}.${operation}.bad_payload`
            });
        }
        
        const opValidator = tableValidator[operation];
        if (!opValidator) {
            console.log(`Validator error: table '${tableName}' has no '${operation}' validator registered.`);
            throw createError({
                statusCode: 400,
                statusMessage: `error ${tableName}.${operation}.bad_payload`
            });
        }

        const validation = opValidator.safeParse(item);

        if (!validation.success) {
            console.log(`Validation failed for table '${tableName}', operation '${operation}':`, JSON.stringify(validation.error.format(), null, 2));
            throw createError({
                statusCode: 400,
                statusMessage: `error ${tableName}.${operation}.bad_payload`
            });
        }
        return validation.data;
    }
}


