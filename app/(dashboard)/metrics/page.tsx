import type { Metadata } from "next";
import { Trophy, DollarSign, Clock3 } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getMetrics } from "@/lib/queries/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueByClientChart } from "./revenue-by-client-chart";
import { ProjectsStatusChart } from "./projects-status-chart";
import { HoursByProjectChart } from "./hours-by-project-chart";

export const metadata: Metadata = { title: "Métricas · Mission Control" };

export default async function MetricsPage() {
  await verifySession();
  const metrics = await getMetrics();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Métricas</h2>
        <p className="text-sm text-muted-foreground">
          Vista agregada de tu negocio freelance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Ingresos totales (pagados)"
          value={metrics.totalRevenue}
          format={(n) => `$${Math.round(n).toLocaleString("es-AR")}`}
          icon={DollarSign}
          accent="success"
          index={0}
        />
        <StatCard
          label="Horas facturables totales"
          value={metrics.totalBillableHours}
          format={(n) => `${n.toFixed(1)}h`}
          icon={Clock3}
          accent="primary"
          index={1}
        />
        <Card>
          <CardContent className="flex h-full items-center gap-3 py-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <Trophy className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Cliente más rentable</p>
              <p className="truncate text-lg font-semibold">{metrics.topClient ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos por cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByClientChart data={metrics.revenueByClient} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proyectos por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsStatusChart data={metrics.projectsByStatus} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horas registradas por proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <HoursByProjectChart data={metrics.hoursByProject} />
        </CardContent>
      </Card>
    </div>
  );
}
