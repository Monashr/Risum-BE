import { Hono } from "hono";
import { supabase } from "../utils/supabase";
import { db } from "../db/client";
import { variants } from "../db/schema";
import { eq } from "drizzle-orm";
import { insertVariant, parseVariantFormData } from "../service/variantService";
import { validateUploadedFile } from "../utils/uploadValidator";
import { softDelete } from "../db/utils/softDeletes";
import { authMiddleware } from "../middleware/auth";

export const variantRoute = new Hono()
  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const form = await c.req.formData();
    const { data, errors } = parseVariantFormData(form);

    if (errors.length > 0) {
      return c.json({ errors }, 400);
    }

    const { name, additionPrice, productId, file } = data!;

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
      const insertedRows = await insertVariant(tx, name!, additionPrice!, productId!);

      if (!insertedRows || insertedRows.length === 0) {
        throw new Error("Failed to insert variant");
      }

      const inserted = insertedRows[0];
      let imageUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        fileName = `variant_${inserted.id}_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("variant_images")
          .upload(fileName, file);

        if (uploadError) {
          console.error(uploadError);
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("variant_images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;

        await tx
          .update(variants)
          .set({
            pictureName: fileName,
            pictureUrl: imageUrl,
          })
          .where(eq(variants.id, inserted.id));
      }

      return { inserted, imageUrl, fileName };
    });

    const { inserted, imageUrl, fileName } = result;

    return c.json(
      {
        variant: {
          ...inserted,
          picture_uri: imageUrl,
          picture_name: fileName,
        },
      },
      201,
    );
  })

  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));

    const updated = softDelete(db, variants, variants.id, id);

    if (!updated) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({
      variant: updated,
    });
  });
