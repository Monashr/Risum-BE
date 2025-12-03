import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const colorsV2 = pgTable("colors_v2", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),

  minimumOrder: integer("minimum_order"),

  specialColor: boolean("special_color").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

export const productColors = pgTable("product_colors", {
  id: serial("id").primaryKey(),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id),

  colorId: integer("color_id")
    .notNull()
    .references(() => colorsV2.id),

  deletedAt: timestamp("deleted_at"),
});

export const colorsV2Relations = relations(colorsV2, ({ many }) => ({
  products: many(productColors),
}));

export const productColorRelations = relations(productColors, ({ one }) => ({
  product: one(products, {
    fields: [productColors.productId],
    references: [products.id],
  }),

  color: one(colorsV2, {
    fields: [productColors.colorId],
    references: [colorsV2.id],
  }),
}));
