import { eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { materialsV2, productMaterials } from "../db/schema";
import { MaterialV2Input, MaterialV2Validation } from "../DTO/materialV2DTO";
import { supabase } from "../utils/supabase";
import { softDelete } from "../db/utils/softDeletes";

export type MaterialV2 = typeof materialsV2.$inferSelect;

export async function getManyMaterialV2() {
  return await db.query.materialsV2.findMany({
    where: isNull(materialsV2.deletedAt),
  });
}

export async function insertMaterialV2(tx: any, name: string) {
  return tx
    .insert(materialsV2)
    .values({
      name,
      pictureName: null,
    })
    .returning();
}

export function parseMaterialV2FormData(form: FormData): MaterialV2Validation {
  const input: MaterialV2Input = extractFormData(form);

  const errors: string[] = [];

  if (!input.name) {
    errors.push("Name is required.");
  }

  return {
    data: errors.length > 0 ? null : input,
    errors,
  };
}

function extractFormData(form: FormData): MaterialV2Input {
  const name = form.get("name") as string | null;
  const file = form.get("picture") as File | null;

  return {
    name,
    file,
  };
}

export async function signMaterialImages(materials: MaterialV2[]) {
  return Promise.all(
    materials.map(async (material) => {
      if (!material.pictureName) return material;

      const { data, error } = await supabase.storage
        .from("variant_images")
        .createSignedUrl(material.pictureName, 60 * 60);

      if (error) {
        console.error("Signed URL error:", error);
        return material;
      }

      return {
        ...material,
        pictureUrl: data.signedUrl,
      };
    }),
  );
}

export async function softDeleteMaterialV2(id: number) {
  const deleted = await softDelete(db, materialsV2, materialsV2.id, id);

  return deleted;
}

export async function softDeleteMaterialV2Pivot(id: number) {
  return await db
    .update(productMaterials)
    .set({ deletedAt: new Date() })
    .where(eq(productMaterials.materialId, id));
}
