import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const materialsV2 = pgTable("materials_v2", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  pictureName: varchar("picture_name", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

export const productMaterials = pgTable("product_materials", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  materialId: integer("material_id")
    .notNull()
    .references(() => materialsV2.id),
  deletedAt: timestamp("deleted_at"),
});

export const materialsV2Relations = relations(materialsV2, ({ many }) => ({
  products: many(productMaterials),
}));

export const productMaterialsRelations = relations(productMaterials, ({ one }) => ({
  product: one(products, {
    fields: [productMaterials.productId],
    references: [products.id],
  }),

  material: one(materialsV2, {
    fields: [productMaterials.materialId],
    references: [materialsV2.id],
  }),
}));
