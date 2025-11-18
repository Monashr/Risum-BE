import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { borderLengths, colors, customColumns, products, variants } from "../db/schema";
import { count, eq, isNull } from "drizzle-orm";
import { sizes } from "../db/schema";
import { materials } from "../db/schema/materials";
import { supabase } from "../utils/supabase";
import { getCurrentDateNumber } from "../utils/getCurrentDate";
import { softDelete } from "../db/utils/softDeletes";
import { authMiddleware } from "../middleware/auth";

const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  price: z.number().nonnegative(),
  size: z.boolean().default(false),
  sizeImage: z.string().optional(),
  material: z.boolean().default(false),
  variant: z.boolean().default(false),
  color: z.boolean().default(false),
  customColumn: z.boolean().default(false),
  canAddText: z.boolean().default(false),
  canAddBorderLength: z.boolean().default(false),
  canAddLogo: z.boolean().default(false),
  pictureName: z.string().optional(),
  pictureUri: z.string().optional(),
  category: z.string().optional(),
});

const createProductSchema = productSchema.omit({
  id: true,
  sizeImage: true,
  pictureName: true,
  pictureUri: true,
});

const updateProductSchema = createProductSchema.partial();

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const productRoute = new Hono()

  .get("/", async (c) => {
    const result = await db.query.products.findMany({
      orderBy: (t, { desc }) => desc(t.createdAt),
      with: {
        colors: {
          where: isNull(colors.deletedAt),
        },
        materials: true,
        variants: {
          where: isNull(colors.deletedAt),
        },
        sizes: true,
        borderLengths: {
          where: isNull(borderLengths.deletedAt),
        },
        customColumns: {
          where: isNull(customColumns.deletedAt),
        },
      },
      where: isNull(products.deletedAt),
    });

    return c.json({ data: result, total: result.length });
  })

  .get("/paginated", async (c) => {
    const parsed = paginationSchema.parse({
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    const offset = (parsed.page - 1) * parsed.limit;

    const result = await db.query.products.findMany({
      limit: parsed.limit,
      offset,
      where: isNull(products.deletedAt),
    });

    const total = result.length;

    return c.json({
      page: parsed.page,
      limit: parsed.limit,
      data: result,
      total: result.length,
      hasMore: offset + result.length < (total ?? 0),
    });
  })

  .post("/", authMiddleware(), async (c) => {
    const form = await c.req.formData();

    const name = form.get("name") as string | null;
    const price = Number(form.get("price"));
    const size = form.get("size") === "true";
    const material = form.get("material") === "true";
    const variant = form.get("variant") === "true";
    const color = form.get("color") === "true";
    const customColumn = form.get("customColumn") === "true";
    const canAddText = form.get("canAddText") === "true";
    const canAddBorderLength = form.get("canAddBorderLength") === "true";
    const canAddLogo = form.get("canAddLogo") === "true";
    const sizeImage = form.get("sizeImage") as string | null;
    const file = form.get("picture") as File | null;
    const category = (form.get("category") as string) || null;

    if (!name || !price) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const insertedRows = await db
      .insert(products)
      .values({
        name,
        price,
        size,
        material,
        variant,
        color,
        customColumn,
        canAddText,
        canAddBorderLength,
        canAddLogo,
        sizeImageName: sizeImage,
        sizeImageUrl: sizeImage,
        pictureName: null,
        pictureUrl: null,
        category: category,
      })
      .returning();

    if (insertedRows.length === 0) {
      return c.json({ error: "Failed to insert product" }, 500);
    }

    const inserted = insertedRows[0]!;

    let imageUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      fileName = `product_${inserted.id}_${getCurrentDateNumber()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("variant_images")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        return c.json({ error: uploadError.message }, 500);
      }

      const { data: publicUrlData } = supabase.storage
        .from("variant_images")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;

      await db
        .update(products)
        .set({
          pictureName: fileName,
          pictureUrl: imageUrl,
        })
        .where(eq(products.id, inserted.id));
    }

    return c.json(
      {
        product: {
          ...inserted,
          pictureName: fileName,
          pictureUri: imageUrl,
        },
      },
      201,
    );
  })

  .get("/:id{[0-9]+}", async (c) => {
    const id = Number(c.req.param("id"));

    const result = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        materials: true,
        sizes: true,
        variants: {
          where: isNull(variants.deletedAt),
        },
        colors: {
          where: isNull(colors.deletedAt),
        },
        borderLengths: {
          where: isNull(borderLengths.deletedAt),
        },
        customColumns: {
          where: isNull(customColumns.deletedAt),
        },
      },
    });

    if (!result) {
      return c.notFound();
    }

    return c.json({ product: result });
  })

  .put("/:id{[0-9]+}", authMiddleware(), async (c) => {
    const id = Number(c.req.param("id"));
    const form = await c.req.formData();

    const name = form.get("name") as string | null;
    const category = form.get("category") as string | null;
    const price = form.get("price") ? Number(form.get("price")) : undefined;
    const size =
      form.get("size") === "true" ? true : form.get("size") === "false" ? false : undefined;
    const material =
      form.get("material") === "true" ? true : form.get("material") === "false" ? false : undefined;
    const variant =
      form.get("variant") === "true" ? true : form.get("variant") === "false" ? false : undefined;
    const color =
      form.get("color") === "true" ? true : form.get("color") === "false" ? false : undefined;
    const canAddText =
      form.get("canAddText") === "true"
        ? true
        : form.get("canAddText") === "false"
          ? false
          : undefined;
    const canAddBorderLength =
      form.get("canAddBorderLength") === "true"
        ? true
        : form.get("canAddBorderLength") === "false"
          ? false
          : undefined;
    const canAddLogo =
      form.get("canAddLogo") === "true"
        ? true
        : form.get("canAddLogo") === "false"
          ? false
          : undefined;
    const customColumn =
      form.get("customColumn") === "true"
        ? true
        : form.get("customColumn") === "false"
          ? false
          : undefined;
    // const sizeImage = form.get("sizeImage") as string | null;
    const file = form.get("picture") as File | null;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }

    let imageUrl = existing.pictureUrl;
    let imageName = existing.pictureName;

    if (file) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `product_${id}_${getCurrentDateNumber()}.${fileExt}`;

      if (imageName != null) {
        await supabase.storage.from("variant_images").remove([imageName]);
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("variant_images")
        .upload(filePath, file, {
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error(uploadError);
        return c.json({ error: uploadError.message }, 500);
      }

      const { data: publicUrlData } = supabase.storage
        .from("variant_images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
      imageName = filePath;
    }

    const [updated] = await db
      .update(products)
      .set({
        name,
        price,
        size,
        material,
        variant,
        color,
        customColumn,
        canAddText,
        canAddBorderLength,
        canAddLogo,
        pictureUrl: imageUrl ?? existing.pictureUrl,
        pictureName: imageName ?? existing.pictureName,
        category: category,
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return c.notFound();
    }

    return c.json({ product: updated });
  })

  .delete("/:id{[0-9]+}", authMiddleware(true), async (c) => {
    const id = Number(c.req.param("id"));
    const deleted = softDelete(db, products, products.id, id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    return c.json({ deleted });
  });
