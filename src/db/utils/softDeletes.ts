import { isNull, eq, and } from "drizzle-orm";

/**
 * Adds a soft delete filter to a base condition
 * so only records with deletedAt IS NULL are returned.
 */
export const whereNotDeleted = (deletedAtColumn: any, baseCondition?: any) => {
  if (baseCondition) {
    return and(isNull(deletedAtColumn), baseCondition);
  }
  return isNull(deletedAtColumn);
};

/**
 * Marks a record as soft deleted
 */
export const softDelete = async (db: any, table: any, idColumn: any, id: number) => {
  const [result] = await db
    .update(table)
    .set({ deletedAt: new Date() })
    .where(eq(idColumn, id))
    .returning();

  return result;
};

/**
 * Restores a soft deleted record
 */
export const restoreDeleted = async (db: any, table: any, idColumn: any, id: number) => {
  const [result] = await db
    .update(table)
    .set({ deletedAt: null })
    .where(eq(idColumn, id))
    .returning();

  return result;
};
