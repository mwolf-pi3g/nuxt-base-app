import { getValidator } from '#bs/db/validator';

/**
 * Read records from a database table.
 * If an ID is provided, returns a single record.
 * Otherwise returns all records.
 */
export const dbRead = async (db: any, table: any) => {
  const all = await db.select().from(table);
  const validator = getValidator(table, 'select');
  return all.map((row: any) => validator(row));
};
