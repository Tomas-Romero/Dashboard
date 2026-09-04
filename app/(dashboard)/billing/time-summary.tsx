"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Clock3, Loader2, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateInvoiceFromTimeAction } from "@/lib/actions/billing";
import type { ProjectTimeSummary } from "@/lib/actions/time-entries";

export function TimeSummary({ summary }: { summary: ProjectTimeSummary[] }) {
  const [pending, startTransition] = useTransition();

  if (summary.length === 0) return null;

  function handleGenerate(item: ProjectTimeSummary) {
    if (!item.clientId) {
      toast.error("Este proyecto no tiene un cliente asignado.");
      return;
    }
    startTransition(async () => {
      const result = await generateInvoiceFromTimeAction(item.projectId);
      if (result.error) toast.error(result.error);
      else toast.success("Factura generada a partir de las horas sin facturar.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="size-4 text-primary" /> Horas sin facturar por proyecto
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {summary.map((item) => (
          <div
            key={item.projectId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{item.projectName}</p>
              <p className="text-xs text-muted-foreground">
                {item.clientName ?? "Sin cliente"} · {(item.billableMinutes / 60).toFixed(1)}h
                {item.hourlyRate != null && ` · $${item.hourlyRate}/h`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {item.hourlyRate != null && (
                <span className="text-sm font-semibold">
                  ${item.billableAmount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={pending || !item.hourlyRate}
                onClick={() => handleGenerate(item)}
                title={!item.hourlyRate ? "Este proyecto no tiene tarifa por hora" : undefined}
              >
                {pending ? <Loader2 className="animate-spin" /> : <Receipt />}
                Generar factura
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
