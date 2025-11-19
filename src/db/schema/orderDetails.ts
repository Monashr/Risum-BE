import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  varchar,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";
import { variants } from "./variants";
import { colors } from "./color";
import { borderLengths } from "./borderLengths";
import { customColumns } from "./customColumns";
import { materials } from "./materials";

export const orderDetailStatusEnum = pgEnum("order_status", [
  "PENDING", // Order created, awaiting payment
  "PROCESS", // Order on process
  "COMPLETED", // Order delivered / completed
  "CANCELED", // Order canceled
]);

export const orderDetails = pgTable("order_details", {
  id: serial("id").primaryKey(),

  orderId: uuid("order_id"),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),

  size: varchar("size"),

  materialId: integer("material").references(() => materials.id, { onDelete: "cascade" }),

  variantId: integer("variant_id").references(() => variants.id, { onDelete: "cascade" }),

  colorId: integer("color_id").references(() => colors.id, { onDelete: "cascade" }),

  customColumnId: integer("custom_column_id").references(() => customColumns.id, {
    onDelete: "cascade",
  }),
  customColumnAnswer: varchar("custom_column_answer"),

  text: varchar("text"),

  borderLengthId: integer("border_length_id").references(() => borderLengths.id, {
    onDelete: "cascade",
  }),
  borderLengthAmount: integer("border_length_amount"),

  logoName: text("logo_name"),
  logoUrl: text("logo_url"),

  logoType: varchar("logo_type"),
  logoCostAddition: integer("logo_cost_addition"),

  designName: text("design_name"),
  designUrl: text("design_url"),

  status: orderDetailStatusEnum("status").notNull().default("PENDING"),

  quantity: integer("quantity"),
  totalPrice: integer("total_price"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderDetailsRelations = relations(orderDetails, ({ one }) => ({
  orders: one(orders, {
    fields: [orderDetails.orderId],
    references: [orders.id],
  }),
  products: one(products, {
    fields: [orderDetails.productId],
    references: [products.id],
  }),
  variants: one(variants, {
    fields: [orderDetails.variantId],
    references: [variants.id],
  }),
  colors: one(colors, {
    fields: [orderDetails.colorId],
    references: [colors.id],
  }),
  borderLengths: one(borderLengths, {
    fields: [orderDetails.borderLengthId],
    references: [borderLengths.id],
  }),
  materials: one(materials, {
    fields: [orderDetails.materialId],
    references: [materials.id],
  }),
  customColumns: one(customColumns, {
    fields: [orderDetails.customColumnId],
    references: [customColumns.id],
  }),
}));
