import { FolderKanban, DollarSign, Receipt, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import { verifySession } from "@/lib/dal";
import {
  getAlerts,
  getDashboardStats,
  getRecentProjects,
  getRevenueByMonth,
  getUpcomingTasks,
} from "@/lib/queries/dashboard";

const currency = (n: number) =>
  `$${Math.round(n).toLocaleString("es-AR")}`;

export default async function DashboardHomePage() {
  const session = await verifySession();
  const [stats, alerts, revenue, projects, tasks] = await Promise.all([
    getDashboardStats(),
    getAlerts(),
    getRevenueByMonth(),
    getRecentProjects(),
    getUpcomingTasks(),
  ]);

  const firstName = session.email?.split("@")[0] ?? "";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight capitalize">
          Hola, {firstName} 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Este es el estado general de tu operación freelance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Proyectos activos"
          value={stats.activeProjects}
          icon={FolderKanban}
          accent="primary"
          index={0}
        />
        <StatCard
          label="Ingresos del mes"
          value={stats.monthlyRevenue}
          format={currency}
          icon={DollarSign}
          accent="success"
          index={1}
        />
        <StatCard
          label="Facturas pendientes"
          value={stats.pendingInvoicesCount}
          icon={Receipt}
          accent="warning"
          index={2}
        />
        <StatCard
          label="Horas esta semana"
          value={stats.hoursThisWeek}
          format={(n) => n.toFixed(1)}
          icon={Clock3}
          accent="primary"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Ingresos — últimos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>

        <AlertsWidget alerts={alerts} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentProjects projects={projects} />
        <UpcomingTasks tasks={tasks} />
      </div>
    </div>
  );
}
