import { isNull, eq, and } from "drizzle-orm";

export const whereNotDeleted = (deletedAtColumn: any, baseCondition?: any) => {
  if (baseCondition) {
    return and(isNull(deletedAtColumn), baseCondition);
  }
  return isNull(deletedAtColumn);
};

export const softDelete = async (db: any, table: any, idColumn: any, id: number) => {
  const [result] = await db
    .update(table)
    .set({ deletedAt: new Date() })
    .where(eq(idColumn, id))
    .returning();

  return result;
};

export const restoreDeleted = async (db: any, table: any, idColumn: any, id: number) => {
  const [result] = await db
    .update(table)
    .set({ deletedAt: null })
    .where(eq(idColumn, id))
    .returning();

  return result;
};
