import { pgTable, foreignKey, serial, integer, timestamp, varchar, boolean, uuid, text, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("order_status", ['PENDING', 'PAYMENT_UPLOADED', 'PAYMENT_CONFIRMED', 'PAYMENT_REJECTED', 'PROCESS', 'COMPLETED', 'CANCELED'])


export const borderLengths = pgTable("border_lengths", {
	id: serial().primaryKey().notNull(),
	maxLength: integer("max_length").notNull(),
	costPerLength: integer("cost_per_length").notNull(),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "border_lengths_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const colors = pgTable("colors", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	minimumOrder: integer("minimum_order"),
	specialColor: boolean("special_color").default(false),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "colors_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const customColumns = pgTable("custom_columns", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 500 }),
	pictureUrl: varchar("picture_url", { length: 1000 }),
	pictureName: varchar("picture_name", { length: 255 }),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "custom_columns_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const appUsers = pgTable("app_users", {
	id: uuid().primaryKey().notNull(),
	role: text().default('regular').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const sizes = pgTable("sizes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "sizes_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	price: integer().notNull(),
	size: boolean().default(false),
	sizeImageName: varchar("size_image_name", { length: 500 }),
	sizeImageUrl: varchar("size_image_url", { length: 255 }),
	material: boolean().default(false),
	variant: boolean().default(false),
	color: boolean().default(false),
	customColumn: boolean("custom_column").default(false),
	canAddBorderLength: boolean("can_add_border_length").default(false),
	canAddText: boolean("can_add_text").default(false),
	canAddLogo: boolean("can_add_logo").default(false),
	pictureName: varchar("picture_name", { length: 255 }),
	category: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
});

export const materials = pgTable("materials", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	pictureUrl: varchar("picture_url", { length: 1000 }),
	pictureName: varchar("picture_name", { length: 255 }),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "materials_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	customerId: uuid("customer_id"),
	fullName: varchar("full_name"),
	phone: varchar(),
	address: text(),
	paymentImageName: text("payment_image_name"),
	paymentImageUrl: text("payment_image_url"),
	status: orderStatus().default('PENDING').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [appUsers.id],
			name: "orders_customer_id_app_users_id_fk"
		}),
]);

export const variants = pgTable("variants", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	pictureUrl: varchar("picture_url", { length: 1000 }),
	pictureName: varchar("picture_name", { length: 255 }),
	additionPrice: integer("addition_price"),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "variants_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: integer("expires_at"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const orderDetails = pgTable("order_details", {
	id: serial().primaryKey().notNull(),
	orderId: uuid("order_id"),
	productId: integer("product_id"),
	size: varchar(),
	material: integer(),
	variantId: integer("variant_id"),
	colorId: integer("color_id"),
	customColumnId: integer("custom_column_id"),
	customColumnAnswer: varchar("custom_column_answer"),
	text: varchar(),
	borderLengthId: integer("border_length_id"),
	borderLengthAmount: integer("border_length_amount"),
	logoName: text("logo_name"),
	logoUrl: text("logo_url"),
	logoType: varchar("logo_type"),
	logoCostAddition: integer("logo_cost_addition"),
	designName: text("design_name"),
	designUrl: text("design_url"),
	status: orderStatus().default('PENDING').notNull(),
	quantity: integer(),
	totalPrice: integer("total_price"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.borderLengthId],
			foreignColumns: [borderLengths.id],
			name: "order_details_border_length_id_border_lengths_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.colorId],
			foreignColumns: [colors.id],
			name: "order_details_color_id_colors_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customColumnId],
			foreignColumns: [customColumns.id],
			name: "order_details_custom_column_id_custom_columns_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.material],
			foreignColumns: [materials.id],
			name: "order_details_material_materials_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_details_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "order_details_variant_id_variants_id_fk"
		}).onDelete("cascade"),
]);

export const materialsV2 = pgTable("materials_v2", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	pictureName: varchar("picture_name", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
});

export const productMaterials = pgTable("product_materials", {
	productId: integer("product_id").notNull(),
	materialId: integer("material_id").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	id: serial().primaryKey().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.materialId],
			foreignColumns: [materialsV2.id],
			name: "product_materials_material_id_materials_v2_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_materials_product_id_products_id_fk"
		}),
]);

export const productSizes = pgTable("product_sizes", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	sizeId: integer("size_id").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_sizes_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.sizeId],
			foreignColumns: [sizesV2.id],
			name: "product_sizes_size_id_sizes_v2_id_fk"
		}),
]);

export const sizesV2 = pgTable("sizes_v2", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
});

export const productColors = pgTable("product_colors", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	colorId: integer("color_id").notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.colorId],
			foreignColumns: [colorsV2.id],
			name: "product_colors_color_id_colors_v2_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_colors_product_id_products_id_fk"
		}),
]);

export const colorsV2 = pgTable("colors_v2", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 10 }).notNull(),
	minimumOrder: integer("minimum_order"),
	specialColor: boolean("special_color").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
});
