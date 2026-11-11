import type { Table } from 'drizzle-orm';
import { whereOf, type Filter, type Row } from './filter';
import { getValidator } from '#bs/db/validator/validator';

/**
 * The row matching the filter (./filter.ts), or null. Throws if more than one matches (two are read to know).
 */
export const dbFindOne = async <T extends Table>(db: any, table: T, filter: Filter<T>): Promise<Row<T> | null> => {
  const where = whereOf(table, filter);
  const rows = await (where ? db.select().from(table).where(where) : db.select().from(table)).limit(2) as Row<T>[];
  if (rows.length > 1) {
    throw new Error(`dbFindOne: Expected at most 1 result, found more`);
  }
  if (rows.length === 0) return null;
  return getValidator(table, 'select')(rows[0]);
};
