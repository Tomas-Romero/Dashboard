"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";

export interface VaultVerifierInfo {
  configured: boolean;
  verifier_hash?: string;
  verifier_salt?: string;
  encryption_salt?: string;
}

/**
 * Salts and the verifier hash are not sensitive on their own (they cannot
 * decrypt anything) — they're what let the browser confirm the Master
 * Passphrase locally, without ever sending it to the server.
 */
export async function getVaultVerifierInfo(): Promise<VaultVerifierInfo> {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase.from("vault_settings").select("*").eq("id", true).maybeSingle();

  if (!data) return { configured: false };

  return {
    configured: true,
    verifier_hash: data.verifier_hash,
    verifier_salt: data.verifier_salt,
    encryption_salt: data.encryption_salt,
  };
}

const SetupSchema = z.object({
  verifier_hash: z.string().min(1),
  verifier_salt: z.string().min(1),
  encryption_salt: z.string().min(1),
});

export async function setupVaultAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = SetupSchema.safeParse({
    verifier_hash: formData.get("verifier_hash"),
    verifier_salt: formData.get("verifier_salt"),
    encryption_salt: formData.get("encryption_salt"),
  });
  if (!parsed.success) return { error: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vault_settings")
    .insert({ id: true, ...parsed.data });

  if (error) return { error: error.message };

  revalidatePath("/vault");
  revalidatePath("/settings");
  return { success: true };
}

const VaultEntrySchema = z.object({
  project_id: z.string().uuid("Elegí un proyecto."),
  service_name: z.string().min(1, "El nombre del servicio es obligatorio."),
  username: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  encrypted_password: z.string().min(1),
  encryption_iv: z.string().min(1),
  encryption_salt: z.string().min(1),
});

export async function createVaultEntryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = VaultEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("credentials_vault").insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/vault");
  return { success: true };
}

export async function updateVaultEntryAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = VaultEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("credentials_vault")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/vault");
  return { success: true };
}

export async function deleteVaultEntryAction(id: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("credentials_vault").delete().eq("id", id);
  revalidatePath("/vault");
}
