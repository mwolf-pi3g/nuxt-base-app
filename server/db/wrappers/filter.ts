import { and, eq, inArray, isNull, notInArray, or, sql, type InferSelectModel, type SQL, type Table } from 'drizzle-orm';
import { createError } from 'h3';

/**
 * A filter object as all wrappers take it: { column: value }, every entry must hold (AND).
 *   value             column = value
 *   null              column IS NULL
 *   [a, b]            column IN (a, b); an empty list matches nothing
 *   { notIn: [a, b] } every other value, empty (NULL) included
 * Entries that are undefined are left out. A key that isn't a column of the table is an error, never ignored: a typo
 * (owner instead of owner_id) must not widen a result.
 */
export type Filter<T extends Table = any> = T extends Table ? { [K in keyof InferSelectModel<T>]?: unknown } : Record<string, unknown>;

/** A row of the table, as the wrappers return it. */
export type Row<T extends Table> = InferSelectModel<T>;

export const whereOf = <T extends Table>(table: T, filter: Filter<T> = {} as Filter<T>): SQL | undefined => {
  const conditions: SQL[] = [];
  for (const [key, val] of Object.entries(filter)) {
    if (val === undefined) continue;
    const column = (table as any)[key];
    if (!column || typeof column !== 'object' || !('name' in column)) {
      throw createError({ statusCode: 400, statusMessage: `error db.filter.unknown_column`, data: { column: key } });
    }
    if (val === null) {
      conditions.push(isNull(column));
    } else if (Array.isArray(val)) {
      conditions.push(val.length === 0 ? sql`0 = 1` : val.length === 1 ? eq(column, val[0]) : inArray(column, val));
    } else if (typeof val === 'object' && !(val instanceof Date) && Array.isArray((val as any).notIn)) {
      const list = (val as any).notIn as unknown[];
      if (list.length > 0) conditions.push(or(isNull(column), notInArray(column, list))!);
    } else {
      conditions.push(eq(column, val));
    }
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
};

/** The selected columns of a table ({ name: column }) for db.select(), or undefined for all of them. */
export const columnsOf = (table: any, cols?: readonly string[]) => {
  if (!cols || cols.length === 0) return undefined;
  const selection: Record<string, any> = {};
  for (const c of cols) {
    if (!table[c]) throw createError({ statusCode: 400, statusMessage: `error db.filter.unknown_column`, data: { column: c } });
    selection[c] = table[c];
  }
  return selection;
};
