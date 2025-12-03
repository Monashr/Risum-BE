export interface ColorV2Input {
  name: string | null;
  code: string | null;
  minimumOrder: number | null;
  specialColor: boolean | null;
}

export interface ColorV2Validation {
  data: ColorV2Input | null;
  errors: string[];
}