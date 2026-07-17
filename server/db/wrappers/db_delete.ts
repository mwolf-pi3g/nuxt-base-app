import { eq } from 'drizzle-orm';
import { getValidator } from 'hub:db:schema';

/**
 * Delete a record from a database table by ID
 */
export const dbDelete = async (db: any, table: any, id: string) => {
  const results = await db.delete(table).where(eq(table.id, id)).returning();

  if (results.length === 0) return null;

  const validator = getValidator(table, 'select');
  return validator(results[0]);
};
