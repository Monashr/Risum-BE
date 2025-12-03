import { relations } from "drizzle-orm/relations";
import { products, borderLengths, colors, customColumns, sizes, materials, appUsers, orders, variants, orderDetails, materialsV2, productMaterials, productSizes, sizesV2, colorsV2, productColors } from "./schema";

export const borderLengthsRelations = relations(borderLengths, ({one, many}) => ({
	product: one(products, {
		fields: [borderLengths.productId],
		references: [products.id]
	}),
	orderDetails: many(orderDetails),
}));

export const productsRelations = relations(products, ({many}) => ({
	borderLengths: many(borderLengths),
	colors: many(colors),
	customColumns: many(customColumns),
	sizes: many(sizes),
	materials: many(materials),
	variants: many(variants),
	orderDetails: many(orderDetails),
	productMaterials: many(productMaterials),
	productSizes: many(productSizes),
	productColors: many(productColors),
}));

export const colorsRelations = relations(colors, ({one, many}) => ({
	product: one(products, {
		fields: [colors.productId],
		references: [products.id]
	}),
	orderDetails: many(orderDetails),
}));

export const customColumnsRelations = relations(customColumns, ({one, many}) => ({
	product: one(products, {
		fields: [customColumns.productId],
		references: [products.id]
	}),
	orderDetails: many(orderDetails),
}));

export const sizesRelations = relations(sizes, ({one}) => ({
	product: one(products, {
		fields: [sizes.productId],
		references: [products.id]
	}),
}));

export const materialsRelations = relations(materials, ({one, many}) => ({
	product: one(products, {
		fields: [materials.productId],
		references: [products.id]
	}),
	orderDetails: many(orderDetails),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	appUser: one(appUsers, {
		fields: [orders.customerId],
		references: [appUsers.id]
	}),
}));

export const appUsersRelations = relations(appUsers, ({many}) => ({
	orders: many(orders),
}));

export const variantsRelations = relations(variants, ({one, many}) => ({
	product: one(products, {
		fields: [variants.productId],
		references: [products.id]
	}),
	orderDetails: many(orderDetails),
}));

export const orderDetailsRelations = relations(orderDetails, ({one}) => ({
	borderLength: one(borderLengths, {
		fields: [orderDetails.borderLengthId],
		references: [borderLengths.id]
	}),
	color: one(colors, {
		fields: [orderDetails.colorId],
		references: [colors.id]
	}),
	customColumn: one(customColumns, {
		fields: [orderDetails.customColumnId],
		references: [customColumns.id]
	}),
	material: one(materials, {
		fields: [orderDetails.material],
		references: [materials.id]
	}),
	product: one(products, {
		fields: [orderDetails.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [orderDetails.variantId],
		references: [variants.id]
	}),
}));

export const productMaterialsRelations = relations(productMaterials, ({one}) => ({
	materialsV2: one(materialsV2, {
		fields: [productMaterials.materialId],
		references: [materialsV2.id]
	}),
	product: one(products, {
		fields: [productMaterials.productId],
		references: [products.id]
	}),
}));

export const materialsV2Relations = relations(materialsV2, ({many}) => ({
	productMaterials: many(productMaterials),
}));

export const productSizesRelations = relations(productSizes, ({one}) => ({
	product: one(products, {
		fields: [productSizes.productId],
		references: [products.id]
	}),
	sizesV2: one(sizesV2, {
		fields: [productSizes.sizeId],
		references: [sizesV2.id]
	}),
}));

export const sizesV2Relations = relations(sizesV2, ({many}) => ({
	productSizes: many(productSizes),
}));

export const productColorsRelations = relations(productColors, ({one}) => ({
	colorsV2: one(colorsV2, {
		fields: [productColors.colorId],
		references: [colorsV2.id]
	}),
	product: one(products, {
		fields: [productColors.productId],
		references: [products.id]
	}),
}));

export const colorsV2Relations = relations(colorsV2, ({many}) => ({
	productColors: many(productColors),
}));