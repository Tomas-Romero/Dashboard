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
import { Textarea } from "@/components/ui/textarea";
import { createLeadAction } from "@/lib/actions/leads";
import type { ActionState } from "@/lib/actions/clients";

const initialState: ActionState = {};

export function LeadFormDialog() {
  const { open, setOpen, state, formAction, pending } = useDialogFormAction(
    createLeadAction,
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nuevo lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="contact_info">Contacto</Label>
              <Input id="contact_info" name="contact_info" placeholder="Email o teléfono" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="source">Origen</Label>
              <Input id="source" name="source" placeholder="Referido, LinkedIn..." />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Crear lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
