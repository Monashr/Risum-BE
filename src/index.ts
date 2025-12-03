import app from "../app";
import { env } from "./config/env";
import { z } from "zod";

const requiredEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_JWKS_URL: z.string().url(),
  DATABASE_URL: z.string(),
  COOKIE_SECRET: z.string().min(32),
  COOKIE_NAME: z.string().default("session_id"),
  APP_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
});

try {
  requiredEnvSchema.parse(env);
  console.log("✅ Environment validation passed");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("CRITICAL: Environment validation failed at startup:");
    error.issues.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    console.error("\nServer cannot start without valid environment variables.");
    console.error("Please check your .env file and ensure all required variables are set.");
    process.exit(1);
  }
  throw error;
}

Bun.serve({
  fetch: app.fetch,
  port: 3000,
  hostname: "0.0.0.0",
});

console.log("Server Running");
