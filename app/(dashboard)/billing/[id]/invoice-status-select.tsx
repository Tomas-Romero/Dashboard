"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInvoiceStatusAction } from "@/lib/actions/billing";
import { INVOICE_STATUS } from "@/lib/status-config";
import type { Invoice, InvoiceStatus } from "@/types/database.types";

export function InvoiceStatusSelect({ invoice }: { invoice: Invoice }) {
  const [, startTransition] = useTransition();

  return (
    <Select
      defaultValue={invoice.status}
      onValueChange={(status) =>
        startTransition(() =>
          updateInvoiceStatusAction(invoice.id, status as InvoiceStatus)
        )
      }
    >
      <SelectTrigger size="sm" className="w-[140px]">
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
  );
}
