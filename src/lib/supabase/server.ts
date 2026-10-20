import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diatur.");
  return createClient(url, key);
}
