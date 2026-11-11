import type { Table } from 'drizzle-orm';
import { whereOf, type Filter, type Row } from './filter';
import { getValidator } from '#bs/db/validator/validator';

/**
 * Deletes the rows with these ids that also match the filter (./filter.ts; e.g. { owner_id }) and returns them.
 */
export const dbDeleteMany = async <T extends Table>(db: any, table: T, ids: string[], filter: Filter<T> = {} as Filter<T>): Promise<Row<T>[]> => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const rows = await db.delete(table).where(whereOf(table, { ...filter, id: ids } as Filter<T>)).returning();
  const validator = getValidator(table, 'select');
  return rows.map((r: any) => validator(r));
};
