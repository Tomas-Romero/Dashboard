import type { Metadata } from "next";
import Link from "next/link";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { Calculator, Plus } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { QUOTE_STATUS } from "@/lib/status-config";
import { formatArs, formatUsd } from "@/lib/quotes/pricing";
import type { Quote, QuoteStatus } from "@/types/database.types";

export const metadata: Metadata = { title: "Presupuestos · Mission Control" };

export default async function QuotesPage() {
  await verifySession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("quotes")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  const quotes = (data ?? []) as unknown as (Quote & {
    clients: { name: string } | null;
  })[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Presupuestos</h2>
          <p className="text-sm text-muted-foreground">
            Cotizá en minutos y mostralo en el momento.
          </p>
        </div>
        <Button asChild>
          <Link href="/quotes/new">
            <Plus /> Nuevo
          </Link>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<Calculator className="size-6" />}
          title="Todavía no armaste ningún presupuesto"
          description="La calculadora te arma el precio a partir del tipo de sistema, las funcionalidades y el mantenimiento."
          action={
            <Button asChild size="sm">
              <Link href="/quotes/new">
                <Plus /> Armar el primero
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => {
            const expired =
              quote.valid_until &&
              quote.status !== "accepted" &&
              isBefore(new Date(quote.valid_until), new Date());
            const status = (expired ? "expired" : quote.status) as QuoteStatus;

            return (
              <Link key={quote.id} href={`/quotes/${quote.id}`}>
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{quote.title}</p>
                        <StatusBadge
                          label={QUOTE_STATUS[status]?.label ?? status}
                          tone={QUOTE_STATUS[status]?.tone ?? "outline"}
                        />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {quote.quote_number} ·{" "}
                        {quote.clients?.name ?? quote.contact_name ?? "Sin cliente"}
                        {quote.valid_until &&
                          ` · vence ${format(new Date(quote.valid_until), "d MMM", {
                            locale: es,
                          })}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums">
                        {quote.total_ars ? formatArs(Number(quote.total_ars)) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatUsd(Number(quote.total_usd))}
                        {Number(quote.monthly_usd) > 0 &&
                          ` · +${formatUsd(Number(quote.monthly_usd))}/mes`}
                      </p>
                    </div>
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
