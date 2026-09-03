import type { Metadata } from "next";
import Link from "next/link";
import { Users, Mail, Phone, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ClientFormDialog } from "./client-form-dialog";
import { ClientRowActions } from "./client-row-actions";
import type { Client } from "@/types/database.types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const metadata: Metadata = { title: "Clientes · Mission Control" };

export default async function ClientsPage() {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as Client[];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Contactos y empresas para las que trabajás.
          </p>
        </div>
        <ClientFormDialog />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no tenés clientes"
          description="Creá tu primer cliente para empezar a asociarle proyectos, facturas y credenciales."
          action={<ClientFormDialog />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="group">
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-3 font-medium hover:underline"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback
                          style={{ backgroundColor: client.avatar_color ?? undefined }}
                          className="text-xs text-white"
                        >
                          {initials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.company ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="size-3.5" /> {client.company}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex flex-col gap-0.5 text-xs">
                      {client.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5" /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5" /> {client.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <ClientFormDialog client={client} />
                      <ClientRowActions id={client.id} name={client.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
