import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const colors = pgTable("colors", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),

  minimumOrder: integer("minimum_order"),

  specialColor: boolean("special_color").default(false),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

export const colorRelations = relations(colors, ({ one }) => ({
  product: one(products, {
    fields: [colors.productId],
    references: [products.id],
  }),
}));
