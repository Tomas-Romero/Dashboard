"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { InvoiceStatusSelect } from "./[id]/invoice-status-select";
import { deleteInvoiceAction } from "@/lib/actions/billing";
import type { Invoice } from "@/types/database.types";

export function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer" title="Descargar PDF">
          <FileDown className="size-4" />
        </a>
      </Button>
      <InvoiceStatusSelect invoice={invoice} />
      <ConfirmDeleteButton
        title={`¿Eliminar la factura ${invoice.invoice_number}?`}
        onDelete={() => deleteInvoiceAction(invoice.id)}
      />
    </div>
  );
}
