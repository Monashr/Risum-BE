import { Hono } from "hono";
import { db } from "../db/client";
import { borderLengths } from "../db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { softDelete } from "../db/utils/softDeletes";
import { authMiddleware } from "../middleware/auth";

const borderLengthSchema = z.object({
  id: z.number().int().positive(),
  maxLength: z.number().min(1),
  costPerLength: z.number().min(1),
  productId: z.number().int().positive(),
});

const createborderLengthSchema = borderLengthSchema.omit({ id: true });

const updateborderLengthSchema = createborderLengthSchema.partial();

export const borderLengthsRoute = new Hono()
  // .get("/", async (c) => {
  //   const result = await db.query.borderLengths.findMany();
  //   return c.json({ borderLengths: result });
  // })

  // .get("/:id{[0-9]+}", async (c) => {
  //   const id = Number(c.req.param("id"));

  //   const result = await db.query.borderLengths.findFirst({
  //     where: eq(borderLengths.id, id),
  //   });

  //   if (!result) {
  //     return c.notFound();
  //   }

  //   return c.json({ borderLength: result });
  // })

  .post(
    "/",
    authMiddleware(["admin", "ppic", "sales"]),
    zValidator("json", createborderLengthSchema),
    async (c) => {
      const data = c.req.valid("json");

      // 1. delete old borderlength for this productId
      await softDelete(db, borderLengths, borderLengths.productId, data.productId);

      // 2. insert new borderlength
      const [inserted] = await db.insert(borderLengths).values(data).returning();

      return c.json({ borderLength: inserted }, 201);
    },
  )

  // .put("/:id{[0-9]+}", zValidator("json", updateborderLengthSchema), async (c) => {
  //   const id = Number(c.req.param("id"));
  //   const updates = c.req.valid("json");

  //   const [updated] = await db
  //     .update(borderLengths)
  //     .set(updates)
  //     .where(eq(borderLengths.id, id))
  //     .returning();

  //   if (!updated) {
  //     return c.notFound();
  //   }

  //   return c.json({ borderLength: updated });
  // })

  .delete("/:id{[0-9]+}", authMiddleware(["admin"]), async (c) => {
    const id = Number(c.req.param("id"));

    const deleted = await softDelete(db, borderLengths, borderLengths.id, id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    return c.json({ deleted });
  });
