import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
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
import { EmptyState } from "@/components/dashboard/empty-state";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadRowActions } from "./lead-row-actions";
import type { Lead } from "@/types/database.types";

export const metadata: Metadata = { title: "Leads · Mission Control" };

export default async function LeadsPage() {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leads</h2>
          <p className="text-sm text-muted-foreground">
            Prospectos que todavía no son clientes.
          </p>
        </div>
        <LeadFormDialog />
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Sin leads todavía"
          description="Registrá prospectos y llevá el seguimiento hasta convertirlos en clientes."
          action={<LeadFormDialog />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="w-[280px] text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.contact_info ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source ?? "—"}
                  </TableCell>
                  <TableCell>
                    <LeadRowActions lead={lead} />
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
