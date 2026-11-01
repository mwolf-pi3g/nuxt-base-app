import { db } from 'hub:db';
import { userEvents } from '#bs/db/schema';
import { genericService } from '#bs/services/generic';

defineRouteMeta({
  openAPI: {
    tags: ['User Events'],
    description: 'Search and paginate event messages for the authenticated user.',
    parameters: [
      { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'Keyset pagination cursor' },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 }, description: 'Number of items to return' },
      { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' }, description: 'Column to sort by' },
      { name: 'sortDir', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction' },
      {
        name: 'level',
        in: 'query',
        schema: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ]
        },
        description: 'Filter by event level (single string, array, or comma-separated list)'
      },
      {
        name: 'category',
        in: 'query',
        schema: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
        description: 'Only events of these categories (single string, array, or comma-separated list)'
      },
      {
        name: 'excludeCategory',
        in: 'query',
        schema: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
        description: 'All events except these categories (events without a category are included); ignored with category'
      },
      {
        name: 'id',
        in: 'query',
        schema: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ]
        },
        description: 'Filter by event ID (single string, array, or comma-separated list)'
      },
      { name: 'cols', in: 'query', schema: { type: 'string' }, description: 'Comma-separated columns to return' }
    ],
    responses: {
      200: {
        description: 'Success response'
      },
      400: {
        description: 'Bad request (e.g. invalid cursor or non-sortable column)'
      },
      403: {
        description: 'Not logged in'
      }
    }
  }
});

const parseFilterList = (val: any): string | string[] | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  if (Array.isArray(val)) {
    const list = val.map(String).map(s => s.trim()).filter(Boolean);
    return list.length === 0 ? undefined : (list.length === 1 ? list[0] : list);
  }
  if (typeof val === 'string') {
    if (val.includes(',')) {
      const list = val.split(',').map(s => s.trim()).filter(Boolean);
      return list.length === 0 ? undefined : (list.length === 1 ? list[0] : list);
    }
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return String(val);
};

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'error user_events.read.not_logged_in',
    });
  }

  const query = getQuery(event);

  // Parse pagination & sorting options
  const options: Record<string, any> = {};

  if (query.cursor !== undefined && query.cursor !== '') {
    options.cursor = String(query.cursor);
  }

  const rawLimit = query.limit ?? query.items;
  if (rawLimit !== undefined && rawLimit !== '') {
    const parsedLimit = Number(rawLimit);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      options.limit = parsedLimit;
    }
  }

  if (query.sortBy || query.sort_by) {
    options.sortBy = String(query.sortBy ?? query.sort_by);
  } else {
    // Default to chronological order (newest events first)
    options.sortBy = 'createdAt';
  }

  if (query.sortDir || query.sort_dir || query.order) {
    options.sortDir = String(query.sortDir ?? query.sort_dir ?? query.order);
  } else {
    options.sortDir = 'desc';
  }

  if (query.cols) {
    if (Array.isArray(query.cols)) {
      options.cols = query.cols.map(String);
    } else if (typeof query.cols === 'string') {
      options.cols = query.cols.split(',').map(c => c.trim()).filter(Boolean);
    }
  }

  // Parse filters for searchSpec (supports single strings or list of strings)
  const searchSpec: Record<string, any> = {};

  const rawLevel = (query as any)['level[]'] ?? query.level;
  const parsedLevel = parseFilterList(rawLevel);
  if (parsedLevel !== undefined) {
    searchSpec.level = parsedLevel;
  }

  const rawId = (query as any)['id[]'] ?? query.id;
  const parsedId = parseFilterList(rawId);
  if (parsedId !== undefined) {
    searchSpec.id = parsedId;
  }

  // category: only these categories; excludeCategory: all others (events without a category included)
  const parsedCategory = parseFilterList((query as any)['category[]'] ?? query.category);
  if (parsedCategory !== undefined) {
    searchSpec.category = parsedCategory;
  }
  const parsedExclude = parseFilterList((query as any)['excludeCategory[]'] ?? query.excludeCategory);
  if (parsedExclude !== undefined && searchSpec.category === undefined) {
    searchSpec.category = { notIn: Array.isArray(parsedExclude) ? parsedExclude : [parsedExclude] };
  }

  const eventService = new genericService(db, userEvents, {}, userId);
  const result = await eventService.search(searchSpec, options);

  return {
    data: result.data,
    cursor: result.cursor,
    statusMessage: 'success user_events.search.success',
  };
});
