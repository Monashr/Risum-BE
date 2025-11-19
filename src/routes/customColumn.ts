import { Hono } from "hono";
import { supabase } from "../utils/supabase";
import { db } from "../db/client";
import { customColumns } from "../db/schema";
import { eq } from "drizzle-orm";
import { getCurrentDateNumber } from "../utils/getCurrentDate";
import { softDelete } from "../db/utils/softDeletes";
import { authMiddleware } from "../middleware/auth";

export const customColumnRoute = new Hono()

  // ---------------------------
  // GET ALL
  // ---------------------------
  // .get("/", async (c) => {
  //   const result = await db.query.customColumns.findMany();
  //   return c.json({ customColumns: result });
  // })

  // ---------------------------
  // GET BY ID
  // ---------------------------
  // .get("/:id{[0-9]+}", async (c) => {
  //   const id = Number(c.req.param("id"));

  //   const result = await db.query.customColumns.findFirst({
  //     where: eq(customColumns.id, id),
  //   });

  //   if (!result) return c.notFound();

  //   return c.json({ customColumn: result });
  // })

  // ---------------------------
  // CREATE (DELETE OLD FIRST)
  // ---------------------------
  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const form = await c.req.formData();

    const name = form.get("name") as string | null;
    const productId = Number(form.get("productId"));
    const description = (form.get("description") as string) || null;
    const file = form.get("picture") as File | null;

    if (!name || !productId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const result = await db.transaction(async (tx) => {
      // DELETE EXISTING ROW FOR THIS PRODUCT
      await softDelete(tx, customColumns, customColumns.productId, productId);

      // INSERT NEW ROW
      const [inserted] = await tx
        .insert(customColumns)
        .values({
          name,
          description,
          productId,
          pictureName: null,
          pictureUrl: null,
        })
        .returning();

      if (!inserted) throw new Error("Failed to insert");

      // HANDLE IMAGE UPLOAD
      let fileName: string | null = null;
      let imageUrl: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        fileName = `customColumn_${inserted.id}_${getCurrentDateNumber()}.${ext}`;

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
          .update(customColumns)
          .set({
            pictureName: fileName,
            pictureUrl: imageUrl,
          })
          .where(eq(customColumns.id, inserted.id));
      }

      return { inserted, fileName, imageUrl };
    });

    const { inserted, fileName, imageUrl } = result;

    return c.json(
      {
        customColumn: {
          ...inserted,
          pictureName: fileName,
          pictureUri: imageUrl,
        },
      },
      201,
    );
  })

  // ---------------------------
  // UPDATE
  // ---------------------------
  // .put("/:id{[0-9]+}", async (c) => {
  //   const id = Number(c.req.param("id"));
  //   const form = await c.req.formData();

  //   const name = form.get("name") as string | null;
  //   const productId = Number(form.get("productId"));
  //   const description = (form.get("description") as string) || null;
  //   const file = form.get("picture") as File | null;

  //   if (!name || !productId) {
  //     return c.json({ error: "Missing required fields" }, 400);
  //   }

  //   const existing = await db.query.customColumns.findFirst({
  //     where: eq(customColumns.id, id),
  //   });

  //   if (!existing) return c.json({ error: "Custom Column not found" }, 404);

  //   let imageUrl = existing.pictureUrl;
  //   let imageName = existing.pictureName;

  //   if (file) {
  //     const ext = file.name.split(".").pop() || "jpg";
  //     const newName = `customColumn_${id}_${getCurrentDateNumber()}.${ext}`;

  //     if (existing.pictureName) {
  //       await supabase.storage.from("variant_images").remove([existing.pictureName]);
  //     }

  //     const { error } = await supabase.storage.from("variant_images").upload(newName, file);

  //     if (error) return c.json({ error: error.message }, 500);

  //     const { data: publicUrlData } = supabase.storage.from("variant_images").getPublicUrl(newName);

  //     imageUrl = publicUrlData.publicUrl;
  //     imageName = newName;
  //   }

  //   const [updated] = await db
  //     .update(customColumns)
  //     .set({
  //       name,
  //       description,
  //       productId,
  //       pictureUrl: imageUrl,
  //       pictureName: imageName,
  //     })
  //     .where(eq(customColumns.id, id))
  //     .returning();

  //   return c.json({ customColumn: updated });
  // })

  // ---------------------------
  // DELETE
  // ---------------------------
  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));

    const deleted = softDelete(db, customColumns, customColumns.id, id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    // if (deleted.pictureName) {
    //   await supabase.storage.from("variant_images").remove([deleted.pictureName]);
    // }

    return c.json({ deleted });
  });
