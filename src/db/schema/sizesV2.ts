import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const sizesV2 = pgTable("sizes_v2", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const productSizes = pgTable("product_sizes", {
  id: serial("id").primaryKey(),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  sizeId: integer("size_id")
    .notNull()
    .references(() => sizesV2.id),

  deletedAt: timestamp("deleted_at"),
});

export const sizesV2Relations = relations(sizesV2, ({ many }) => ({
  products: many(productSizes),
}));

export const productSizeRelations = relations(productSizes, ({ one }) => ({
  product: one(products, {
    fields: [productSizes.productId],
    references: [products.id],
  }),

  size: one(sizesV2, {
    fields: [productSizes.sizeId],
    references: [sizesV2.id],
  }),
}));
