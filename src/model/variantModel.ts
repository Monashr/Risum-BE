import { z } from "zod";

export const variantSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  productId: z.number().int().positive(),
  pictureUrl: z.string().optional().nullable(),
  pictureName: z.string().optional().nullable(),
  additionPrice: z.number().min(1),
});