import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string(),
  APP_URL: z.string(),
  APP_URI: z.string(),
  FRONTEND_URL: z.string(),
  PORT: z.string().default("3000"),

  COOKIE_NAME: z.string(),
  COOKIE_SECRET: z.string(),

  DATABASE_URL: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_JWKS_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
