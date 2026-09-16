"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { getExchangeRate, persistExchangeRate } from "@/lib/queries/exchange-rate";
import { computeQuote, validateQuote, type PricingLine } from "@/lib/quotes/pricing";
import type {
  InfraType,
  Quote,
  QuoteItem,
  QuoteSegment,
  QuoteStatus,
} from "@/types/database.types";

const VALIDITY_DAYS = 15;
const DEPOSIT_PCT = 40;

export interface SaveQuoteInput {
  title: string;
  clientId?: string | null;
  leadId?: string | null;
  contactName?: string | null;
  contactInfo?: string | null;
  segment: QuoteSegment;
  discountPct: number;
  surchargePct: number;
  notes?: string | null;
  lines: PricingLine[];
  requiresMaintenance: boolean;
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function nextQuoteNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true });
  return `P-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createQuoteAction(input: SaveQuoteInput) {
  await verifySession();

  const errors = validateQuote(input.lines, input.requiresMaintenance);
  if (errors.length > 0) return { error: errors[0] };
  if (!input.title.trim()) return { error: "Poné un título al presupuesto." };

  const rate = await getExchangeRate();
  await persistExchangeRate(rate);

  const totals = computeQuote({
    lines: input.lines,
    segment: input.segment,
    discountPct: input.discountPct,
    surchargePct: input.surchargePct,
    depositPct: DEPOSIT_PCT,
    exchangeRate: rate.sell,
  });

  const supabase = await createClient();
  const quoteNumber = await nextQuoteNumber();

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      title: input.title.trim(),
      client_id: input.clientId || null,
      lead_id: input.leadId || null,
      contact_name: input.contactName || null,
      contact_info: input.contactInfo || null,
      segment: input.segment,
      status: "draft" as QuoteStatus,
      subtotal_usd: totals.subtotalUsd,
      discount_pct: input.discountPct,
      surcharge_pct: input.surchargePct,
      total_usd: totals.totalUsd,
      total_ars: totals.totalArs,
      exchange_rate: rate.sell,
      monthly_usd: totals.monthlyUsd,
      deposit_pct: DEPOSIT_PCT,
      estimated_hours: totals.estimatedHours,
      market_total_usd: totals.marketTotalUsd,
      valid_until: format(addDays(new Date(), VALIDITY_DAYS), "yyyy-MM-dd"),
      public_token: randomToken(),
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const items = input.lines.map((line, index) => ({
    quote_id: quote.id,
    catalog_item_id: line.catalogItemId,
    kind: line.kind,
    name: line.name,
    description: line.description ?? null,
    quantity: line.quantity,
    unit_price_usd: line.unitPriceUsd,
    estimated_hours: line.estimatedHours,
    is_recurring: line.isRecurring,
    is_client_cost: line.isClientCost,
    position: index,
  }));

  const { error: itemsError } = await supabase.from("quote_items").insert(items);
  if (itemsError) return { error: itemsError.message };

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteStatusAction(id: string, status: QuoteStatus) {
  await verifySession();
  const supabase = await createClient();

  const patch: Partial<Quote> = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "accepted") patch.accepted_at = new Date().toISOString();

  await supabase.from("quotes").update(patch).eq("id", id);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function deleteQuoteAction(id: string) {
  await verifySession();
  const supabase = await createClient();
  await supabase.from("quotes").delete().eq("id", id);
  revalidatePath("/quotes");
  redirect("/quotes");
}

function guessInfraType(name: string): InfraType {
  const n = name.toLowerCase();
  if (n.includes("dominio")) return "domain";
  if (n.includes("base de datos") || n.includes("db")) return "database";
  if (n.includes("ssl") || n.includes("certificado")) return "ssl_certificate";
  if (n.includes("mail")) return "email";
  if (n.includes("hosting") || n.includes("vps") || n.includes("servidor")) return "hosting";
  return "other";
}

/**
 * Convierte un presupuesto en trabajo real: crea (o reusa) el cliente, un
 * proyecto, las tareas plantilla de cada ítem del catálogo, los recursos de
 * infraestructura/mantenimiento, y la factura de la seña. Es el paso que
 * dispara la Fase D del plan — one-click desde "Aceptar y convertir".
 *
 * Idempotente: si el presupuesto ya tiene `project_id`, no hace nada de
 * nuevo y devuelve el proyecto existente.
 */
export async function acceptQuoteAction(quoteId: string) {
  await verifySession();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (!quote) return { error: "Presupuesto no encontrado." };
  if (quote.project_id) return { success: true, projectId: quote.project_id };

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("position");
  const quoteItems = (items ?? []) as QuoteItem[];

  // 1) Cliente: reusar si ya estaba vinculado, si no crear uno a partir del contacto.
  let clientId = quote.client_id;
  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: quote.contact_name || quote.title,
        notes: quote.contact_info || null,
      })
      .select("id")
      .single();
    if (clientError) return { error: clientError.message };
    clientId = newClient.id;
  }

  // 2) Proyecto.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      client_id: clientId,
      name: quote.title,
      description: quote.notes || null,
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (projectError) return { error: projectError.message };
  const projectId = project.id;

  // 3) Tareas plantilla de cada ítem de catálogo con alcance de código (base/feature).
  const codeItems = quoteItems.filter(
    (i) => (i.kind === "base" || i.kind === "feature") && i.catalog_item_id
  );
  if (codeItems.length > 0) {
    const { data: templateTasks } = await supabase
      .from("catalog_item_tasks")
      .select("*")
      .in(
        "catalog_item_id",
        codeItems.map((i) => i.catalog_item_id as string)
      );

    const tasksToInsert = (templateTasks ?? []).map((t) => ({
      project_id: projectId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: "todo" as const,
    }));
    if (tasksToInsert.length > 0) {
      await supabase.from("tasks").insert(tasksToInsert);
    }
  }

  // 4) Infraestructura: ítems de infra y recurrentes (mantenimiento/suscripción) que no paga el cliente.
  const infraItems = quoteItems.filter(
    (i) => (i.kind === "infra" || i.kind === "recurring") && !i.is_client_cost
  );
  if (infraItems.length > 0) {
    await supabase.from("infrastructure").insert(
      infraItems.map((i) => ({
        project_id: projectId,
        type: guessInfraType(i.name),
        provider: i.name,
        status: "active" as const,
        monthly_cost: Number(i.unit_price_usd) * Number(i.quantity),
        notes: i.description,
      }))
    );
  }

  // 5) Factura de la seña.
  const totalArs = Number(quote.total_ars ?? 0);
  const depositArs = Math.round(totalArs * (Number(quote.deposit_pct) / 100));
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: clientId,
      invoice_number: `${quote.quote_number}-SEÑA`,
      status: "sent" as const,
      issue_date: new Date().toISOString().slice(0, 10),
      total_amount: depositArs,
      currency: "ARS",
    })
    .select("id")
    .single();
  if (invoiceError) return { error: invoiceError.message };

  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    project_id: projectId,
    description: `Seña (${Number(quote.deposit_pct)}%) — ${quote.title}`,
    quantity: 1,
    unit_price: depositArs,
  });

  // 6) Cerrar el presupuesto.
  await supabase
    .from("quotes")
    .update({
      status: "accepted" as QuoteStatus,
      accepted_at: new Date().toISOString(),
      project_id: projectId,
      client_id: clientId,
    })
    .eq("id", quoteId);

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/clients");
  revalidatePath("/projects");
  revalidatePath("/billing");
  revalidatePath("/infrastructure");

  return { success: true, projectId };
}

/** Recalcula un presupuesto vencido al dólar del día y renueva la validez. */
export async function refreshQuoteRateAction(id: string) {
  await verifySession();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("total_usd, monthly_usd")
    .eq("id", id)
    .single();

  if (!quote) return { error: "Presupuesto no encontrado." };

  const rate = await getExchangeRate();
  await persistExchangeRate(rate);

  await supabase
    .from("quotes")
    .update({
      exchange_rate: rate.sell,
      total_ars: Number(quote.total_usd) * rate.sell,
      valid_until: format(addDays(new Date(), VALIDITY_DAYS), "yyyy-MM-dd"),
      status: "draft" as QuoteStatus,
    })
    .eq("id", id);

  revalidatePath(`/quotes/${id}`);
  return { success: true };
}
