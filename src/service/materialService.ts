import { isNull } from "drizzle-orm";
import { db } from "../db/client";
import { materials, variants } from "../db/schema";

export interface MaterialInput {
  name: string | null;
  productId: number | null;
  file: File | null;
}

export interface MaterialValidation {
  data: MaterialInput | null;
  errors: string[];
}

export async function getManyMaterial() {
  return await db.query.materials.findMany({
    where: isNull(materials.deletedAt),
  });
}

export async function insertMaterial(name: string, productId: number) {
  return db
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
  const name = form.get("name");
  const productId = form.get("productId");
  const file = form.get("picture");

  const errors: string[] = [];

  const parsed: MaterialInput = {
    name: typeof name === "string" ? name.trim() : null,
    productId: typeof productId === "string" ? Number(productId) : null,
    file: file instanceof File ? file : null,
  };

  if (!parsed.name) errors.push("Name is required.");
  if (!parsed.productId || isNaN(parsed.productId)) {
    errors.push("Product ID is required and must be a number.");
  }

  return {
    data: errors.length > 0 ? null : parsed,
    errors,
  };
}
