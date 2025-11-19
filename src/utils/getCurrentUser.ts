import { db } from "../db/client";
import { sessions } from "../db/schema/sessions";
import { appUsers } from "../db/schema";
import { readSessionIdFromHeader } from "./cookies";
import { eq } from "drizzle-orm";

export async function getCurrentUser(c: any) {
  const cookie = c.req.header("cookie") || "";
  const sessionId = readSessionIdFromHeader(cookie);
  if (!sessionId) return null;

  const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!sessionRow) return null;

  const [appUserRow] = await db.select().from(appUsers).where(eq(appUsers.id, sessionRow.userId));
  if (!appUserRow) return null;

  return appUserRow; // { id, role }
}
