import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const sizes = pgTable("sizes", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sizesRelations = relations(sizes, ({ one }) => ({
  product: one(products, {
    fields: [sizes.productId],
    references: [products.id],
  }),
}));
