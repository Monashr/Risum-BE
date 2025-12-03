import { isNull } from "drizzle-orm";
import { db } from "../db/client";
import { materials } from "../db/schema";
import { MaterialInput, MaterialValidation } from "../DTO/materialDTO";

export async function getManyMaterial() {
  return await db.query.materials.findMany({
    where: isNull(materials.deletedAt),
  });
}

export async function insertMaterial(tx: any, name: string, productId: number) {
  return tx
    .insert(materials)
    .values({
      name,
      pictureName: null,
      pictureUrl: null,
      productId,
    })
    .returning();
}

export function parseMaterialFormData(form: FormData): MaterialValidation {
  const input: MaterialInput = extractFormData(form);

  const errors: string[] = [];

  if (!input.name) {
    errors.push("Name is required.");
  }

  if (!input.productId || isNaN(input.productId)) {
    errors.push("Product ID is required and must be a number.");
  }

  return {
    data: errors.length > 0 ? null : input,
    errors,
  };
}

function extractFormData(form: FormData): MaterialInput {
  const name = form.get("name") as string | null;

  const productIdRaw = form.get("productId");
  const productId = typeof productIdRaw === "string" ? Number(productIdRaw) : null;

  const file = form.get("picture") as File | null;

  return {
    name,
    productId: isNaN(productId!) ? null : productId,
    file,
  };
}
