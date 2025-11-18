import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  pictureUrl: varchar("picture_url", { length: 1000 }),
  pictureName: varchar("picture_name", { length: 255 }),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at").defaultNow(),
});

export const materialsRelations = relations(materials, ({ one }) => ({
  product: one(products, {
    fields: [materials.productId],
    references: [products.id],
  }),
}));
