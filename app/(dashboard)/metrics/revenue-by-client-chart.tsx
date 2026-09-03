"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RevenueByClient } from "@/lib/queries/metrics";

const chartConfig = {
  total: { label: "Ingresos", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RevenueByClientChart({ data }: { data: RevenueByClient[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sin facturas pagadas todavía.
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
          dataKey="clientName"
          tickLine={false}
          axisLine={false}
          width={100}
          className="text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
