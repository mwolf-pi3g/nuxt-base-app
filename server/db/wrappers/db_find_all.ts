import { eq, and } from 'drizzle-orm';
import { getValidator } from '#bs/db/validator/validator';

/**
 * Filter a database table by an object, and return all matches.
 */
export const dbFindAll = async (db: any, table: any, filterObj: Record<string, any>) => {
  const conditions = Object.keys(filterObj).map(key => eq(table[key], filterObj[key]));

  const results = await db.select().from(table).where(and(...conditions));

  const validator = getValidator(table, 'select');
  return results.map((row: any) => validator(row));
};
