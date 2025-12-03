import { Hono } from "hono";
import { db } from "../db/client";
import { authMiddleware } from "../middleware/auth";
import {
  getManySizeV2,
  insertSizeV2,
  parseSizeV2FormData,
  softDeleteSizeV2,
  softDeleteSizeV2Pivot,
} from "../service/sizeV2Service";
import { eq } from "drizzle-orm";
import { products } from "../db/schema";
import { getCurrentDateNumber } from "../utils/getCurrentDate";
import { supabase } from "../utils/supabase";

export const sizeV2Route = new Hono()

  .get("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const result = await getManySizeV2();

    return c.json(result);
  })

  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const form = await c.req.formData();
    const { data, errors } = parseSizeV2FormData(form);

    if (errors.length > 0) {
      return c.json({ errors }, 400);
    }

    const insertedRows = await insertSizeV2(db, data?.name!);

    return c.json(
      {
        size: {
          insertedRows,
        },
      },
      201,
    );
  })

  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));

    // 1. soft delete the size
    const deleted = await softDeleteSizeV2(id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    // 2. soft delete all related pivot rows
    await softDeleteSizeV2Pivot(id);

    return c.json({ deleted });
  })

  .put("/:id{[0-9]+}/picture", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const id = Number(c.req.param("id"));
    const form = await c.req.formData();

    const file = form.get("picture") as File | null;

    if (!file) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const updated = await db.transaction(async (tx) => {
      const existing = await tx.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!existing) {
        throw new Error("Product not found");
      }

      let imageUrl = existing.sizeImageUrl;
      let imageName = existing.sizeImageName;

      if (file) {
        const ext = file.name.split(".").pop() || "jpg";

        const filePath = `size_${id}_${getCurrentDateNumber()}.${ext}`;

        if (imageName != null) {
          const { data, error } = await supabase.storage
            .from("variant_images")
            .remove([existing.sizeImageName!]);

          console.log("removing image", data);
        }

        const { data, error } = await supabase.storage
          .from("variant_images")
          .upload(filePath, file);

        if (error) {
          console.error(error);
          throw new Error(error.message);
        }

        imageName = filePath;

        const { data: publicUrlData } = supabase.storage
          .from("variant_images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const [upd] = await tx
        .update(products)
        .set({
          sizeImageUrl: imageUrl ?? existing.sizeImageUrl,
          sizeImageName: imageName ?? existing.sizeImageName,
        })
        .where(eq(products.id, id))
        .returning();

      return upd;
    });

    return c.json({ product: updated! });
  });
