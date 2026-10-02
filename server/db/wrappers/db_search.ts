import { eq, and, or, gt, lt, isNull, sql, inArray } from 'drizzle-orm';
import { createError } from 'h3';

export interface DbSearchOptions {
  cursor?: string;
  limit?: number;
  items?: number;
  cols?: string[];
  sortBy?: string;
  sort_by?: string;
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
  sort_dir?: 'asc' | 'desc' | 'ASC' | 'DESC';
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';
  userId?: string | string[];
  user_id?: string | string[];
}

interface CursorPayload {
  v: any;
  id: string;
  s?: string;
  d?: string;
}

/**
 * Filter and paginate a database table using keyset cursor pagination.
 */
export const dbSearch = async (
  db: any,
  table: any,
  searchSpec: Record<string, any> = {},
  options: DbSearchOptions = {}
) => {
  // 1. Resolve limit (default 100)
  const limit = typeof options.limit === 'number'
    ? options.limit
    : (typeof options.items === 'number' ? options.items : 100);

  if (limit <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Limit must be a positive integer'
    });
  }

  // 2. Resolve sort column and direction
  const sortBy = options.sortBy ?? options.sort_by ?? 'id';
  const rawDir = options.sortDir ?? options.sort_dir ?? options.order ?? 'asc';
  const sortDir = String(rawDir).toLowerCase() === 'desc' ? 'desc' : 'asc';

  // Validate sortBy column exists on table
  if (!table[sortBy]) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid sort column: '${sortBy}' does not exist on table`
    });
  }

  const colObj = table[sortBy];

  // 3A (Option 1): Throw 400 if attempting to sort by a JSON column
  const isJson =
    colObj?.dataType === 'json' ||
    colObj?.columnType === 'SQLiteTextJson' ||
    colObj?.config?.dataType === 'json' ||
    colObj?.mode === 'json';

  if (isJson) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot sort by JSON column '${sortBy}'`
    });
  }

  // User ID scoping: if user id is provided, explicitly add it to the search
  const resolvedUserId = options.userId ?? options.user_id ?? searchSpec.owner_id;
  const activeSpec: Record<string, any> = { ...searchSpec };
  if (resolvedUserId && 'owner_id' in table) {
    activeSpec.owner_id = resolvedUserId;
  }

  // 5. Base64 safe validation for cursor
  let decodedCursor: CursorPayload | null = null;
  if (options.cursor) {
    try {
      const raw = Buffer.from(options.cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.id === undefined) {
        throw new Error('Malformed cursor');
      }
      if (parsed.s && parsed.s !== sortBy) {
        throw createError({
          statusCode: 400,
          statusMessage: `Cursor sort column '${parsed.s}' does not match requested sortBy '${sortBy}'`
        });
      }
      if (parsed.d && parsed.d.toLowerCase() !== sortDir) {
        throw createError({
          statusCode: 400,
          statusMessage: `Cursor sort direction '${parsed.d}' does not match requested sort direction '${sortDir}'`
        });
      }
      decodedCursor = parsed;
    } catch (err: any) {
      if (err.statusCode || err.status) throw err;
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid cursor provided'
      });
    }
  }

  // Handle date/timestamp deserialization for cursor value
  let cursorVal = decodedCursor ? decodedCursor.v : undefined;
  if (decodedCursor && cursorVal !== null && cursorVal !== undefined) {
    if (colObj.dataType === 'date' && typeof cursorVal === 'string') {
      cursorVal = new Date(cursorVal);
    }
  }

  // 4 & 2. Construct WHERE conditions (Search Spec AND Cursor Condition)
  const conditions: any[] = [];

  for (const key of Object.keys(activeSpec)) {
    if (activeSpec[key] !== undefined && table[key]) {
      const val = activeSpec[key];
      if (val === null) {
        conditions.push(isNull(table[key]));
      } else if (Array.isArray(val)) {
        if (val.length === 0) {
          conditions.push(sql`0 = 1`);
        } else if (val.length === 1) {
          conditions.push(eq(table[key], val[0]));
        } else {
          conditions.push(inArray(table[key], val));
        }
      } else {
        conditions.push(eq(table[key], val));
      }
    }
  }

  // Keyset cursor seek with NULLS LAST
  if (decodedCursor) {
    const curId = decodedCursor.id;
    if (sortBy === 'id' || !table.id) {
      if (sortDir === 'asc') {
        conditions.push(gt(table.id, curId));
      } else {
        conditions.push(lt(table.id, curId));
      }
    } else {
      if (sortDir === 'asc') {
        if (cursorVal !== null && cursorVal !== undefined) {
          conditions.push(
            or(
              gt(colObj, cursorVal),
              and(eq(colObj, cursorVal), gt(table.id, curId)),
              isNull(colObj)
            )
          );
        } else {
          conditions.push(
            and(
              isNull(colObj),
              gt(table.id, curId)
            )
          );
        }
      } else {
        // sortDir === 'desc'
        if (cursorVal !== null && cursorVal !== undefined) {
          conditions.push(
            or(
              lt(colObj, cursorVal),
              and(eq(colObj, cursorVal), lt(table.id, curId)),
              isNull(colObj)
            )
          );
        } else {
          conditions.push(
            and(
              isNull(colObj),
              lt(table.id, curId)
            )
          );
        }
      }
    }
  }

  // 4. Construct ORDER BY with NULLS LAST & deterministic tie-breaker
  const directionSql = sortDir === 'desc' ? sql`DESC` : sql`ASC`;
  const orderBy: any[] = [];

  if (sortBy === 'id' || !table.id) {
    orderBy.push(sql`${table.id} ${directionSql} NULLS LAST`);
  } else {
    orderBy.push(sql`${colObj} ${directionSql} NULLS LAST`);
    orderBy.push(sql`${table.id} ${directionSql} NULLS LAST`);
  }

  // 1B. Projection handling
  let selectProjection: any = undefined;
  const customCols = Array.isArray(options.cols) && options.cols.length > 0 ? options.cols : null;

  if (customCols) {
    selectProjection = {};
    for (const c of customCols) {
      if (table[c]) {
        selectProjection[c] = table[c];
      }
    }
    // Ensure id and sortBy are present in the DB query to build cursor
    if (table.id && !selectProjection.id) {
      selectProjection.id = table.id;
    }
    if (table[sortBy] && !selectProjection[sortBy]) {
      selectProjection[sortBy] = table[sortBy];
    }
  }

  // 1C. Query limit + 1
  let query = selectProjection ? db.select(selectProjection).from(table) : db.select().from(table);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(...orderBy).limit(limit + 1);

  const results = await query;

  const hasMore = results.length > limit;
  const pageItems = hasMore ? results.slice(0, limit) : results;

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const lastItem = pageItems[pageItems.length - 1];
    const payload: CursorPayload = {
      v: lastItem[sortBy] ?? null,
      id: lastItem.id,
      s: sortBy,
      d: sortDir
    };
    nextCursor = Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // Strip temporary helper columns if customCols was specified
  let finalData = pageItems;
  if (customCols) {
    finalData = pageItems.map((item: any) => {
      const projected: Record<string, any> = {};
      for (const c of customCols) {
        projected[c] = item[c];
      }
      return projected;
    });
  }

  return {
    data: finalData,
    cursor: nextCursor
  };
};
