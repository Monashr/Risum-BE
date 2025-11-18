import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const borderLengths = pgTable("border_lengths", {
  id: serial("id").primaryKey(),

  maxLength: integer("max_length").notNull(),
  costPerLength: integer("cost_per_length").notNull(),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

export const borderLengthsRelations = relations(borderLengths, ({ one }) => ({
  product: one(products, {
    fields: [borderLengths.productId],
    references: [products.id],
  }),
}));
