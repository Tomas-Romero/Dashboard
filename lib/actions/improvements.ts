"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";

const ImprovementSchema = z.object({
  description: z.string().min(1, "La descripción es obligatoria."),
  entry_date: z.string().optional(),
});

export async function createImprovementAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = ImprovementSchema.safeParse({
    description: formData.get("description"),
    entry_date: formData.get("entry_date") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("improvements_log").insert({
    ...parsed.data,
    project_id: projectId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteImprovementAction(id: string, projectId: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("improvements_log").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}
