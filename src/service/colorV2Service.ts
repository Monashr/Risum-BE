import { eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { colorsV2, productColors } from "../db/schema";
import { softDelete } from "../db/utils/softDeletes";
import { ColorV2Input, ColorV2Validation } from "../DTO/colorV2DTO";

export type ColorV2 = typeof colorsV2.$inferSelect;

export async function getManyColorV2() {
  return await db.query.colorsV2.findMany({
    where: isNull(colorsV2.deletedAt),
  });
}

export async function insertColorV2(
  tx: any,
  name: string,
  code: string,
  minimumOrder: number,
  specialColor: boolean,
) {
  return tx
    .insert(colorsV2)
    .values({
      name,
      code,
      minimumOrder,
      specialColor,
    })
    .returning();
}

export function parseColorV2FormData(form: FormData): ColorV2Validation {
  const input: ColorV2Input = extractFormData(form);

  const errors: string[] = [];

  if (!input.name) {
    errors.push("Name is required.");
  }

  if (!input.code) {
    errors.push("Code is required.");
  }

  return {
    data: errors.length > 0 ? null : input,
    errors,
  };
}

function extractFormData(form: FormData): ColorV2Input {
  const name = form.get("name") as string | null;
  const code = form.get("code") as string | null;
  const specialColor= form.get("specialColor") === "true" || false;
  const minimumOrder = form.get("minimumOrder") as number | null;

  return {
    name,
    code,
    specialColor,
    minimumOrder,
  };
}

export async function softDeleteColorV2(id: number) {
  const deleted = await softDelete(db, colorsV2, colorsV2.id, id);

  return deleted;
}

export async function softDeleteColorV2Pivot(id: number) {
  return await db
    .update(productColors)
    .set({ deletedAt: new Date() })
    .where(eq(productColors.colorId, id));
}
