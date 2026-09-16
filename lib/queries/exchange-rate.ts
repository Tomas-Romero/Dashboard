import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ExchangeRateInfo {
  buy: number;
  sell: number;
  source: "live" | "cache" | "fallback";
  fetchedAt: string;
}

const FALLBACK_RATE = 1560;
const DOLAR_API = "https://dolarapi.com/v1/dolares/blue";

/**
 * Cotización del dólar blue.
 *
 * Cadena de respaldo, en orden:
 *   1. API pública (cacheada 30 min por Next).
 *   2. Última cotización guardada en la base.
 *   3. Valor fijo de `app_settings.fallback_rate`.
 *
 * Nunca lanza: un presupuesto tiene que poder armarse aunque la API esté caída.
 */
export async function getExchangeRate(): Promise<ExchangeRateInfo> {
  try {
    const res = await fetch(DOLAR_API, { next: { revalidate: 1800 } });
    if (res.ok) {
      const data = await res.json();
      const buy = Number(data.compra);
      const sell = Number(data.venta);
      if (buy > 0 && sell > 0) {
        return {
          buy,
          sell,
          source: "live",
          fetchedAt: data.fechaActualizacion ?? new Date().toISOString(),
        };
      }
    }
  } catch {
    // Sigue con el respaldo.
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("exchange_rates")
      .select("buy, sell, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.sell) {
      return {
        buy: Number(data.buy ?? data.sell),
        sell: Number(data.sell),
        source: "cache",
        fetchedAt: data.fetched_at,
      };
    }

    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "fallback_rate")
      .maybeSingle();

    const fallback = Number(setting?.value ?? FALLBACK_RATE);
    return {
      buy: fallback,
      sell: fallback,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return {
      buy: FALLBACK_RATE,
      sell: FALLBACK_RATE,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };
  }
}

/** Guarda la cotización para que quede disponible si la API se cae. */
export async function persistExchangeRate(info: ExchangeRateInfo) {
  if (info.source !== "live") return;
  try {
    const supabase = await createClient();
    await supabase.from("exchange_rates").insert({
      source: "blue",
      buy: info.buy,
      sell: info.sell,
    });
  } catch {
    // No es crítico.
  }
}
