"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BellRing, CheckCircle2, ChevronRight, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardAlert } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

export function AlertsWidget({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="size-4 text-primary" />
          Requiere tu atención
        </CardTitle>
        {alerts.length > 0 && (
          <Badge variant="secondary">{alerts.length}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="size-8 text-success" />
            Todo en orden. Sin vencimientos próximos.
          </div>
        ) : (
          alerts.slice(0, 6).map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={alert.href}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
              >
                <TriangleAlert
                  className={cn(
                    "size-4 shrink-0",
                    alert.severity === "destructive"
                      ? "text-destructive"
                      : "text-warning"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{alert.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {alert.detail}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
