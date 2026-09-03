"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { HoursByProject } from "@/lib/queries/metrics";

const chartConfig = {
  hours: { label: "Horas", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function HoursByProjectChart({ data }: { data: HoursByProject[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sin horas registradas todavía.
      </p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} strokeOpacity={0.3} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="projectName"
          tickLine={false}
          axisLine={false}
          width={100}
          className="text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="hours" fill="var(--color-hours)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
