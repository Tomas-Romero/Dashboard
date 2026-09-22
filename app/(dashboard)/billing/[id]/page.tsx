import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, Receipt } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { INVOICE_STATUS } from "@/lib/status-config";
import { InvoiceItemDialog } from "./invoice-item-dialog";
import { InvoiceItemRow } from "./invoice-item-row";
import { InvoiceStatusSelect } from "./invoice-status-select";
import { deleteInvoiceAction } from "@/lib/actions/billing";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types/database.types";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: items }] = await Promise.all([
    supabase.from("invoices").select("*, clients(name)").eq("id", id).single(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("id"),
  ]);

  if (!invoice) notFound();

  const typedInvoice = invoice as unknown as Invoice & { clients: { name: string } | null };
  const typedItems = (items ?? []) as InvoiceItem[];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link
        href="/billing"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Facturación
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Factura {typedInvoice.invoice_number}
            </h2>
            <StatusBadge
              label={INVOICE_STATUS[typedInvoice.status as InvoiceStatus]?.label}
              tone={INVOICE_STATUS[typedInvoice.status as InvoiceStatus]?.tone}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {typedInvoice.clients?.name ?? "Sin cliente"} · Emitida el {typedInvoice.issue_date}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/invoices/${typedInvoice.id}/pdf`} target="_blank" rel="noreferrer">
              <FileDown /> PDF
            </a>
          </Button>
          <InvoiceStatusSelect invoice={typedInvoice} />
          <ConfirmDeleteButton
            title={`¿Eliminar la factura ${typedInvoice.invoice_number}?`}
            onDelete={() => deleteInvoiceAction(typedInvoice.id)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-2">
          {typedItems.length === 0 ? (
            <EmptyState
              icon={<Receipt className="size-6" />}
              title="Sin ítems todavía"
              description="Agregá al menos un ítem para que la factura tenga un total."
              action={<InvoiceItemDialog invoiceId={typedInvoice.id} />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {typedItems.map((item) => (
                  <InvoiceItemRow
                    key={item.id}
                    item={item}
                    invoiceId={typedInvoice.id}
                    currency={typedInvoice.currency}
                  />
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {typedInvoice.currency}{" "}
                    {Number(typedInvoice.total_amount).toLocaleString("es-AR")}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      {typedItems.length > 0 && (
        <div className="flex justify-end">
          <InvoiceItemDialog invoiceId={typedInvoice.id} />
        </div>
      )}
    </div>
  );
}
