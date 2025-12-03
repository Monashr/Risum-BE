import { Hono } from "hono";
import { db } from "../db/client";
import { materialsV2} from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import {
  insertMaterialV2,
  parseMaterialV2FormData,
  getManyMaterialV2,
  signMaterialImages,
  softDeleteMaterialV2,
  softDeleteMaterialV2Pivot,
} from "../service/materialV2Service";
import { validateUploadedFile } from "../utils/uploadValidator";
import { supabase } from "../utils/supabase";

export const materialV2Route = new Hono()

  .get("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const result = await getManyMaterialV2();

    const signedProducts = await signMaterialImages(result);

    return c.json(signedProducts);
  })

  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const form = await c.req.formData();
    const { data, errors } = parseMaterialV2FormData(form);

    if (errors.length > 0) {
      return c.json({ errors }, 400);
    }

    const { name, file } = data!;

    if (file) {
      try {
        validateUploadedFile(file, {
          maxSizeMB: 5,
          allowedTypes: ["image/jpeg", "image/png"],
        });
      } catch (err: any) {
        return c.json({ error: err.message }, 400);
      }
    }

    const result = await db.transaction(async (tx) => {
      const insertedRows = await insertMaterialV2(tx, name!);

      if (!insertedRows || insertedRows.length === 0) {
        throw new Error("Failed to insert material");
      }

      const inserted = insertedRows[0];
      let fileName: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        fileName = `materialv2_${inserted.id}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("variant_images")
          .upload(fileName, file);

        if (uploadError) {
          console.error(uploadError);
          throw new Error(uploadError.message);
        }

        await tx
          .update(materialsV2)
          .set({
            pictureName: fileName,
          })
          .where(eq(materialsV2.id, inserted.id));
      }

      return { inserted, fileName };
    });

    const { inserted, fileName } = result;

    return c.json(
      {
        material: {
          ...inserted,
          picture_name: fileName,
        },
      },
      201,
    );
  })

  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));

    const deleted = await softDeleteMaterialV2(id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    await softDeleteMaterialV2Pivot(id);

    return c.json({ deleted });
  });
