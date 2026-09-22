import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getExchangeRate } from "@/lib/queries/exchange-rate";
import { QuoteCalculator } from "./quote-calculator";
import type { CatalogItem, Client } from "@/types/database.types";

export const metadata: Metadata = { title: "Nuevo presupuesto · Dashboard TARC Tech" };

export default async function NewQuotePage() {
  await verifySession();
  const supabase = await createClient();

  const [{ data: catalog }, { data: clients }, rate] = await Promise.all([
    supabase
      .from("catalog_items")
      .select("*")
      .eq("active", true)
      .order("kind")
      .order("position"),
    supabase.from("clients").select("*").order("name"),
    getExchangeRate(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/quotes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Presupuestos
      </Link>

      <QuoteCalculator
        catalog={(catalog ?? []) as CatalogItem[]}
        clients={(clients ?? []) as Client[]}
        exchangeRate={rate.sell}
        rateSource={rate.source}
      />
    </div>
  );
}
