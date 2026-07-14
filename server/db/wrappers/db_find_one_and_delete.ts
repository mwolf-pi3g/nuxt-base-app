import { dbFindOne } from './db_find_one';
import { dbDelete } from './db_delete';

/**
 * Filter a database table by an object, and if it yields at most one result, 
 * delete it. Throws if multiple results are found.
 */
export const dbFindOneAndDelete = async (db: any, table: any, filterObj: Record<string, any>) => {
  const itemToDelete = await dbFindOne(db, table, filterObj);
  if (!itemToDelete || !itemToDelete.id) return null;

  return await dbDelete(db, table, itemToDelete.id);
};
