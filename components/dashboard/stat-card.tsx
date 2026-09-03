"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  accent = "primary",
  index = 0,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
  index?: number;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/12 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -3 }}
    >
      <Card className="relative overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              <AnimatedNumber value={value} format={format} />
            </p>
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accentClasses[accent]
            )}
          >
            <Icon className="size-5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
