"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PROJECT_STATUS } from "@/lib/status-config";
import type { ProjectsByStatus } from "@/lib/queries/metrics";
import type { ProjectStatus } from "@/types/database.types";

const COLORS: Record<string, string> = {
  planning: "var(--chart-2)",
  active: "var(--chart-3)",
  paused: "var(--chart-4)",
  completed: "var(--chart-1)",
  cancelled: "var(--chart-5)",
};

export function ProjectsStatusChart({ data }: { data: ProjectsByStatus[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sin proyectos todavía.
      </p>
    );
  }

  const chartConfig = Object.fromEntries(
    data.map((d) => [
      d.status,
      { label: PROJECT_STATUS[d.status as ProjectStatus]?.label ?? d.status, color: COLORS[d.status] },
    ])
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="mx-auto h-[260px] w-full max-w-[320px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} strokeWidth={4}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] ?? "var(--chart-1)"} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="status" />} />
      </PieChart>
    </ChartContainer>
  );
}
