import type { Table } from 'drizzle-orm';
import { whereOf, columnsOf, type Filter, type Row } from './filter';
import { getValidator } from '#bs/db/validator/validator';

/**
 * All rows of a table matching the filter (./filter.ts), optionally only some columns (`cols`). No limit: for
 * lists that page, use dbSearch.
 */
export function dbFindAll<T extends Table>(db: any, table: T, filter?: Filter<T>): Promise<Row<T>[]>;
export function dbFindAll<T extends Table, K extends keyof Row<T>>(db: any, table: T, filter: Filter<T>, opts: { cols: K[] }): Promise<Pick<Row<T>, K>[]>;
export async function dbFindAll(db: any, table: any, filter: Filter = {}, opts: { cols?: string[] } = {}) {
  const selection = columnsOf(table, opts.cols);
  const query = selection ? db.select(selection).from(table) : db.select().from(table);
  const where = whereOf(table, filter);
  const rows = await (where ? query.where(where) : query);
  const validator = getValidator(table, 'select');
  return rows.map((row: any) => validator(row));
}
