import { ENV } from "./env.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_KEY = ENV.SUPABASE_KEY;
const SUPABASE_URL = ENV.SUPABASE_URL;

// Create and export supabase client
export const client = createClient(SUPABASE_URL, SUPABASE_KEY);
