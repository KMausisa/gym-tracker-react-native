import { ENV } from "./env";
import { createClient } from "@supabase/supabase-js";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const SUPABASE_KEY = requireEnv(ENV.SUPABASE_KEY, "SUPABASE_KEY");
const SUPABASE_URL = requireEnv(ENV.SUPABASE_URL, "SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv(
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  "SUPABASE_SERVICE_ROLE_KEY"
);

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);
// Create and export supabase client
export function createSupaBaseClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
