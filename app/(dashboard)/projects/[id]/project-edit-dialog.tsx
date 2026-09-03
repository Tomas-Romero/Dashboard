"use client";

import { Pencil, Loader2 } from "lucide-react";
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
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { updateProjectAction, deleteProjectAction } from "@/lib/actions/projects";
import type { ActionState } from "@/lib/actions/clients";
import { PROJECT_STATUS } from "@/lib/status-config";
import type { Client, Project } from "@/types/database.types";

const initialState: ActionState = {};

export function ProjectEditDialog({
  project,
  clients,
}: {
  project: Project;
  clients: Client[];
}) {
  const action = updateProjectAction.bind(null, project.id);
  const { open, setOpen, state, formAction, pending } = useDialogFormAction(
    action,
    initialState
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar proyecto</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="e_name">Nombre *</Label>
            <Input id="e_name" name="name" defaultValue={project.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="e_client_id">Cliente</Label>
              <Select name="client_id" defaultValue={project.client_id ?? undefined}>
                <SelectTrigger id="e_client_id" className="w-full">
                  <SelectValue placeholder="Sin cliente" />
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
            <div className="grid gap-1.5">
              <Label htmlFor="e_status">Estado</Label>
              <Select name="status" defaultValue={project.status}>
                <SelectTrigger id="e_status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="e_description">Descripción</Label>
            <Textarea id="e_description" name="description" rows={3} defaultValue={project.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="e_repo_url">Repositorio</Label>
              <Input id="e_repo_url" name="repo_url" defaultValue={project.repo_url ?? ""} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e_live_url">URL en producción</Label>
              <Input id="e_live_url" name="live_url" defaultValue={project.live_url ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="e_hourly_rate">Tarifa/hora</Label>
              <Input id="e_hourly_rate" name="hourly_rate" type="number" step="0.01" defaultValue={project.hourly_rate ?? ""} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e_start_date">Inicio</Label>
              <Input id="e_start_date" name="start_date" type="date" defaultValue={project.start_date ?? ""} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e_end_date">Fin</Label>
              <Input id="e_end_date" name="end_date" type="date" defaultValue={project.end_date ?? ""} />
            </div>
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter className="justify-between sm:justify-between">
            <ConfirmDeleteButton
              title={`¿Eliminar "${project.name}"?`}
              description="Se eliminarán también sus tareas, mejoras, infraestructura y credenciales asociadas."
              onDelete={() => deleteProjectAction(project.id)}
            />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
