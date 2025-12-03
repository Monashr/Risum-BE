export interface MaterialV2Input {
  name: string | null;
  file: File | null;
}

export interface MaterialV2Validation {
  data: MaterialV2Input | null;
  errors: string[];
}