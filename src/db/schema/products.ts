import { pgTable, serial, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { materials } from "./materials";
import { sizes } from "./sizes";
import { colors } from "./color";
import { variants } from "./variants";
import { borderLengths } from "./borderLengths";
import { customColumns } from "./customColumns";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  price: integer("price").notNull(),

  size: boolean("size").default(false),
  sizeImageName: varchar("size_image_name", { length: 500 }),
  sizeImageUrl: varchar("size_image_url", { length: 255 }),

  material: boolean("material").default(false),

  variant: boolean("variant").default(false),

  color: boolean("color").default(false),

  customColumn: boolean("custom_column").default(false),

  canAddBorderLength: boolean("can_add_border_length").default(false),

  canAddText: boolean("can_add_text").default(false),

  canAddLogo: boolean("can_add_logo").default(false),

  pictureUrl: varchar("picture_url", { length: 1000 }),
  pictureName: varchar("picture_name", { length: 255 }),

  category: varchar("category", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  deletedAt: timestamp("deleted_at"),
});

export const productsRelations = relations(products, ({ many }) => ({
  materials: many(materials),
  sizes: many(sizes),
  variants: many(variants),
  colors: many(colors),
  borderLengths: many(borderLengths),
  customColumns: many(customColumns),
}));
