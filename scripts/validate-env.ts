import { env } from "../src/config/env";
import { z } from "zod";

// Define the required environment variables schema
const requiredEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_JWKS_URL: z.string().url(),
  SUPABASE_JWT_ISSUER: z.string(),
  SUPABASE_JWT_AUDIENCE: z.string(),
  DATABASE_URL: z.string(),
  COOKIE_SECRET: z.string().min(32),
  COOKIE_NAME: z.string().default("session_id"),
  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
});

try {
  // Validate all required environment variables
  const validatedEnv = requiredEnvSchema.parse(env);
  console.log("✅ All required environment variables are valid");
  console.log("Environment check passed for:", {
    NODE_ENV: validatedEnv.NODE_ENV,
    SUPABASE_URL: validatedEnv.SUPABASE_URL ? "✓ Set" : "✗ Missing",
    DATABASE_URL: validatedEnv.DATABASE_URL ? "✓ Set" : "✗ Missing",
    COOKIE_SECRET: validatedEnv.COOKIE_SECRET ? "✓ Set" : "✗ Missing",
  });
} catch (error: any) {
  if (error instanceof z.ZodError) {
    console.error("❌ Environment validation failed:");
    error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    console.error("\nPlease check your .env file and ensure all required variables are set.");
    process.exit(1);
  }
  throw error;
}
