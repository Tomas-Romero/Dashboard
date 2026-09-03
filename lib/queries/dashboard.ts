import "server-only";

import { createClient } from "@/lib/supabase/server";
import { addDays, format, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { es } from "date-fns/locale";

export interface DashboardAlert {
  id: string;
  kind: "infra" | "invoice" | "task";
  label: string;
  detail: string;
  href: string;
  severity: "warning" | "destructive";
}

export interface DashboardStats {
  activeProjects: number;
  monthlyRevenue: number;
  pendingInvoicesTotal: number;
  pendingInvoicesCount: number;
  hoursThisWeek: number;
}

export interface RevenuePoint {
  month: string;
  total: number;
}

export interface RecentProject {
  id: string;
  name: string;
  status: string;
  clientName: string | null;
}

export interface UpcomingTask {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  projectId: string;
  projectName: string | null;
}

const EMPTY_STATS: DashboardStats = {
  activeProjects: 0,
  monthlyRevenue: 0,
  pendingInvoicesTotal: 0,
  pendingInvoicesCount: 0,
  hoursThisWeek: 0,
};

/**
 * Every query here fails soft: until the Supabase project is created and the
 * SQL migration has run, tables won't exist yet. Returning empty data lets
 * the dashboard render its empty states instead of crashing.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();
    const monthStart = startOfMonth(new Date()).toISOString();

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const [projects, invoices, pending, timeEntries] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("invoices")
        .select("total_amount")
        .eq("status", "paid")
        .gte("issue_date", monthStart),
      supabase
        .from("invoices")
        .select("total_amount", { count: "exact" })
        .in("status", ["sent", "overdue"]),
      supabase
        .from("time_entries")
        .select("duration_minutes")
        .gte("started_at", weekStart)
        .not("duration_minutes", "is", null),
    ]);

    const monthlyRevenue = (invoices.data ?? []).reduce(
      (sum, row) => sum + Number(row.total_amount ?? 0),
      0
    );
    const pendingInvoicesTotal = (pending.data ?? []).reduce(
      (sum, row) => sum + Number(row.total_amount ?? 0),
      0
    );
    const hoursThisWeek = (timeEntries.data ?? []).reduce(
      (sum, row) => sum + Number(row.duration_minutes ?? 0) / 60,
      0
    );

    return {
      activeProjects: projects.count ?? 0,
      monthlyRevenue,
      pendingInvoicesTotal,
      pendingInvoicesCount: pending.count ?? 0,
      hoursThisWeek,
    };
  } catch {
    return EMPTY_STATS;
  }
}

export async function getAlerts(): Promise<DashboardAlert[]> {
  try {
    const supabase = await createClient();
    const soon = addDays(new Date(), 30).toISOString().slice(0, 10);
    const alerts: DashboardAlert[] = [];

    const { data: infra } = await supabase
      .from("infrastructure")
      .select("id, identifier, provider, renewal_date, project_id")
      .lte("renewal_date", soon)
      .neq("status", "inactive");

    for (const item of infra ?? []) {
      alerts.push({
        id: `infra-${item.id}`,
        kind: "infra",
        label: item.identifier || item.provider || "Infraestructura",
        detail: item.renewal_date
          ? `Vence el ${format(new Date(item.renewal_date), "d 'de' MMMM", { locale: es })}`
          : "Sin fecha de vencimiento",
        href: `/projects/${item.project_id}?tab=infrastructure`,
        severity: "warning",
      });
    }

    const { data: overdue } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount")
      .eq("status", "overdue");

    for (const invoice of overdue ?? []) {
      alerts.push({
        id: `invoice-${invoice.id}`,
        kind: "invoice",
        label: `Factura ${invoice.invoice_number}`,
        detail: `Vencida — $${Number(invoice.total_amount).toLocaleString("es-AR")}`,
        href: `/billing/invoices/${invoice.id}`,
        severity: "destructive",
      });
    }

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, due_date, project_id")
      .lte("due_date", addDays(new Date(), 3).toISOString().slice(0, 10))
      .neq("status", "done");

    for (const task of tasks ?? []) {
      alerts.push({
        id: `task-${task.id}`,
        kind: "task",
        label: task.title,
        detail: task.due_date
          ? `Vence el ${format(new Date(task.due_date), "d 'de' MMMM", { locale: es })}`
          : "Sin fecha límite",
        href: `/projects/${task.project_id}?tab=tasks`,
        severity: "warning",
      });
    }

    return alerts;
  } catch {
    return [];
  }
}

export async function getRevenueByMonth(): Promise<RevenuePoint[]> {
  try {
    const supabase = await createClient();
    const from = startOfMonth(subMonths(new Date(), 5)).toISOString();

    const { data } = await supabase
      .from("invoices")
      .select("total_amount, issue_date")
      .eq("status", "paid")
      .gte("issue_date", from);

    const buckets = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      buckets.set(format(d, "yyyy-MM"), 0);
    }

    for (const row of data ?? []) {
      const key = format(new Date(row.issue_date), "yyyy-MM");
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(row.total_amount ?? 0));
      }
    }

    return Array.from(buckets.entries()).map(([key, total]) => ({
      month: format(new Date(`${key}-01`), "MMM", { locale: es }),
      total,
    }));
  } catch {
    return [];
  }
}

export async function getRecentProjects(): Promise<RecentProject[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, name, status, clients(name)")
      .order("updated_at", { ascending: false })
      .limit(5)
      .returns<
        { id: string; name: string; status: string; clients: { name: string } | null }[]
      >();

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      clientName: (row.clients as unknown as { name: string } | null)?.name ?? null,
    }));
  } catch {
    return [];
  }
}

export async function getUpcomingTasks(): Promise<UpcomingTask[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority, project_id, projects(name)")
      .neq("status", "done")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(6);

    const rows = (data ?? []) as unknown as {
      id: string;
      title: string;
      due_date: string | null;
      priority: string;
      project_id: string;
      projects: { name: string } | null;
    }[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      due_date: row.due_date,
      priority: row.priority,
      projectId: row.project_id,
      projectName: (row.projects as unknown as { name: string } | null)?.name ?? null,
    }));
  } catch {
    return [];
  }
}
