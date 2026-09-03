"use client";

import { useTransition } from "react";
import { FileDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { updateInvoiceStatusAction, deleteInvoiceAction } from "@/lib/actions/billing";
import { INVOICE_STATUS } from "@/lib/status-config";
import type { Invoice, InvoiceStatus } from "@/types/database.types";

export function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button variant="ghost" size="icon" className="size-8" asChild>
        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer" title="Descargar PDF">
          <FileDown className="size-4" />
        </a>
      </Button>
      <Select
        defaultValue={invoice.status}
        onValueChange={(status) =>
          startTransition(() =>
            updateInvoiceStatusAction(invoice.id, status as InvoiceStatus)
          )
        }
      >
        <SelectTrigger size="sm" className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(INVOICE_STATUS).map(([value, { label }]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ConfirmDeleteButton
        title={`¿Eliminar la factura ${invoice.invoice_number}?`}
        onDelete={() => deleteInvoiceAction(invoice.id)}
      />
    </div>
  );
}
