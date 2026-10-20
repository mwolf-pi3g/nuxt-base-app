import { inArray, and, eq } from 'drizzle-orm';
import { getValidator } from '#bs/db/validator/validator';

/**
 * Delete multiple records from a database table by IDs, optionally scoping to ownerId
 */
export const dbDeleteMany = async (db: any, table: any, ids: string[], filterObj?: Record<string, any>) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const conditions = [inArray(table.id, ids)];

  if (filterObj) {
    for (const [key, val] of Object.entries(filterObj)) {
      if (val !== undefined && table[key]) {
        conditions.push(eq(table[key], val));
      }
    }
  }

  const results = await db.delete(table).where(and(...conditions)).returning();

  if (!results || results.length === 0) return [];

  try {
    const validator = getValidator(table, 'select');
    return results.map((r: any) => validator(r));
  } catch {
    return results;
  }
};
