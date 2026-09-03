import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface RevenueByClient {
  clientName: string;
  total: number;
}

export interface ProjectsByStatus {
  status: string;
  count: number;
}

export interface HoursByProject {
  projectName: string;
  hours: number;
}

export interface MetricsData {
  revenueByClient: RevenueByClient[];
  projectsByStatus: ProjectsByStatus[];
  hoursByProject: HoursByProject[];
  totalRevenue: number;
  totalBillableHours: number;
  topClient: string | null;
}

const EMPTY: MetricsData = {
  revenueByClient: [],
  projectsByStatus: [],
  hoursByProject: [],
  totalRevenue: 0,
  totalBillableHours: 0,
  topClient: null,
};

export async function getMetrics(): Promise<MetricsData> {
  try {
    const supabase = await createClient();

    const [invoicesRes, projectsRes, timeRes] = await Promise.all([
      supabase.from("invoices").select("total_amount, client_id").eq("status", "paid"),
      supabase.from("projects").select("status"),
      supabase
        .from("time_entries")
        .select("duration_minutes, project_id")
        .not("duration_minutes", "is", null),
    ]);

    const clientIds = Array.from(
      new Set((invoicesRes.data ?? []).map((r) => r.client_id).filter(Boolean))
    ) as string[];
    const projectIds = Array.from(
      new Set((timeRes.data ?? []).map((r) => r.project_id).filter(Boolean))
    ) as string[];

    const [{ data: clients }, { data: projects }] = await Promise.all([
      clientIds.length
        ? supabase.from("clients").select("id, name").in("id", clientIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      projectIds.length
        ? supabase.from("projects").select("id, name").in("id", projectIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);

    const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));
    const projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

    const revenueMap = new Map<string, number>();
    for (const row of invoicesRes.data ?? []) {
      const name = clientNameById.get(row.client_id as string) ?? "Sin cliente";
      revenueMap.set(name, (revenueMap.get(name) ?? 0) + Number(row.total_amount ?? 0));
    }
    const revenueByClient = Array.from(revenueMap.entries())
      .map(([clientName, total]) => ({ clientName, total }))
      .sort((a, b) => b.total - a.total);

    const statusMap = new Map<string, number>();
    for (const row of projectsRes.data ?? []) {
      statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
    }
    const projectsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const hoursMap = new Map<string, number>();
    for (const row of timeRes.data ?? []) {
      const name = projectNameById.get(row.project_id as string) ?? "—";
      hoursMap.set(name, (hoursMap.get(name) ?? 0) + Number(row.duration_minutes ?? 0) / 60);
    }
    const hoursByProject = Array.from(hoursMap.entries())
      .map(([projectName, hours]) => ({ projectName, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);

    const totalRevenue = revenueByClient.reduce((sum, r) => sum + r.total, 0);
    const totalBillableHours = Array.from(hoursMap.values()).reduce((sum, h) => sum + h, 0);

    return {
      revenueByClient,
      projectsByStatus,
      hoursByProject,
      totalRevenue,
      totalBillableHours,
      topClient: revenueByClient[0]?.clientName ?? null,
    };
  } catch {
    return EMPTY;
  }
}
