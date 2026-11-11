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

/** Rows read back were validated when written; checking them again only costs time. DB_VALIDATE_READS=true does (development). */
const validateReads = () => process.env.DB_VALIDATE_READS === 'true';

/** Which fields failed and why, without their values (they can be personal data: email content, names). */
const issuesOf = (error: any) => (error?.issues ?? []).map((i: any) => ({ field: (i.path ?? []).join('.'), code: i.code }));

export const getValidator = (table: any, operation: 'insert' | 'select' | 'update') => {
    if (operation === 'select' && !validateReads()) return (item: any) => item;
    return (item: any) => {
        const tableName = getTableName(table);
        const tableValidator = schemaValidate[tableName];
        
        if (!tableValidator) {
            console.error(`Validator error: table '${tableName}' has no validator registered in schemaValidate.`);
            throw createError({
                statusCode: 400,
                statusMessage: `error ${tableName}.${operation}.bad_payload`
            });
        }
        
        const opValidator = tableValidator[operation];
        if (!opValidator) {
            console.error(`Validator error: table '${tableName}' has no '${operation}' validator registered.`);
            throw createError({
                statusCode: 400,
                statusMessage: `error ${tableName}.${operation}.bad_payload`
            });
        }

        const validation = opValidator.safeParse(item);

        if (!validation.success) {
            const issues = issuesOf(validation.error);
            console.error(`Validation failed for table '${tableName}', operation '${operation}':`, JSON.stringify(issues));
            throw createError({
                statusCode: 400,
                statusMessage: `error ${tableName}.${operation}.bad_payload`,
                data: { issues },
            });
        }
        return validation.data;
    }
}


