import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";

export const customColumns = pgTable("custom_columns", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  description: varchar("description", { length: 500 }),

  pictureUrl: varchar("picture_url", { length: 1000 }),
  pictureName: varchar("picture_name", { length: 255 }),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

export const customColumnRelations = relations(customColumns, ({ one }) => ({
  product: one(products, {
    fields: [customColumns.productId],
    references: [products.id],
  }),
}));
