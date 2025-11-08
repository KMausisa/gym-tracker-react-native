import { ENV } from "./env.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_KEY = ENV.SUPABASE_KEY;
const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);
// Create and export supabase client
export function createSupaBaseClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
