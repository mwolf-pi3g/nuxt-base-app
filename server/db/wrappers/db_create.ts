import { getValidator } from '#bs/db/validator';

/**
 * Create a new record in a database table
 */
export const dbCreate = async (db: any, table: any, item: any) => {
  const newItem = {
    ...item,
    id: crypto.randomUUID()
  };

  const validator = getValidator(table, 'insert');
  const record = validator(newItem);

  const results = await db.insert(table).values(record).returning();
  const row = results[0];

  return row;
};
