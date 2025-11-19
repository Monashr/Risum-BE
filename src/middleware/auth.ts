// src/middleware/auth.ts
import { db } from "../db/client";
import { sessions } from "../db/schema/sessions";
import { appUsers } from "../db/schema";
import { eq } from "drizzle-orm";
import { readSessionIdFromHeader } from "../utils/cookies";

export const authMiddleware =
  (allowedRoles: string[] = []) =>
  async (c: any, next: any) => {
    try {
      const cookieHeader = c.req.raw.headers?.get("cookie") || "";
      const sessionId = readSessionIdFromHeader(cookieHeader);
      if (!sessionId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!sessionRow) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [appUserRow] = await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.id, sessionRow.userId));
      if (!appUserRow) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(appUserRow.role)) {
        return c.json({ error: "Forbidden" }, 403);
      }

      // Attach user to context for downstream handlers
      c.set("user", { id: appUserRow.id, role: appUserRow.role });

      await next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      return c.json({ error: "Unauthorized" }, 401);
    }
  };
