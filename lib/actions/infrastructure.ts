"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";

const InfraSchema = z.object({
  type: z.enum(["hosting", "database", "domain", "ssl_certificate", "email", "other"]),
  provider: z.string().optional(),
  identifier: z.string().optional(),
  status: z.enum(["active", "expiring_soon", "expired", "inactive"]),
  renewal_date: z.string().optional(),
  monthly_cost: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
});

function parseInfraForm(formData: FormData) {
  return InfraSchema.safeParse({
    type: formData.get("type"),
    provider: formData.get("provider") || undefined,
    identifier: formData.get("identifier") || undefined,
    status: formData.get("status") || "active",
    renewal_date: formData.get("renewal_date") || undefined,
    monthly_cost: formData.get("monthly_cost") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createInfrastructureAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = parseInfraForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("infrastructure")
    .insert({ ...parsed.data, project_id: projectId });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/infrastructure");
  return { success: true };
}

export async function updateInfrastructureAction(
  id: string,
  projectId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = parseInfraForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("infrastructure")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/infrastructure");
  return { success: true };
}

export async function deleteInfrastructureAction(id: string, projectId: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("infrastructure").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/infrastructure");
}
