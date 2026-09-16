"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { getExchangeRate, persistExchangeRate } from "@/lib/queries/exchange-rate";
import { computeQuote, validateQuote, type PricingLine } from "@/lib/quotes/pricing";
import type { Quote, QuoteSegment, QuoteStatus } from "@/types/database.types";

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
