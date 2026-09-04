"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { deleteTimeEntryAction } from "@/lib/actions/time-entries";
import type { TimeEntryRow } from "@/lib/actions/time-entries";

function formatDuration(minutes: number | null) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function TimeEntriesList({ entries }: { entries: TimeEntryRow[] }) {
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-primary" /> Últimas horas registradas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate">
                {entry.projectName}
                {entry.description && (
                  <span className="text-muted-foreground"> · {entry.description}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.startedAt), "d MMM, HH:mm", { locale: es })}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatDuration(entry.durationMinutes)}
            </span>
            {entry.invoiced ? (
              <Badge variant="secondary" className="shrink-0">
                Facturada
              </Badge>
            ) : (
              <span className="w-[68px] shrink-0" />
            )}
            <div className="shrink-0 opacity-0 group-hover:opacity-100">
              <ConfirmDeleteButton
                title="¿Eliminar esta entrada de tiempo?"
                onDelete={() => deleteTimeEntryAction(entry.id)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
