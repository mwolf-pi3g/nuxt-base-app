import { eq } from 'drizzle-orm';
import { getValidator } from '#bs/db/schema';

/**
 * Update a record in a database table by ID
 */
export const dbUpdate = async (db: any, table: any, id: string, updates: any) => {

  const validator_update = getValidator(table, 'update');
  const item = validator_update(updates);

  const toUpdate = {
    ...item,
    updatedAt: new Date(),
  };

  const results = await db.update(table)
    .set(toUpdate)
    .where(eq(table.id, id))
    .returning();

  if (results.length === 0) return null;

  const validator_select = getValidator(table, 'select');
  return validator_select(results[0]);
};
