import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { materials } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { insertMaterial, parseMaterialFormData } from "../service/materialService";
import { validateUploadedFile } from "../utils/uploadValidator";
import { supabase } from "../utils/supabase";

const materialSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  productId: z.number().int().positive(),
});

const createMaterialSchema = materialSchema.omit({ id: true });

const updateMaterialSchema = createMaterialSchema.partial();

export const materialRoute = new Hono()

  // .get("/", async (c) => {
  //   const result = await db.query.materials.findMany();
  //   return c.json({ materials: result });
  // })

  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const form = await c.req.formData();
    const { data, errors } = parseMaterialFormData(form);

    if (errors.length > 0) {
      return c.json({ errors }, 400);
    }

    const { name, productId, file } = data!;

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
      const insertedRows = await insertMaterial(tx, name!, productId!);

      if (!insertedRows || insertedRows.length === 0) {
        throw new Error("Failed to insert material");
      }

      const inserted = insertedRows[0];
      let imageUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        fileName = `material_${inserted.id}_${Date.now()}.${ext}`;

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
          .update(materials)
          .set({
            pictureName: fileName,
            pictureUrl: imageUrl,
          })
          .where(eq(materials.id, inserted.id));
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

  // .get("/:id{[0-9]+}", async (c) => {
  //   const id = Number(c.req.param("id"));

  //   const result = await db.query.materials.findFirst({
  //     where: eq(materials.id, id),
  //   });

  //   if (!result) {
  //     return c.notFound();
  //   }

  //   return c.json({ material: result });
  // })

  // .put("/:id{[0-9]+}", authMiddleware(), zValidator("json", updateMaterialSchema), async (c) => {
  //   const id = Number(c.req.param("id"));
  //   const updates = c.req.valid("json");

  //   const [updated] = await db
  //     .update(materials)
  //     .set(updates)
  //     .where(eq(materials.id, id))
  //     .returning();

  //   if (!updated) {
  //     return c.notFound();
  //   }

  //   return c.json({ material: updated });
  // })

  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));
    const [deleted] = await db.delete(materials).where(eq(materials.id, id)).returning();

    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ deleted });
  });
