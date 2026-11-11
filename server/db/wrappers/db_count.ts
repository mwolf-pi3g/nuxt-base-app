import { count, type Table } from 'drizzle-orm';
import { whereOf, type Filter } from './filter';

/** How many rows match the filter (./filter.ts). */
export const dbCount = async <T extends Table>(db: any, table: T, filter: Filter<T> = {} as Filter<T>): Promise<number> => {
  const where = whereOf(table, filter);
  const query = db.select({ n: count() }).from(table);
  const [row] = await (where ? query.where(where) : query);
  return Number(row?.n ?? 0);
};

/** Whether any row matches the filter. */
export const dbExists = async <T extends Table>(db: any, table: T, filter: Filter<T> = {} as Filter<T>): Promise<boolean> => {
  const where = whereOf(table, filter);
  const query = db.select({ id: (table as any).id }).from(table);
  const rows = await (where ? query.where(where) : query).limit(1);
  return rows.length > 0;
};
