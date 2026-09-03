"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

/**
 * Irreversible: wipes the Master Passphrase verifier and every stored
 * credential. Use only if the passphrase was lost — there is no recovery.
 */
export async function resetVaultAction() {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("credentials_vault").delete().gte("created_at", "1970-01-01");
  await supabase.from("vault_settings").delete().eq("id", true);
  revalidatePath("/vault");
  revalidatePath("/settings");
}
