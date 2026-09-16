import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { Quote, QuoteItem } from "@/types/database.types";

export interface PublicQuoteData {
  quote: Quote;
  items: QuoteItem[];
  clientName: string | null;
}

/**
 * Lectura pública por token, sin sesión. Usa el cliente de servicio porque
 * un visitante sin login no puede pasar la política de RLS de `quotes`
 * (que exige `auth.uid() is not null`) — el token cumple el rol de
 * autenticación para este único caso de uso.
 */
export async function getPublicQuote(token: string): Promise<PublicQuoteData | null> {
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();

  if (!quote) return null;

  const [{ data: items }, clientName] = await Promise.all([
    supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("position"),
    quote.client_id
      ? supabase
          .from("clients")
          .select("name")
          .eq("id", quote.client_id)
          .maybeSingle()
          .then((r) => r.data?.name ?? null)
      : Promise.resolve(quote.contact_name),
  ]);

  return {
    quote: quote as Quote,
    items: (items ?? []) as QuoteItem[],
    clientName,
  };
}

/** Marca la primera vez que el cliente abre el link. No pisa la fecha si ya estaba vista. */
export async function markQuoteViewed(quoteId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("quotes")
    .select("viewed_at")
    .eq("id", quoteId)
    .maybeSingle();

  if (!data?.viewed_at) {
    await supabase
      .from("quotes")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", quoteId);
  }
}
