"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createProjectAction } from "@/lib/actions/projects";
import type { ActionState } from "@/lib/actions/clients";
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
import { Card, CardContent } from "@/components/ui/card";
import { PROJECT_STATUS } from "@/lib/status-config";
import type { Client } from "@/types/database.types";

const initialState: ActionState = {};

export function ProjectForm({
  clients,
  defaultClientId,
}: {
  clients: Client[];
  defaultClientId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre del proyecto *</Label>
            <Input id="name" name="name" required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="client_id">Cliente</Label>
              <Select name="client_id" defaultValue={defaultClientId}>
                <SelectTrigger id="client_id" className="w-full">
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
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue="planning">
                <SelectTrigger id="status" className="w-full">
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
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="repo_url">Repositorio (GitHub)</Label>
              <Input id="repo_url" name="repo_url" placeholder="https://github.com/..." />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="live_url">URL en producción</Label>
              <Input id="live_url" name="live_url" placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="hourly_rate">Tarifa por hora</Label>
              <Input id="hourly_rate" name="hourly_rate" type="number" step="0.01" min="0" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="start_date">Inicio</Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="end_date">Fin</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending && <Loader2 className="animate-spin" />}
            Crear proyecto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
