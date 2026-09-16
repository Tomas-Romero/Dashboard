import Link from "next/link";
import { notFound } from "next/navigation";
import { format, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock3, Scale, TrendingUp, Wallet } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { QUOTE_STATUS } from "@/lib/status-config";
import { formatArs, formatUsd, SEGMENT_LABELS } from "@/lib/quotes/pricing";
import { QuoteActions } from "./quote-actions";
import { ShareQuote } from "./share-quote";
import { AcceptQuoteButton } from "./accept-quote-button";
import type { Quote, QuoteItem, QuoteStatus, QuoteSegment } from "@/types/database.types";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("position"),
  ]);

  if (!quote) notFound();

  const typedQuote = quote as Quote;
  const typedItems = (items ?? []) as QuoteItem[];

  const client = typedQuote.client_id
    ? (await supabase.from("clients").select("name").eq("id", typedQuote.client_id).single())
        .data
    : null;

  const expired = Boolean(
    typedQuote.valid_until &&
      typedQuote.status !== "accepted" &&
      isBefore(new Date(typedQuote.valid_until), new Date())
  );
  const status = (expired ? "expired" : typedQuote.status) as QuoteStatus;

  const oneOff = typedItems.filter((i) => !i.is_recurring && !i.is_client_cost);
  const recurring = typedItems.filter((i) => i.is_recurring && !i.is_client_cost);
  const clientCosts = typedItems.filter((i) => i.is_client_cost);

  const depositArs = Number(typedQuote.total_ars ?? 0) * (Number(typedQuote.deposit_pct) / 100);
  const balanceArs = Number(typedQuote.total_ars ?? 0) - depositArs;
  const monthlyArs = Number(typedQuote.monthly_usd) * Number(typedQuote.exchange_rate ?? 0);
  const hourly =
    Number(typedQuote.estimated_hours) > 0
      ? Number(typedQuote.total_usd) / Number(typedQuote.estimated_hours)
      : 0;
  const underpricing =
    Number(typedQuote.market_total_usd) > 0
      ? Math.max(
          0,
          (1 - Number(typedQuote.total_usd) / Number(typedQuote.market_total_usd)) * 100
        )
      : 0;

  // Fase F: una vez que el presupuesto se convirtió en proyecto, comparamos
  // las horas estimadas acá contra lo que realmente marcó el cronómetro.
  let realHours: number | null = null;
  if (typedQuote.project_id) {
    const { data: entries } = await supabase
      .from("time_entries")
      .select("duration_minutes")
      .eq("project_id", typedQuote.project_id)
      .not("duration_minutes", "is", null);
    realHours =
      (entries ?? []).reduce((sum, e) => sum + Number(e.duration_minutes ?? 0), 0) / 60;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link
        href="/quotes"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Presupuestos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{typedQuote.title}</h2>
            <StatusBadge
              label={QUOTE_STATUS[status]?.label ?? status}
              tone={QUOTE_STATUS[status]?.tone ?? "outline"}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {typedQuote.quote_number} ·{" "}
            {client?.name ?? typedQuote.contact_name ?? "Sin cliente"} ·{" "}
            {SEGMENT_LABELS[typedQuote.segment as QuoteSegment]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!typedQuote.project_id && <AcceptQuoteButton quoteId={typedQuote.id} />}
          <QuoteActions quote={typedQuote} expired={expired} />
        </div>
      </div>

      {typedQuote.project_id && (
        <Link
          href={`/projects/${typedQuote.project_id}`}
          className="text-sm text-primary hover:underline"
        >
          Ver proyecto creado a partir de este presupuesto →
        </Link>
      )}

      <ShareQuote token={typedQuote.public_token} />

      {/* Totales */}
      <Card className="card-glow">
        <CardContent className="flex flex-wrap items-end justify-between gap-4 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Total del proyecto</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {typedQuote.total_ars ? formatArs(Number(typedQuote.total_ars)) : "—"}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatUsd(Number(typedQuote.total_usd))} · dólar{" "}
              {Number(typedQuote.exchange_rate)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">
              Seña {Number(typedQuote.deposit_pct)}%:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatArs(depositArs)}
              </span>
            </p>
            <p className="text-muted-foreground">
              Saldo:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatArs(balanceArs)}
              </span>
            </p>
            {Number(typedQuote.monthly_usd) > 0 && (
              <p className="mt-1 text-muted-foreground">
                Abono:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatArs(monthlyArs)}/mes
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Control interno */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InternalMetric
          icon={Clock3}
          label="Horas estimadas"
          value={`${Number(typedQuote.estimated_hours)} h`}
        />
        <InternalMetric
          icon={Wallet}
          label="Rentabilidad"
          value={`${formatUsd(hourly)}/h`}
        />
        <InternalMetric
          icon={TrendingUp}
          label="Precio de mercado"
          value={formatUsd(Number(typedQuote.market_total_usd))}
          hint={underpricing >= 1 ? `${Math.round(underpricing)}% por debajo` : undefined}
        />
        {realHours !== null && (
          <InternalMetric
            icon={Scale}
            label="Estimado vs. real"
            value={`${Number(typedQuote.estimated_hours)}h → ${realHours.toFixed(1)}h`}
            hint={
              realHours > Number(typedQuote.estimated_hours)
                ? `${Math.round((realHours / Number(typedQuote.estimated_hours) - 1) * 100)}% más de lo estimado`
                : Number(typedQuote.estimated_hours) > 0
                  ? "Dentro de lo estimado"
                  : undefined
            }
          />
        )}
      </div>

      {/* Detalle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detalle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {oneOff.map((item) => (
            <ItemRow key={item.id} item={item} rate={Number(typedQuote.exchange_rate)} />
          ))}

          {recurring.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="px-1 text-xs font-medium text-muted-foreground">
                Abono mensual
              </p>
              {recurring.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  rate={Number(typedQuote.exchange_rate)}
                  suffix="/mes"
                />
              ))}
            </>
          )}

          {clientCosts.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="px-1 text-xs font-medium text-muted-foreground">
                No incluido — lo abona el cliente
              </p>
              {clientCosts.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  rate={Number(typedQuote.exchange_rate)}
                  muted
                />
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {typedQuote.valid_until && (
        <p className="text-center text-xs text-muted-foreground">
          {expired ? "Venció el" : "Precio congelado hasta el"}{" "}
          {format(new Date(typedQuote.valid_until), "d 'de' MMMM", { locale: es })}
        </p>
      )}

      {typedQuote.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notas internas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{typedQuote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemRow({
  item,
  rate,
  suffix = "",
  muted = false,
}: {
  item: QuoteItem;
  rate: number;
  suffix?: string;
  muted?: boolean;
}) {
  const total = Number(item.unit_price_usd) * Number(item.quantity);
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg px-1 py-1.5 text-sm">
      <div className="min-w-0">
        <p className={muted ? "text-muted-foreground" : ""}>
          {item.name}
          {Number(item.quantity) > 1 && ` ×${Number(item.quantity)}`}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className={muted ? "text-muted-foreground" : "font-medium"}>
          {formatArs(total * rate)}
          {suffix}
        </p>
        <p className="text-xs text-muted-foreground">{formatUsd(total)}</p>
      </div>
    </div>
  );
}

function InternalMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold tabular-nums">{value}</p>
          {hint && (
            <Badge variant="outline" className="mt-0.5 font-normal">
              {hint}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
