"use client";

import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { InfrastructureFormDialog } from "./infrastructure-form-dialog";
import { deleteInfrastructureAction } from "@/lib/actions/infrastructure";
import { INFRA_STATUS } from "@/lib/status-config";
import type { Infrastructure, InfraStatus } from "@/types/database.types";

const TYPE_LABELS: Record<string, string> = {
  hosting: "Hosting",
  database: "Base de datos",
  domain: "Dominio",
  ssl_certificate: "Certificado SSL",
  email: "Email",
  other: "Otro",
};

export function InfrastructureTab({
  projectId,
  items,
}: {
  projectId: string;
  items: Infrastructure[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <InfrastructureFormDialog projectId={projectId} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Sin infraestructura registrada"
          description="Agregá hosting, dominios, certificados SSL o bases de datos para trackear vencimientos."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const daysLeft = item.renewal_date
              ? differenceInCalendarDays(new Date(item.renewal_date), new Date())
              : null;
            return (
              <Card key={item.id} className="group">
                <CardContent className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {TYPE_LABELS[item.type]}
                    </p>
                    <p className="truncate font-medium">
                      {item.identifier || item.provider || "—"}
                    </p>
                    {item.provider && item.identifier && (
                      <p className="text-xs text-muted-foreground">{item.provider}</p>
                    )}
                    {item.renewal_date && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Vence {format(new Date(item.renewal_date), "d MMM yyyy", { locale: es })}
                        {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`}
                      </p>
                    )}
                    {item.monthly_cost != null && (
                      <p className="text-xs text-muted-foreground">
                        ${Number(item.monthly_cost).toLocaleString("es-AR")}/mes
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge
                      label={INFRA_STATUS[item.status as InfraStatus]?.label}
                      tone={INFRA_STATUS[item.status as InfraStatus]?.tone}
                    />
                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                      <InfrastructureFormDialog projectId={projectId} infra={item} />
                      <ConfirmDeleteButton
                        title="¿Eliminar este recurso?"
                        onDelete={() => deleteInfrastructureAction(item.id, projectId)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
