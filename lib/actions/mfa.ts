"use server";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

export async function listMfaFactorsAction() {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp ?? [];
}

export interface EnrollResult {
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
}

export async function enrollMfaAction(): Promise<EnrollResult> {
  await verifySession();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error) return { error: error.message };

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyMfaEnrollAction(factorId: string, code: string) {
  await verifySession();
  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) return { error: challengeError.message };

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (error) return { error: "Código incorrecto. Probá de nuevo." };

  return { success: true };
}

export async function unenrollMfaAction(factorId: string) {
  await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message };
  return { success: true };
}
