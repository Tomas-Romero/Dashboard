"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import type { ActionState } from "@/lib/actions/clients";
import type { InvoiceStatus } from "@/types/database.types";

const InvoiceSchema = z.object({
  client_id: z.string().uuid("Elegí un cliente."),
  invoice_number: z.string().min(1, "Ingresá un número de factura."),
  issue_date: z.string().min(1),
  due_date: z.string().optional(),
  total_amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  currency: z.string().default("ARS"),
});

export async function createInvoiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifySession();
  const parsed = InvoiceSchema.safeParse({
    client_id: formData.get("client_id"),
    invoice_number: formData.get("invoice_number"),
    issue_date: formData.get("issue_date"),
    due_date: formData.get("due_date") || undefined,
    total_amount: formData.get("total_amount"),
    currency: formData.get("currency") || "ARS",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { error: error.message };

  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    description: "Servicios profesionales",
    quantity: 1,
    unit_price: parsed.data.total_amount,
  });

  revalidatePath("/billing");
  return { success: true };
}

export async function generateInvoiceFromTimeAction(projectId: string) {
  await verifySession();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("name, client_id, hourly_rate")
    .eq("id", projectId)
    .single();

  if (!project?.client_id) {
    return { error: "Este proyecto no tiene un cliente asignado." };
  }
  if (!project.hourly_rate) {
    return { error: "Este proyecto no tiene una tarifa por hora configurada." };
  }

  // Recomputed server-side (not trusted from the client) so a timer started
  // after the summary was rendered can't be double-billed or missed.
  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, duration_minutes")
    .eq("project_id", projectId)
    .eq("billable", true)
    .eq("invoiced", false)
    .not("ended_at", "is", null);

  const unbilled = entries ?? [];
  const totalMinutes = unbilled.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
  if (totalMinutes === 0) {
    return { error: "No hay horas sin facturar en este proyecto." };
  }

  const hours = totalMinutes / 60;
  const totalAmount = Math.round(hours * project.hourly_rate * 100) / 100;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      client_id: project.client_id,
      invoice_number: `T-${Date.now().toString().slice(-8)}`,
      issue_date: new Date().toISOString().slice(0, 10),
      total_amount: totalAmount,
      currency: "ARS",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await Promise.all([
    supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      project_id: projectId,
      description: `Horas trabajadas en ${project.name} (${hours.toFixed(1)}h a $${project.hourly_rate}/h)`,
      quantity: hours,
      unit_price: project.hourly_rate,
    }),
    supabase
      .from("time_entries")
      .update({ invoiced: true })
      .in("id", unbilled.map((e) => e.id)),
  ]);

  revalidatePath("/billing");
  return { success: true, invoiceId: invoice.id };
}

export async function updateInvoiceStatusAction(id: string, status: InvoiceStatus) {
  await verifySession();
  const supabase = await createClient();
  const paid_date = status === "paid" ? new Date().toISOString().slice(0, 10) : null;
  await supabase.from("invoices").update({ status, paid_date }).eq("id", id);
  revalidatePath("/billing");
}

export async function deleteInvoiceAction(id: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/billing");
}
