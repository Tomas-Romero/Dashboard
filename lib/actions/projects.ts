"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";

const ProjectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  client_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
  status: z.enum(["planning", "active", "paused", "completed", "cancelled"]),
  repo_url: z.string().url().optional().or(z.literal("")),
  live_url: z.string().url().optional().or(z.literal("")),
  hourly_rate: z.coerce.number().nonnegative().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

function parseProjectForm(formData: FormData) {
  return ProjectSchema.safeParse({
    name: formData.get("name"),
    client_id: formData.get("client_id") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") || "planning",
    repo_url: formData.get("repo_url") || undefined,
    live_url: formData.get("live_url") || undefined,
    hourly_rate: formData.get("hourly_rate") || undefined,
    start_date: formData.get("start_date") || undefined,
    end_date: formData.get("end_date") || undefined,
  });
}

export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { client_id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...rest, client_id: client_id || null })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { client_id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ ...rest, client_id: client_id || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProjectAction(id: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projects");
  redirect("/projects");
}
