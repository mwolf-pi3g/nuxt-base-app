import { eq, and } from 'drizzle-orm';
import { getValidator } from '#bs/db/validator/validator';

/**
 * Filter a database table by an object, and return at most one result.
 * Throws if multiple results are found.
 */
export const dbFindOne = async (db: any, table: any, filterObj: Record<string, any>) => {
  const conditions = Object.keys(filterObj).map(key => eq(table[key], filterObj[key]));
  const results = await db.select().from(table).where(and(...conditions));
  if (results.length > 1) {
    throw new Error(`dbFindOne: Expected at most 1 result, found ${results.length}`);
  }

  if (results.length === 0) return null;

  const validator = getValidator(table, 'select');
  return validator(results[0]);
};
