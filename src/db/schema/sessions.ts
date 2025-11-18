import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
