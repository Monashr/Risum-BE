import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import {
  borderLengths,
  colors,
  customColumns,
  productMaterials,
  products,
  variants,
  productSizes,
  productColors,
} from "../db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { supabase } from "../utils/supabase";
import { getCurrentDateNumber } from "../utils/getCurrentDate";
import { softDelete } from "../db/utils/softDeletes";
import { authMiddleware } from "../middleware/auth";
import { ProductWithUrl } from "../model/productModel";

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

type WithUrl<T> = T & { pictureUrl?: string | null };

type ProductWithUrls = WithUrl<typeof products.$inferSelect> & {
  materials: { material: WithUrl<any> }[];
  variants: WithUrl<any>[];
  customColumns: WithUrl<any>[];
  sizeImageUrl?: string | null;
};

export const productRoute = new Hono()

  .get("/", authMiddleware(), async (c) => {
    const result = await db.query.products.findMany({
      orderBy: (t, { desc }) => desc(t.createdAt),
      with: {
        colors: {
          where: isNull(colors.deletedAt),
          with: {
            color: true,
          },
        },
        materials: {
          where: isNull(productMaterials.deletedAt),
          with: {
            material: true,
          },
        },
        variants: {
          where: isNull(variants.deletedAt),
        },
        sizes: {
          where: isNull(productSizes.deletedAt),
          with: {
            size: true,
          },
        },
        borderLengths: {
          where: isNull(borderLengths.deletedAt),
        },
        customColumns: {
          where: isNull(customColumns.deletedAt),
        },
      },
      where: isNull(products.deletedAt),
    });

    await Promise.all(
      result.map(async (product) => {
        const p = product as ProductWithUrls;

        // MATERIALS
        await Promise.all(
          p.materials.map(async (pm) => {
            const mat = pm.material;
            if (!mat.pictureName) return;

            const { data } = await supabase.storage
              .from("variant_images")
              .createSignedUrl(mat.pictureName, 3600);

            if (data?.signedUrl) {
              pm.material.pictureUrl = data.signedUrl;
            }
          }),
        );

        // VARIANTS
        await Promise.all(
          p.variants.map(async (v) => {
            if (!v.pictureName) return;

            const { data } = await supabase.storage
              .from("variant_images")
              .createSignedUrl(v.pictureName, 3600);

            if (data?.signedUrl) v.pictureUrl = data.signedUrl;
          }),
        );

        // CUSTOM COLUMNS
        await Promise.all(
          p.customColumns.map(async (cc) => {
            if (!cc.pictureName) return;

            const { data } = await supabase.storage
              .from("variant_images")
              .createSignedUrl(cc.pictureName, 3600);

            if (data?.signedUrl) cc.pictureUrl = data.signedUrl;
          }),
        );

        // SIZE IMAGE
        if (p.sizeImageName) {
          const { data } = await supabase.storage
            .from("variant_images")
            .createSignedUrl(p.sizeImageName, 3600);

          if (data?.signedUrl) p.sizeImageUrl = data.signedUrl;
        }

        // PRODUCT IMAGE
        if (p.pictureName) {
          const { data } = await supabase.storage
            .from("variant_images")
            .createSignedUrl(p.pictureName, 3600);

          if (data?.signedUrl) p.pictureUrl = data.signedUrl;
        }
      }),
    );

    return c.json({ data: result, total: result.length });
  })

  .get("/paginated", authMiddleware(), async (c) => {
    const parsed = paginationSchema.parse({
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    const offset = (parsed.page - 1) * parsed.limit;

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(isNull(products.deletedAt));

    const result = await db.query.products.findMany({
      limit: parsed.limit,
      offset,
      where: isNull(products.deletedAt),
    });

    const signedProducts = await Promise.all(
      result.map(async (product) => {
        if (!product.pictureName) return product;

        const { data, error } = await supabase.storage
          .from("variant_images")
          .createSignedUrl(product.pictureName, 60 * 60);

        if (error) {
          console.error("Signed URL error:", error);
          return product;
        }

        return {
          ...product,
          pictureUrl: data.signedUrl,
        };
      }),
    );

    return c.json({
      page: parsed.page,
      limit: parsed.limit,
      data: signedProducts,
      total: count,
      hasMore: offset + result.length < (count ?? 0),
    });
  })

  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
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

    const result = await db.transaction(async (tx) => {
      const insertedRows = await tx
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
          category: category,
        })
        .returning();

      if (insertedRows.length === 0) {
        throw new Error("Failed to insert product");
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
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("variant_images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;

        await tx
          .update(products)
          .set({
            pictureName: fileName,
          })
          .where(eq(products.id, inserted.id));
      }

      return { inserted, fileName, imageUrl };
    });

    const { inserted, fileName, imageUrl } = result;

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

  .get("/:id{[0-9]+}", authMiddleware(), async (c) => {
    const id = Number(c.req.param("id"));

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        materials: {
          where: isNull(productMaterials.deletedAt),
          with: {
            material: true,
          },
        },
        sizes: {
          where: isNull(productSizes.deletedAt),
          with: {
            size: true,
          },
        },
        colors: {
          where: isNull(productColors.deletedAt),
          with: {
            color: true,
          },
        },
        variants: { where: isNull(variants.deletedAt) },
        borderLengths: { where: isNull(borderLengths.deletedAt) },
        customColumns: { where: isNull(customColumns.deletedAt) },
      },
    });

    if (!product) return c.notFound();

    for (let i = 0; i < product.materials.length; i++) {
      const pm = product.materials[i];
      const mat = pm.material;

      if (!mat.pictureName) continue;

      const { data, error } = await supabase.storage
        .from("variant_images")
        .createSignedUrl(mat.pictureName, 60 * 60);

      if (!error && data?.signedUrl) {
        product.materials[i].material = {
          ...mat,
          pictureUrl: data.signedUrl,
        } as typeof mat & { pictureUrl: string };
      }
    }

    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];

      if (!variant.pictureName) continue;

      const { data, error } = await supabase.storage
        .from("variant_images")
        .createSignedUrl(variant.pictureName, 60 * 60);

      if (!error && data?.signedUrl) {
        product.variants[i] = {
          ...variant,
          pictureUrl: data.signedUrl,
        } as typeof variant & { pictureUrl: string };
      }
    }

    if (product.customColumns.length > 0) {
      for (let i = 0; i < product.customColumns.length; i++) {
        const customColumn = product.customColumns[i];

        if (!customColumn.pictureName) continue;

        const { data, error } = await supabase.storage
          .from("variant_images")
          .createSignedUrl(customColumn.pictureName, 60 * 60);

        if (!error && data?.signedUrl) {
          product.customColumns[i] = {
            ...customColumn,
            pictureUrl: data.signedUrl,
          } as typeof customColumn & { pictureUrl: string };
        }
      }
    }

    if (product.sizeImageName) {
      const { data, error } = await supabase.storage
        .from("variant_images")
        .createSignedUrl(product.sizeImageName, 60 * 60);

      if (!error && data?.signedUrl) {
        product.sizeImageUrl = data.signedUrl;
      }
    }

    if (product.pictureName) {
      const { data, error } = await supabase.storage
        .from("variant_images")
        .createSignedUrl(product.pictureName, 60 * 60);

      if (!error && data?.signedUrl) {
        const productWithUrl: ProductWithUrl = {
          ...product,
          pictureUrl: data?.signedUrl ?? null,
        };

        return c.json({ product: productWithUrl });
      }
    }

    return c.json({ product });
  })

  .put("/:id{[0-9]+}", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
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

    const file = form.get("picture") as File | null;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const updated = await db.transaction(async (tx) => {
      const existing = await tx.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!existing) {
        throw new Error("Product not found");
      }

      // let imageUrl = existing.pictureUrl;
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
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from("variant_images")
          .getPublicUrl(filePath);

        // imageUrl = publicUrlData.publicUrl;
        imageName = filePath;
      }

      const [upd] = await tx
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
          pictureName: imageName ?? existing.pictureName,
          category: category,
        })
        .where(eq(products.id, id))
        .returning();

      return upd;
    });

    if (!updated) {
      return c.notFound();
    }

    return c.json({ product: updated });
  })

  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));
    const deleted = softDelete(db, products, products.id, id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    return c.json({ deleted });
  })

  .put("/:productId{[0-9]+}/materials", authMiddleware(), async (c) => {
    const productId = Number(c.req.param("productId"));
    const { materialIds } = await c.req.json();

    // 1. Fetch existing (including soft-deleted)
    const existing = await db.query.productMaterials.findMany({
      where: eq(productMaterials.productId, productId),
    });

    const existingIds = existing.map((pm) => pm.materialId);

    // 2. Compute diffs
    const toAdd = materialIds.filter((id: number) => !existingIds.includes(id));

    const toRestore = existing
      .filter((pm) => pm.deletedAt !== null && materialIds.includes(pm.materialId))
      .map((pm) => pm.materialId);

    const toSoftDelete = existing
      .filter((pm) => pm.deletedAt === null && !materialIds.includes(pm.materialId))
      .map((pm) => pm.materialId);

    // 3. DB actions
    if (toAdd.length > 0) {
      await db.insert(productMaterials).values(
        toAdd.map((id: number) => ({
          productId: productId,
          materialId: id,
          deletedAt: null,
        })),
      );
    }

    if (toRestore.length > 0) {
      await db
        .update(productMaterials)
        .set({ deletedAt: null })
        .where(
          and(
            eq(productMaterials.productId, productId),
            inArray(productMaterials.materialId, toRestore),
          ),
        );
    }

    if (toSoftDelete.length > 0) {
      await db
        .update(productMaterials)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(productMaterials.productId, productId),
            inArray(productMaterials.materialId, toSoftDelete),
          ),
        );
    }

    return c.json({ success: true });
  })

  .put("/:productId{[0-9]+}/sizes", authMiddleware(), async (c) => {
    const productId = Number(c.req.param("productId"));
    const { sizeIds } = await c.req.json();

    // 1. Fetch existing (including soft-deleted)
    const existing = await db.query.productSizes.findMany({
      where: eq(productSizes.productId, productId),
    });

    const existingIds = existing.map((ps) => ps.sizeId);

    // 2. Compute diffs
    const toAdd = sizeIds.filter((id: number) => !existingIds.includes(id));

    const toRestore = existing
      .filter((ps) => ps.deletedAt !== null && sizeIds.includes(ps.sizeId))
      .map((ps) => ps.sizeId);

    const toSoftDelete = existing
      .filter((ps) => ps.deletedAt === null && !sizeIds.includes(ps.sizeId))
      .map((ps) => ps.sizeId);

    // 3. DB actions
    if (toAdd.length > 0) {
      await db.insert(productSizes).values(
        toAdd.map((id: number) => ({
          productId: productId,
          sizeId: id,
          deletedAt: null,
        })),
      );
    }

    if (toRestore.length > 0) {
      await db
        .update(productSizes)
        .set({ deletedAt: null })
        .where(and(eq(productSizes.productId, productId), inArray(productSizes.sizeId, toRestore)));
    }

    if (toSoftDelete.length > 0) {
      await db
        .update(productSizes)
        .set({ deletedAt: new Date() })
        .where(
          and(eq(productSizes.productId, productId), inArray(productSizes.sizeId, toSoftDelete)),
        );
    }

    return c.json({ success: true });
  })

  .put("/:productId{[0-9]+}/colors", authMiddleware(), async (c) => {
    const productId = Number(c.req.param("productId"));
    const { colorIds } = await c.req.json();

    // 1. Fetch existing (including soft-deleted)
    const existing = await db.query.productColors.findMany({
      where: eq(productColors.productId, productId),
    });

    const existingIds = existing.map((pc) => pc.colorId);

    // 2. Compute diffs
    const toAdd = colorIds.filter((id: number) => !existingIds.includes(id));

    const toRestore = existing
      .filter((pc) => pc.deletedAt !== null && colorIds.includes(pc.colorId))
      .map((pc) => pc.colorId);

    const toSoftDelete = existing
      .filter((pc) => pc.deletedAt === null && !colorIds.includes(pc.colorId))
      .map((pc) => pc.colorId);

    // 3. DB actions
    if (toAdd.length > 0) {
      await db.insert(productColors).values(
        toAdd.map((id: number) => ({
          productId: productId,
          colorId: id,
          deletedAt: null,
        })),
      );
    }

    if (toRestore.length > 0) {
      await db
        .update(productColors)
        .set({ deletedAt: null })
        .where(
          and(eq(productColors.productId, productId), inArray(productColors.colorId, toRestore)),
        );
    }

    if (toSoftDelete.length > 0) {
      await db
        .update(productColors)
        .set({ deletedAt: new Date() })
        .where(
          and(eq(productColors.productId, productId), inArray(productColors.colorId, toSoftDelete)),
        );
    }

    return c.json({ success: true });
  });
