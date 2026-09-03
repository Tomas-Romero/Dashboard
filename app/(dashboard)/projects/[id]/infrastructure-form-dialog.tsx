"use client";

import { Plus, Loader2, Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createInfrastructureAction,
  updateInfrastructureAction,
} from "@/lib/actions/infrastructure";
import type { ActionState } from "@/lib/actions/clients";
import { INFRA_STATUS } from "@/lib/status-config";
import type { Infrastructure } from "@/types/database.types";

const initialState: ActionState = {};

const TYPE_LABELS: Record<string, string> = {
  hosting: "Hosting",
  database: "Base de datos",
  domain: "Dominio",
  ssl_certificate: "Certificado SSL",
  email: "Email",
  other: "Otro",
};

export function InfrastructureFormDialog({
  projectId,
  infra,
}: {
  projectId: string;
  infra?: Infrastructure;
}) {
  const action = infra
    ? updateInfrastructureAction.bind(null, infra.id, projectId)
    : createInfrastructureAction.bind(null, projectId);
  const { open, setOpen, state, formAction, pending } = useDialogFormAction(
    action,
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {infra ? (
          <Button variant="ghost" size="icon" className="size-8">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Agregar recurso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{infra ? "Editar recurso" : "Nuevo recurso"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" defaultValue={infra?.type ?? "hosting"}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue={infra?.status ?? "active"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INFRA_STATUS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="provider">Proveedor</Label>
              <Input id="provider" name="provider" defaultValue={infra?.provider ?? ""} placeholder="DonWeb, AWS..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="identifier">Identificador</Label>
              <Input id="identifier" name="identifier" defaultValue={infra?.identifier ?? ""} placeholder="midominio.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="renewal_date">Vencimiento</Label>
              <Input id="renewal_date" name="renewal_date" type="date" defaultValue={infra?.renewal_date ?? ""} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="monthly_cost">Costo mensual</Label>
              <Input id="monthly_cost" name="monthly_cost" type="number" step="0.01" min="0" defaultValue={infra?.monthly_cost ?? ""} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={infra?.notes ?? ""} />
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {infra ? "Guardar cambios" : "Agregar recurso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
