import { pgTable, text, timestamp, pgEnum, uuid, varchar } from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";
import { orderDetails } from "./orderDetails";
import { appUsers } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PAYMENT_UPLOADED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "PROCESS",
  "COMPLETED",
  "CANCELED",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),

  customerId: uuid("customer_id").references(() => appUsers.id),

  fullName: varchar("full_name"),
  phone: varchar("phone"),
  address: text("address"),

  paymentImageName: text("payment_image_name"),
  paymentImageUrl: text("payment_image_url"),

  status: orderStatusEnum("status").notNull().default("PENDING"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(appUsers, {
    fields: [orders.customerId],
    references: [appUsers.id],
  }),
  orderDetails: many(orderDetails),
}));
