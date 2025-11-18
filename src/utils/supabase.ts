import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const SUPABASE_URL = env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    flowType: "pkce",
  },
});

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    flowType: "pkce",
  },
});
