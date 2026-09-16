import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicQuote, markQuoteViewed } from "@/lib/queries/public-quote";
import { QuotePublicView } from "./quote-public-view";

export const metadata: Metadata = { title: "Tu presupuesto" };

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPublicQuote(token);

  if (!data) notFound();

  await markQuoteViewed(data.quote.id);

  const expired = Boolean(
    data.quote.valid_until &&
      data.quote.status !== "accepted" &&
      new Date(data.quote.valid_until) < new Date()
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="aurora-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative z-10 flex w-full justify-center">
        <QuotePublicView
          data={data.quote}
          clientName={data.clientName ?? "vos"}
          expired={expired}
          token={token}
        />
      </div>
    </div>
  );
}
