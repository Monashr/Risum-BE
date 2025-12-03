export interface SizeV2Input {
  name: string | null;
}

export interface SizeV2Validation {
  data: SizeV2Input | null;
  errors: string[];
}