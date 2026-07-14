import { dbFindOne } from './db_find_one';
import { dbUpdate } from './db_update';

/**
 * Filter a database table by an object, and if it yields at most one result, 
 * update using the update object. Throws if multiple results are found.
 */
export const dbFindOneAndUpdate = async (db: any, table: any, filterObj: Record<string, any>, updateObj: any) => {
  const itemToUpdate = await dbFindOne(db, table, filterObj);
  if (!itemToUpdate || !itemToUpdate.id) return null;

  return await dbUpdate(db, table, itemToUpdate.id, updateObj);
};
