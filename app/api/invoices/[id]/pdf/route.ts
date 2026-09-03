import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await verifySession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).single();

  if (!invoice) {
    return new Response("Factura no encontrada", { status: 404 });
  }

  const [{ data: client }, { data: items }] = await Promise.all([
    supabase.from("clients").select("name, email").eq("id", invoice.client_id).single(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id),
  ]);

  const buffer = await renderToBuffer(
    createElement(InvoiceDocument, {
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      currency: invoice.currency,
      totalAmount: Number(invoice.total_amount),
      clientName: client?.name ?? "Cliente",
      clientEmail: client?.email ?? null,
      items: (items ?? []).map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
    }) as unknown as ReactElement<DocumentProps>
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="factura-${invoice.invoice_number}.pdf"`,
    },
  });
}
