import { and, or, sql, eq } from 'drizzle-orm';
import { getValidator } from '#bs/db/validator/validator';

/**
 * For all records in a database table matching JSON filter conditions,
 * remove the specified array items from the corresponding JSON array fields,
 * and update the records in the database.
 * Returns the updated records.
 */
export const dbJsonFindAllAndDelete = async (db: any, table: any, filterObj: Record<string, any>) => {
  const conditions = Object.keys(filterObj).map(key => {
    const val = filterObj[key];
    if (Array.isArray(val)) {
      if (val.length === 0) {
        return undefined;
      }
      const existsChecks = val.map(v => sql`exists (select 1 from json_each(${table[key]}) where value = ${v})`);
      return existsChecks.length > 1 ? or(...existsChecks) : existsChecks[0];
    } else {
      return sql`exists (select 1 from json_each(${table[key]}) where value = ${val})`;
    }
  });

  const validConditions = conditions.filter(c => c !== undefined);

  if (validConditions.length === 0) {
    return [];
  }

  // Find all records that contain these JSON items
  const matchingRows = await db.select().from(table).where(and(...validConditions));
  
  if (matchingRows.length === 0) {
    return [];
  }

  const updatedRows: any[] = [];
  const validator = getValidator(table, 'select');

  for (const row of matchingRows) {
    const updatePayload: Record<string, any> = {};
    
    for (const key of Object.keys(filterObj)) {
      const itemsToRemove = filterObj[key];
      const currentVal = row[key];

      if (Array.isArray(currentVal)) {
        if (Array.isArray(itemsToRemove)) {
          updatePayload[key] = currentVal.filter((item: any) => !itemsToRemove.includes(item));
        } else {
          updatePayload[key] = currentVal.filter((item: any) => item !== itemsToRemove);
        }
      } else if (typeof currentVal === 'string' && currentVal.startsWith('[') && currentVal.endsWith(']')) {
        try {
          const parsed = JSON.parse(currentVal);
          if (Array.isArray(parsed)) {
            if (Array.isArray(itemsToRemove)) {
              updatePayload[key] = parsed.filter((item: any) => !itemsToRemove.includes(item));
            } else {
              updatePayload[key] = parsed.filter((item: any) => item !== itemsToRemove);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      const [updatedRow] = await db.update(table)
        .set(updatePayload)
        .where(eq(table.id, row.id))
        .returning();
      
      if (updatedRow) {
        updatedRows.push(validator(updatedRow));
      }
    }
  }

  return updatedRows;
};
