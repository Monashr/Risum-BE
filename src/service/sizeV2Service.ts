import { eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { sizesV2, productSizes } from "../db/schema";
import { softDelete } from "../db/utils/softDeletes";
import { SizeV2Input, SizeV2Validation } from "../DTO/sizeV2DTO";

export type SizeV2 = typeof sizesV2.$inferSelect;

export async function getManySizeV2() {
  return await db.query.sizesV2.findMany({
    where: isNull(sizesV2.deletedAt),
  });
}

export async function insertSizeV2(tx: any, name: string) {
  return tx
    .insert(sizesV2)
    .values({
      name,
    })
    .returning();
}

export function parseSizeV2FormData(form: FormData): SizeV2Validation {
  const input: SizeV2Input = extractFormData(form);

  const errors: string[] = [];

  if (!input.name) {
    errors.push("Name is required.");
  }

  return {
    data: errors.length > 0 ? null : input,
    errors,
  };
}

function extractFormData(form: FormData): SizeV2Input {
  const name = form.get("name") as string | null;

  return {
    name,
  };
}

export async function softDeleteSizeV2(id: number) {
  const deleted = await softDelete(db, sizesV2, sizesV2.id, id);

  return deleted;
}

export async function softDeleteSizeV2Pivot(id: number) {
  return await db
    .update(productSizes)
    .set({ deletedAt: new Date() })
    .where(eq(productSizes.sizeId, id));
}
