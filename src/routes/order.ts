import { Hono } from "hono";
import { supabase } from "../utils/supabase";
import { db } from "../db/client";
import { orders, orderDetails } from "../db/schema";
import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getCurrentDateNumber } from "../utils/getCurrentDate";
import { getCurrentUser } from "../utils/getCurrentUser";
import { products } from "../db/schema/products";

// ---------------------
// ZOD SCHEMAS
// ---------------------

const orderDetailSchema = z.object({
  orderId: z.string(),
  productId: z.coerce.number(),

  size: z.string().nullable().optional(),
  materialId: z.number().nullable().optional(),
  variantId: z.number().nullable().optional(),
  colorId: z.number().nullable().optional(),

  borderLengthId: z.number().nullable().optional(),
  borderLengthAmount: z.number().nullable().optional(),

  customColumnId: z.number().nullable().optional(),
  customColumnAnswer: z.string().nullable().optional(),

  logoName: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),

  designName: z.string().nullable().optional(),
  designUrl: z.string().nullable().optional(),

  text: z.string().nullable().optional(),
  quantity: z.number().min(1),
  totalPrice: z.number().min(0),
});

const createOrderDetailSchema = orderDetailSchema.omit({
  orderId: true,
  logoName: true,
  logoUrl: true,
  designName: true,
  designUrl: true,
});

const orderSchema = z.object({
  customerId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  address: z.string(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// ---------------------
// ROUTE
// ---------------------

export const orderRoute = new Hono()

  // -----------------------------
  // GET ALL ORDERS
  // -----------------------------
  .get("/", async (c) => {
    const parsed = paginationSchema.parse({
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    });

    const offset = (parsed.page - 1) * parsed.limit;

    // COUNT TOTAL ORDERS
    const total = await db.select({ count: count() }).from(orders);

    // PAGINATED ORDERS
    const result = await db.query.orders.findMany({
      limit: parsed.limit,
      offset,
      orderBy: (t, { desc }) => desc(t.createdAt),
      with: {
        orderDetails: true,
        customer: true,
      },
    });

    return c.json({
      page: parsed.page,
      limit: parsed.limit,
      data: result,
      total: total[0]?.count ?? 0,
      hasMore: offset + result.length < (total[0]?.count ?? 0),
    });
  })

  // -----------------------------
  // GET ORDERS BY USER
  // -----------------------------
  .get("/user/user", async (c) => {
    const user = await getCurrentUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userId = user.id;

    const result = await db.query.orders.findMany({
      where: (t, { eq }) => eq(t.customerId, userId),
      with: {
        orderDetails: {
          with: {
            products: true,
          },
        },
        customer: true,
      },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });

    return c.json({ orders: result });
  })

  // -----------------------------
  // GET ORDER BY ID
  // -----------------------------
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const result = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        orderDetails: true,
        customer: true,
      },
    });

    if (!result) return c.json({ error: "Order not found" }, 404);

    return c.json({ order: result });
  })

  // -----------------------------
  // CREATE ORDER (multipart)
  // -----------------------------
  .post("/", authMiddleware(), async (c) => {
    const form = await c.req.formData();

    const orderJson = form.get("order") as string | null;
    const itemsJson = form.get("items") as string | null;

    if (!orderJson || !itemsJson) {
      return c.json({ error: "Missing order or items" }, 400);
    }
    console.log(itemsJson);

    const orderData = orderSchema.parse(JSON.parse(orderJson));
    const items = z.array(createOrderDetailSchema).parse(JSON.parse(itemsJson));

    const createdOrder = await db.transaction(async (tx) => {
      // Insert order
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: orderData.customerId,
          fullName: orderData.fullName,
          phone: orderData.phone,
          address: orderData.address,
          paymentImageName: null,
          paymentImageUrl: null,
        })
        .returning();

      if (!order) throw new Error("Failed to insert order");

      // Insert each order item
      for (const [index, item] of items.entries()) {
        let imageUrl: string | null = null;
        let logoUrl: string | null = null;

        // Upload item image
        const imageFile = form.get(`itemImage_${index}`) as File | null;
        let imageName = null;

        console.log("IMAGE", imageFile);

        if (imageFile) {
          imageName = `order_item_${Date.now()}_${index}.${imageFile.name.split(".").pop()}`;
          const { error: uploadError } = await supabase.storage
            .from("variant_images")
            .upload(imageName, imageFile);

          if (!uploadError) {
            const { data } = supabase.storage.from("variant_images").getPublicUrl(imageName);
            imageUrl = data.publicUrl;
            console.log("ERROR, ", uploadError);
          }
        }

        // Upload logo if exists
        const logoFile = form.get(`itemLogo_${index}`) as File | null;
        let logoName = null;

        console.log("LOGO ", logoFile);
        if (logoFile) {
          logoName = `order_logo_${Date.now()}_${index}.${logoFile.name.split(".").pop()}`;
          const { error: uploadError } = await supabase.storage
            .from("variant_images")
            .upload(logoName, logoFile);

          if (!uploadError) {
            const { data } = supabase.storage.from("variant_images").getPublicUrl(logoName);
            logoUrl = data.publicUrl;
            console.log("ERROR, ", uploadError);
          }
        }

        await tx.insert(orderDetails).values({
          orderId: order.id as any, // UUID -> any for insertion
          productId: item.productId,

          size: item.size ?? null,
          materialId: item.materialId ?? null,
          variantId: item.variantId ?? null,
          colorId: item.colorId ?? null,

          borderLengthId: item.borderLengthId ?? null,
          borderLengthAmount: item.borderLengthAmount ?? 0,

          logoName: logoName ?? null,
          logoUrl: logoUrl ?? null,

          designName: imageName ?? null,
          designUrl: imageUrl ?? null,

          customColumnId: item.customColumnId ?? null,
          customColumnAnswer: item.customColumnAnswer ?? null,

          text: item.text ?? null,

          quantity: item.quantity,
          totalPrice: item.totalPrice,
        });
      }

      return order;
    });

    return c.json({ order: createdOrder }, 201);
  })

  // -----------------------------
  // UPLOAD PAYMENT IMAGE
  // -----------------------------
  .put("/:id/payment-image", authMiddleware(), async (c) => {
    const id = c.req.param("id");
    const form = await c.req.formData();

    const file = form.get("paymentImage") as File | null;

    if (!file) {
      return c.json({ error: "Missing payment image" }, 400);
    }

    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!existing) {
      return c.json({ error: "Order not found" }, 404);
    }

    let imageUrl: string | null = null;
    let imageName: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      imageName = `payment_${id}_${getCurrentDateNumber()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("variant_images")
        .upload(imageName, file);

      if (uploadError) {
        console.error(uploadError);
        return c.json({ error: uploadError.message }, 500);
      }

      const { data: publicUrlData } = supabase.storage
        .from("variant_images")
        .getPublicUrl(imageName);

      imageUrl = publicUrlData.publicUrl;
    }

    const [updated] = await db
      .update(orders)
      .set({
        paymentImageUrl: imageUrl,
        paymentImageName: imageName,
      })
      .where(eq(orders.id, id))
      .returning();

    return c.json({ order: updated });
  });
