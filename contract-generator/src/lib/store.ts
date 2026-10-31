import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Contract } from "./types";

// Contracts are stored whole as a single JSONB column - this app has no
// Supabase Auth and no per-row ownership; all real access control (who can
// view/edit/sign a given contract) happens in the API routes via the
// draftToken/signToken in each contract's own data, not at the DB layer.
// The service role key is used here specifically so that RLS (enabled with
// zero policies on the `contracts` table) can stay deny-by-default for the
// anon key, which this server-only module never uses.

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set - see .env.example.",
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export async function saveContract(contract: Contract): Promise<void> {
  const { error } = await getClient()
    .from("contracts")
    .upsert({ id: contract.id, data: contract, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(`Failed to save contract: ${error.message}`);
  }
}

export async function getContract(id: string): Promise<Contract | null> {
  const { data, error } = await getClient()
    .from("contracts")
    .select("data")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load contract: ${error.message}`);
  }

  return (data?.data as Contract | undefined) ?? null;
}
