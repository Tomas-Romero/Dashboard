"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";
import type { LeadStatus } from "@/types/database.types";

const LeadSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  contact_info: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "proposal_sent", "won", "lost"]),
  notes: z.string().optional(),
});

function parseLeadForm(formData: FormData) {
  return LeadSchema.safeParse({
    name: formData.get("name"),
    contact_info: formData.get("contact_info") || undefined,
    source: formData.get("source") || undefined,
    status: formData.get("status") || "new",
    notes: formData.get("notes") || undefined,
  });
}

export async function createLeadAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = parseLeadForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath("/leads");
}

export async function convertLeadToClientAction(id: string, name: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("clients").insert({ name });
  await supabase.from("leads").update({ status: "won" }).eq("id", id);
  revalidatePath("/leads");
  revalidatePath("/clients");
}

export async function deleteLeadAction(id: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/leads");
}
