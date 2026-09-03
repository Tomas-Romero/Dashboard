import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InvoiceFormDialog } from "./invoice-form-dialog";
import { InvoiceRowActions } from "./invoice-row-actions";
import { TimeSummary } from "./time-summary";
import { getUnbilledTimeSummary } from "@/lib/actions/time-entries";
import type { Client, Invoice } from "@/types/database.types";

export const metadata: Metadata = { title: "Facturación · Mission Control" };

export default async function BillingPage() {
  await verifySession();
  const supabase = await createClient();
  const [{ data: invoices }, { data: clients }, timeSummary] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients(name)")
      .order("issue_date", { ascending: false }),
    supabase.from("clients").select("*").order("name"),
    getUnbilledTimeSummary().catch(() => []),
  ]);

  const rows = (invoices ?? []) as unknown as (Invoice & {
    clients: { name: string } | null;
  })[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Facturación</h2>
          <p className="text-sm text-muted-foreground">
            Seguimiento de cobros y horas registradas.
          </p>
        </div>
        <InvoiceFormDialog clients={(clients ?? []) as Client[]} />
      </div>

      <TimeSummary summary={timeSummary} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin facturas todavía"
          description="Registrá tus facturas para llevar el seguimiento de cobros por cliente."
          action={<InvoiceFormDialog clients={(clients ?? []) as Client[]} />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="w-[260px] text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.clients?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invoice.issue_date}</TableCell>
                  <TableCell>
                    {invoice.currency} {Number(invoice.total_amount).toLocaleString("es-AR")}
                  </TableCell>
                  <TableCell>
                    <InvoiceRowActions invoice={invoice} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
