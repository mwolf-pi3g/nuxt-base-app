import type { Table } from 'drizzle-orm';
import { whereOf, type Filter, type Row } from './filter';
import { dbFindOne } from './db_find_one';
import { getValidator } from '#bs/db/validator/validator';

/**
 * Updates the one row matching the filter and returns it (null if none). One statement when the filter names the id
 * (as genericService's always does); otherwise the row is looked up first, and more than one match throws.
 */
export const dbFindOneAndUpdate = async <T extends Table>(db: any, table: T, filter: Filter<T>, updates: any): Promise<Row<T> | null> => {
  const given = filter as Record<string, unknown>;
  const target = given.id !== undefined ? given : { ...given, id: (await dbFindOne(db, table, filter) as any)?.id };
  if (target.id === undefined || target.id === null) return null;

  const values = { ...getValidator(table, 'update')(updates), ...('updatedAt' in table ? { updatedAt: new Date() } : {}) };
  const [row] = await db.update(table).set(values).where(whereOf(table, target as Filter<T>)).returning();
  return row ? getValidator(table, 'select')(row) : null;
};
