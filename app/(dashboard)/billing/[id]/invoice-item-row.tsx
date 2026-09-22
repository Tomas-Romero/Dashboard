"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { InvoiceItemDialog } from "./invoice-item-dialog";
import { deleteInvoiceItemAction } from "@/lib/actions/billing";
import type { InvoiceItem } from "@/types/database.types";

export function InvoiceItemRow({
  item,
  invoiceId,
  currency,
}: {
  item: InvoiceItem;
  invoiceId: string;
  currency: string;
}) {
  return (
    <TableRow className="group">
      <TableCell>{item.description}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {Number(item.quantity)}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {currency} {Number(item.unit_price).toLocaleString("es-AR")}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {currency} {Number(item.subtotal).toLocaleString("es-AR")}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <InvoiceItemDialog invoiceId={invoiceId} item={item} />
          <ConfirmDeleteButton
            title="¿Eliminar este ítem?"
            onDelete={() => deleteInvoiceItemAction(item.id, invoiceId)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
