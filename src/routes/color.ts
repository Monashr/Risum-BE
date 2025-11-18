import { Hono } from "hono";
import { db } from "../db/client";
import { colors } from "../db/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { softDelete } from "../db/utils/softDeletes";
import { authMiddleware } from "../middleware/auth";

const colorSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  code: z
    .string()
    .regex(
      /^#(?:[0-9a-fA-F]{3}){1,2}$/,
      "Color code must be a valid hex value (e.g. #FFF or #FFFFFF)",
    )
    .max(10)
    .transform((val) => val.toUpperCase()),
  minimumOrder: z.number().int().default(0),
  specialColor: z.boolean().default(false),
  productId: z.number().int().positive(),
});

const createColorSchema = colorSchema.omit({ id: true });

const updateColorSchema = createColorSchema.partial();

export const colorRoute = new Hono()
  // .get("/", async (c) => {
  //   const result = await db.query.colors.findMany();
  //   return c.json({ colors: result });
  // })

  // .get("/:id{[0-9]+}", async (c) => {
  //   const id = Number(c.req.param("id"));

  //   const result = await db.query.colors.findFirst({
  //     where: eq(colors.id, id),
  //   });

  //   if (!result) {
  //     return c.notFound();
  //   }

  //   return c.json({ color: result });
  // })

  .post("/", authMiddleware(), zValidator("json", createColorSchema), async (c) => {
    const data = c.req.valid("json");
    const [inserted] = await db.insert(colors).values(data).returning();
    return c.json({ color: inserted }, 201);
  })

  // .put("/:id{[0-9]+}", zValidator("json", updateColorSchema), async (c) => {
  //   const id = Number(c.req.param("id"));
  //   const updates = c.req.valid("json");

  //   const [updated] = await db.update(colors).set(updates).where(eq(colors.id, id)).returning();

  //   if (!updated) {
  //     return c.notFound();
  //   }

  //   return c.json({ color: updated });
  // })

  .delete("/:id{[0-9]+}", authMiddleware(true), async (c) => {
    const id = Number(c.req.param("id"));
    const deleted = softDelete(db, colors, colors.id, id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    return c.json({ deleted });
  });
