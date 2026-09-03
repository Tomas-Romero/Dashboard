"use client";

import { Plus, Loader2 } from "lucide-react";
import { useDialogFormAction } from "@/hooks/use-dialog-form-action";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoiceAction } from "@/lib/actions/billing";
import type { ActionState } from "@/lib/actions/clients";
import type { Client } from "@/types/database.types";

const initialState: ActionState = {};

export function InvoiceFormDialog({ clients }: { clients: Client[] }) {
  const { open, setOpen, state, formAction, pending } = useDialogFormAction(
    createInvoiceAction,
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nueva factura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva factura</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="client_id">Cliente *</Label>
            <Select name="client_id" required>
              <SelectTrigger id="client_id" className="w-full">
                <SelectValue placeholder="Elegí un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="invoice_number">Número *</Label>
              <Input id="invoice_number" name="invoice_number" placeholder="A-0001" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="total_amount">Monto *</Label>
              <Input id="total_amount" name="total_amount" type="number" step="0.01" min="0" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="issue_date">Emisión</Label>
              <Input
                id="issue_date"
                name="issue_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="due_date">Vencimiento</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="currency">Moneda</Label>
            <Input id="currency" name="currency" defaultValue="ARS" />
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Crear factura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
