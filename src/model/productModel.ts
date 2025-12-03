import { products } from '../db/schema/products';

export type Product = typeof products.$inferSelect;

export type ProductWithUrl = Product & { pictureUrl?: string | null };