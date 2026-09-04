"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

export async function getRunningTimeEntry() {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("*, projects(name)")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as unknown as {
    id: string;
    project_id: string;
    task_id: string | null;
    started_at: string;
    description: string | null;
    projects: { name: string } | null;
  };

  return {
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id,
    startedAt: row.started_at,
    description: row.description,
    projectName: row.projects?.name ?? "—",
  };
}

export async function startTimeEntryAction(
  projectId: string,
  description?: string
) {
  await verifySession();
  const supabase = await createClient();

  // Single-user app: only one timer can run at a time. Stop any dangling one first.
  await supabase
    .from("time_entries")
    .update({ ended_at: new Date().toISOString() })
    .is("ended_at", null);

  const startedAt = new Date().toISOString();
  const { data } = await supabase
    .from("time_entries")
    .insert({
      project_id: projectId,
      description: description || null,
      started_at: startedAt,
      billable: true,
    })
    .select("id")
    .single();

  revalidatePath("/");
  revalidatePath("/billing");

  return { id: data?.id as string, startedAt };
}

export async function stopTimeEntryAction(id: string, startedAt: string) {
  await verifySession();
  const supabase = await createClient();
  const endedAt = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - new Date(startedAt).getTime()) / 60000)
  );

  await supabase
    .from("time_entries")
    .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/billing");
}

export async function deleteTimeEntryAction(id: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("time_entries").delete().eq("id", id);
  revalidatePath("/billing");
}

export interface TimeEntryRow {
  id: string;
  projectId: string;
  projectName: string;
  startedAt: string;
  durationMinutes: number | null;
  description: string | null;
  invoiced: boolean;
}

export async function listRecentTimeEntries(limit = 20): Promise<TimeEntryRow[]> {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id, project_id, started_at, duration_minutes, description, invoiced, projects(name)")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as {
    id: string;
    project_id: string;
    started_at: string;
    duration_minutes: number | null;
    description: string | null;
    invoiced: boolean;
    projects: { name: string } | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.projects?.name ?? "—",
    startedAt: row.started_at,
    durationMinutes: row.duration_minutes,
    description: row.description,
    invoiced: row.invoiced,
  }));
}

export interface ProjectTimeSummary {
  projectId: string;
  projectName: string;
  clientId: string | null;
  clientName: string | null;
  hourlyRate: number | null;
  billableMinutes: number;
  billableAmount: number;
}

export async function getUnbilledTimeSummary(): Promise<ProjectTimeSummary[]> {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("project_id, duration_minutes, billable, projects(name, hourly_rate, client_id, clients(name))")
    .eq("billable", true)
    .eq("invoiced", false)
    .not("ended_at", "is", null);

  const rows = (data ?? []) as unknown as {
    project_id: string;
    duration_minutes: number | null;
    projects: {
      name: string;
      hourly_rate: number | null;
      client_id: string | null;
      clients: { name: string } | null;
    } | null;
  }[];

  const byProject = new Map<string, ProjectTimeSummary>();

  for (const row of rows) {
    const existing = byProject.get(row.project_id);
    const minutes = row.duration_minutes ?? 0;
    if (existing) {
      existing.billableMinutes += minutes;
      existing.billableAmount = (existing.billableMinutes / 60) * (existing.hourlyRate ?? 0);
    } else {
      const rate = row.projects?.hourly_rate ?? null;
      byProject.set(row.project_id, {
        projectId: row.project_id,
        projectName: row.projects?.name ?? "—",
        clientId: row.projects?.client_id ?? null,
        clientName: row.projects?.clients?.name ?? null,
        hourlyRate: rate,
        billableMinutes: minutes,
        billableAmount: (minutes / 60) * (rate ?? 0),
      });
    }
  }

  return Array.from(byProject.values()).sort((a, b) => b.billableMinutes - a.billableMinutes);
}
