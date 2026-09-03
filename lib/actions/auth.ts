"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().email({ message: "Ingresá un email válido." }),
  password: z.string().min(6, { message: "Mínimo 6 caracteres." }),
});

export interface AuthFormState {
  error?: string;
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  const next = (formData.get("next") as string) || "/";

  // If a TOTP factor is enrolled, the session is only at aal1 until the
  // second factor is verified — send the user to the challenge step instead.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    redirect(`/login/verify?next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function verifyLoginMfaAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const code = formData.get("code") as string;
  const next = (formData.get("next") as string) || "/";

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === "verified");

  if (!factor) {
    redirect(next);
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  if (challengeError) return { error: challengeError.message };

  const { error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (error) return { error: "Código incorrecto." };

  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
