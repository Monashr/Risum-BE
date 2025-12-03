export interface MaterialInput {
  name: string | null;
  productId: number | null;
  file: File | null;
}

export interface MaterialValidation {
  data: MaterialInput | null;
  errors: string[];
}