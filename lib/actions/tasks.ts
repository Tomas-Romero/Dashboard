"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";
import type { TaskStatus } from "@/types/database.types";

const TaskSchema = z.object({
  title: z.string().min(1, "El título es obligatorio."),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
});

export async function createTaskAction(
  projectId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = TaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "medium",
    due_date: formData.get("due_date") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    project_id: projectId,
    status: "todo" as TaskStatus,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function moveTaskAction(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", taskId);
  revalidatePath(`/projects/${projectId}`);
}

/**
 * Persists the final column + order after a Kanban drag. Only the moved
 * task's column changes semantically; positions for the whole affected
 * column are rewritten so the visual order survives a refresh.
 */
export async function reorderTasksAction(
  projectId: string,
  updates: { id: string; status: TaskStatus; position: number }[]
) {
  await verifySession();
  const supabase = await createClient();
  await Promise.all(
    updates.map(({ id, status, position }) =>
      supabase.from("tasks").update({ status, position }).eq("id", id)
    )
  );
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteTaskAction(taskId: string, projectId: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath(`/projects/${projectId}`);
}
