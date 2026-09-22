"use client";

import { Plus, Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
import { addInvoiceItemAction, updateInvoiceItemAction } from "@/lib/actions/billing";
import type { ActionState } from "@/lib/actions/clients";
import type { InvoiceItem } from "@/types/database.types";

const initialState: ActionState = {};

export function InvoiceItemDialog({
  invoiceId,
  item,
}: {
  invoiceId: string;
  item?: InvoiceItem;
}) {
  const action = item
    ? updateInvoiceItemAction.bind(null, item.id, invoiceId)
    : addInvoiceItemAction.bind(null, invoiceId);
  const { open, setOpen, state, formAction, pending } = useDialogFormAction(
    action,
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {item ? (
          <Button variant="ghost" size="icon" className="size-8">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Agregar ítem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar ítem" : "Nuevo ítem"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              name="description"
              defaultValue={item?.description}
              placeholder="Ej: Desarrollo del panel admin"
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={item ? Number(item.quantity) : 1}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="unit_price">Precio unitario *</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item ? Number(item.unit_price) : undefined}
                required
              />
            </div>
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {item ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
