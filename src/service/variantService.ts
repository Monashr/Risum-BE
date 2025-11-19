import { isNull } from "drizzle-orm";
import { db } from "../db/client";
import { variants } from "../db/schema";

export interface VariantInput {
  name: string | null;
  additionPrice: number | null;
  productId: number | null;
  file: File | null;
}

export interface VariantValidation {
  data: VariantInput | null;
  errors: string[];
}

export async function getManyVariants() {
  return await db.query.variants.findMany({
    where: isNull(variants.deletedAt),
  });
}

export async function insertVariant(
  tx: any,
  name: string,
  additionPrice: number,
  productId: number,
) {
  return tx
    .insert(variants)
    .values({
      name,
      additionPrice,
      pictureName: null,
      pictureUrl: null,
      productId,
    })
    .returning();
}

export function parseVariantFormData(form: FormData): VariantValidation {
  const name = form.get("name");
  const additionPrice = form.get("additionPrice");
  const productId = form.get("productId");
  const file = form.get("picture");

  const errors: string[] = [];

  const parsed: VariantInput = {
    name: typeof name === "string" ? name.trim() : null,
    additionPrice: typeof additionPrice === "string" ? Number(additionPrice) : null,
    productId: typeof productId === "string" ? Number(productId) : null,
    file: file instanceof File ? file : null,
  };

  if (!parsed.name) errors.push("Name is required.");
  if (parsed.additionPrice === null || isNaN(parsed.additionPrice)) {
    errors.push("Addition price is required and must be a number.");
  }
  if (!parsed.productId || isNaN(parsed.productId)) {
    errors.push("Product ID is required and must be a number.");
  }

  return {
    data: errors.length > 0 ? null : parsed,
    errors,
  };
}
