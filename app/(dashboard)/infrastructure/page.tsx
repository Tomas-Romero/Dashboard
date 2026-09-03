import type { Metadata } from "next";
import Link from "next/link";
import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { Server } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
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

export const metadata: Metadata = { title: "Infraestructura · Mission Control" };

export default async function InfrastructurePage() {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("infrastructure")
    .select("*, projects(id, name)")
    .order("renewal_date", { ascending: true, nullsFirst: false });

  const items = (data ?? []) as unknown as (Infrastructure & {
    projects: { id: string; name: string } | null;
  })[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Infraestructura</h2>
        <p className="text-sm text-muted-foreground">
          Hosting, dominios, certificados y bases de datos de todos tus proyectos.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Sin infraestructura registrada"
          description="Agregá recursos desde la pestaña Infraestructura de cada proyecto."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const daysLeft = item.renewal_date
              ? differenceInCalendarDays(new Date(item.renewal_date), new Date())
              : null;
            return (
              <Link
                key={item.id}
                href={item.projects ? `/projects/${item.projects.id}?tab=infrastructure` : "#"}
              >
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {TYPE_LABELS[item.type]} · {item.projects?.name ?? "—"}
                      </p>
                      <p className="truncate font-medium">
                        {item.identifier || item.provider || "—"}
                      </p>
                      {item.renewal_date && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Vence {format(new Date(item.renewal_date), "d MMM yyyy", { locale: es })}
                          {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`}
                        </p>
                      )}
                    </div>
                    <StatusBadge
                      label={INFRA_STATUS[item.status as InfraStatus]?.label}
                      tone={INFRA_STATUS[item.status as InfraStatus]?.tone}
                    />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
