import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { getPublicQuote } from "@/lib/queries/public-quote";
import { QuoteDocument } from "@/lib/pdf/quote-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const data = await getPublicQuote(token);

  if (!data) {
    return new Response("Presupuesto no encontrado", { status: 404 });
  }

  const { quote, items, clientName } = data;
  const rate = Number(quote.exchange_rate ?? 0);
  const depositArs = Number(quote.total_ars ?? 0) * (Number(quote.deposit_pct) / 100);
  const balanceArs = Number(quote.total_ars ?? 0) - depositArs;
  const monthlyArs = Number(quote.monthly_usd) * rate;

  const buffer = await renderToBuffer(
    createElement(QuoteDocument, {
      quoteNumber: quote.quote_number,
      title: quote.title,
      clientName: clientName ?? "Cliente",
      issueDate: new Date(quote.created_at).toLocaleDateString("es-AR"),
      validUntil: quote.valid_until
        ? new Date(quote.valid_until).toLocaleDateString("es-AR")
        : null,
      totalArs: Number(quote.total_ars ?? 0),
      totalUsd: Number(quote.total_usd),
      depositPct: Number(quote.deposit_pct),
      depositArs,
      balanceArs,
      monthlyArs,
      monthlyUsd: Number(quote.monthly_usd),
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: Number(item.quantity),
        unitPriceArs: Number(item.unit_price_usd) * rate,
        unitPriceUsd: Number(item.unit_price_usd),
        isRecurring: item.is_recurring,
        isClientCost: item.is_client_cost,
      })),
    }) as unknown as ReactElement<DocumentProps>
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${quote.quote_number}.pdf"`,
    },
  });
}
