import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/client";
import { products, sizes } from "../db/schema";
import { eq } from "drizzle-orm";
import { getCurrentDateNumber } from "../utils/getCurrentDate";
import { supabase } from "../utils/supabase";
import { authMiddleware } from "../middleware/auth";

const sizeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  productId: z.number().int().positive(),
});

const createSizeSchema = sizeSchema.omit({ id: true });

const updateSizeSchema = createSizeSchema.partial();

export const sizeRoute = new Hono()

  .get("/", async (c) => {
    const result = await db.query.sizes.findMany();
    return c.json({ sizes: result });
  })

  .post("/", authMiddleware(), zValidator("json", createSizeSchema), async (c) => {
    const data = c.req.valid("json");
    const [inserted] = await db.insert(sizes).values(data).returning();
    return c.json({ size: inserted }, 201);
  })

  .get("/:id{[0-9]+}", async (c) => {
    const id = Number(c.req.param("id"));

    const result = await db.query.sizes.findFirst({
      where: eq(sizes.id, id),
    });

    if (!result) {
      console.log("size not found");
      return c.notFound();
    }

    return c.json({ size: result });
  })

  .put("/:id{[0-9]+}", authMiddleware(), zValidator("json", updateSizeSchema), async (c) => {
    const id = Number(c.req.param("id"));
    const updates = c.req.valid("json");

    const [updated] = await db.update(sizes).set(updates).where(eq(sizes.id, id)).returning();

    if (!updated) {
      return c.notFound();
    }

    return c.json({ size: updated });
  })

  .delete("/:id{[0-9]+}", authMiddleware(true), async (c) => {
    const id = Number(c.req.param("id"));
    const [deleted] = await db.delete(sizes).where(eq(sizes.id, id)).returning();

    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ deleted });
  })

  .put("/:id{[0-9]+}/picture", authMiddleware(), async (c) => {
    const id = Number(c.req.param("id"));
    const form = await c.req.formData();

    const file = form.get("picture") as File | null;

    if (!file) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
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

      const { data, error } = await supabase.storage.from("variant_images").upload(filePath, file);

      if (error) {
        console.error(error);
        return c.json({ error: error.message }, 500);
      }

      imageName = filePath;

      const { data: publicUrlData } = supabase.storage
        .from("variant_images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const [updated] = await db
      .update(products)
      .set({
        sizeImageUrl: imageUrl ?? existing.sizeImageUrl,
        sizeImageName: imageName ?? existing.sizeImageName,
      })
      .where(eq(products.id, id))
      .returning();

    return c.json({ product: updated! });
  });
