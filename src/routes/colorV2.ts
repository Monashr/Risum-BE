import { Hono } from "hono";
import { db } from "../db/client";
import { authMiddleware } from "../middleware/auth";
import {
  getManyColorV2,
  insertColorV2,
  parseColorV2FormData,
  softDeleteColorV2,
  softDeleteColorV2Pivot,
} from "../service/colorV2Service";

export const colorV2Route = new Hono()

  .get("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const result = await getManyColorV2();

    return c.json(result);
  })

  .post("/", authMiddleware(["admin", "ppic", "sales"]), async (c) => {
    const form = await c.req.formData();
    const { data, errors } = parseColorV2FormData(form);

    if (errors.length > 0) {
      return c.json({ errors }, 400);
    }

    const insertedRows = await insertColorV2(
      db,
      data?.name!,
      data?.code!,
      data?.minimumOrder!,
      data?.specialColor!,
    );

    console.log("INSERTED ROW ", insertedRows);
    console.log("DATA ", data);

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

    // 1. soft delete the color
    const deleted = await softDeleteColorV2(id);

    if (!deleted) return c.json({ error: "Not found" }, 404);

    // 2. soft delete all related pivot rows
    await softDeleteColorV2Pivot(id);

    return c.json({ deleted });
  });
