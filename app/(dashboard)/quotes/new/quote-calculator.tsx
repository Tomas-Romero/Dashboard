"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Save,
  TriangleAlert,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createQuoteAction } from "@/lib/actions/quotes";
import {
  computeQuote,
  defaultPrice,
  formatArs,
  formatUsd,
  SEGMENT_LABELS,
  type PricingLine,
} from "@/lib/quotes/pricing";
import { cn } from "@/lib/utils";
import type { CatalogItem, Client, QuoteSegment } from "@/types/database.types";

interface Selection {
  item: CatalogItem;
  price: number;
  quantity: number;
}

const BLOCKS: { kind: CatalogItem["kind"]; title: string; hint: string }[] = [
  { kind: "base", title: "Tipo de sistema", hint: "Elegí uno. Define el piso del presupuesto." },
  { kind: "feature", title: "Funcionalidades", hint: "Lo que suma trabajo de desarrollo." },
  { kind: "addon", title: "Complementos", hint: "Todo lo que no es código." },
  { kind: "infra", title: "Infraestructura", hint: "Hosting, dominio y servicios." },
  { kind: "recurring", title: "Abono mensual", hint: "Mantenimiento y suscripciones." },
];

export function QuoteCalculator({
  catalog,
  clients,
  exchangeRate,
  rateSource,
}: {
  catalog: CatalogItem[];
  clients: Client[];
  exchangeRate: number;
  rateSource: string;
}) {
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [contactName, setContactName] = useState("");
  const [segment, setSegment] = useState<QuoteSegment>("local");
  const [discountPct, setDiscountPct] = useState(0);
  const [surchargePct, setSurchargePct] = useState(0);
  const [notes, setNotes] = useState("");
  const [clientView, setClientView] = useState(false);
  const [openBlock, setOpenBlock] = useState<string | null>("base");
  const [pending, startTransition] = useTransition();

  const lines: PricingLine[] = useMemo(
    () =>
      Object.values(selections).map((sel) => ({
        catalogItemId: sel.item.id,
        kind: sel.item.kind,
        name: sel.item.name,
        description: sel.item.description,
        quantity: sel.quantity,
        unitPriceUsd: sel.price,
        estimatedHours: Number(sel.item.estimated_hours),
        isRecurring: sel.item.is_recurring,
        isClientCost: sel.item.is_client_cost,
        marketReferenceUsd: sel.item.market_reference_usd,
      })),
    [selections]
  );

  const totals = useMemo(
    () =>
      computeQuote({
        lines,
        segment,
        discountPct,
        surchargePct,
        depositPct: 40,
        exchangeRate,
      }),
    [lines, segment, discountPct, surchargePct, exchangeRate]
  );

  const requiresMaintenance = Object.values(selections).some(
    (s) => s.item.requires_maintenance
  );
  const hasMaintenance = Object.values(selections).some(
    (s) => s.item.is_recurring && !s.item.is_client_cost
  );
  const maintenanceMissing = requiresMaintenance && !hasMaintenance;

  function toggle(item: CatalogItem) {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
        return next;
      }
      // La base es excluyente: elegir otra reemplaza la anterior.
      if (item.kind === "base") {
        for (const key of Object.keys(next)) {
          if (next[key].item.kind === "base") delete next[key];
        }
      }
      next[item.id] = {
        item,
        price: defaultPrice(Number(item.price_min_usd), Number(item.price_max_usd)),
        quantity: 1,
      };
      return next;
    });
  }

  function adjustPrice(itemId: string, direction: 1 | -1) {
    setSelections((prev) => {
      const sel = prev[itemId];
      if (!sel) return prev;
      const min = Number(sel.item.price_min_usd);
      const max = Number(sel.item.price_max_usd);
      const step = Math.max(1, Math.round((max - min) / 4));
      const next = Math.min(max, Math.max(min, sel.price + step * direction));
      return { ...prev, [itemId]: { ...sel, price: next } };
    });
  }

  function handleSave() {
    if (!title.trim()) {
      toast.error("Poné un título al presupuesto.");
      return;
    }
    startTransition(async () => {
      const result = await createQuoteAction({
        title,
        clientId: clientId || null,
        contactName: contactName || null,
        segment,
        discountPct,
        surchargePct,
        notes,
        lines,
        requiresMaintenance,
      });
      if (result?.error) toast.error(result.error);
    });
  }

  const selectedCount = Object.keys(selections).length;

  return (
    <div className="pb-44">
      {/* ---------- Encabezado ---------- */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Web institucional para Estudio López"
              className="h-11 border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            variant={clientView ? "default" : "outline"}
            size="sm"
            onClick={() => setClientView((v) => !v)}
            className="shrink-0"
          >
            {clientView ? <Eye /> : <EyeOff />}
            <span className="hidden sm:inline">
              {clientView ? "Vista cliente" : "Vista interna"}
            </span>
          </Button>
        </div>

        {!clientView && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Prospecto sin cargar" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!clientId && (
              <div className="grid gap-1.5">
                <Label className="text-xs">Nombre del prospecto</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Quién te escribió"
                />
              </div>
            )}
          </div>
        )}

        {/* Segmento */}
        <div className="flex gap-2">
          {(Object.keys(SEGMENT_LABELS) as QuoteSegment[]).map((seg) => (
            <button
              key={seg}
              onClick={() => setSegment(seg)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                segment === seg
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {SEGMENT_LABELS[seg]}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Bloques ---------- */}
      <div className="mt-5 flex flex-col gap-3">
        {BLOCKS.map((block) => {
          const items = catalog.filter((c) => c.kind === block.kind);
          if (items.length === 0) return null;
          const isOpen = openBlock === block.kind;
          const chosen = items.filter((i) => selections[i.id]).length;

          return (
            <div key={block.kind} className="overflow-hidden rounded-xl border">
              <button
                onClick={() => setOpenBlock(isOpen ? null : block.kind)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{block.title}</p>
                  {!clientView && (
                    <p className="truncate text-xs text-muted-foreground">{block.hint}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {chosen > 0 && <Badge variant="secondary">{chosen}</Badge>}
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="flex flex-col gap-2 border-t p-3">
                      {items.map((item) => {
                        const sel = selections[item.id];
                        const active = Boolean(sel);
                        const min = Number(item.price_min_usd);
                        const max = Number(item.price_max_usd);
                        const hasRange = max > min;

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "rounded-xl border p-3 transition-all",
                              active && "border-primary/50 bg-primary/5"
                            )}
                          >
                            <button
                              onClick={() => toggle(item)}
                              className="flex w-full items-start gap-3 text-left"
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input"
                                )}
                              >
                                {active && <Check className="size-3.5" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium">
                                  {item.name}
                                  {item.is_client_cost && (
                                    <Badge variant="outline" className="font-normal">
                                      lo paga el cliente
                                    </Badge>
                                  )}
                                </span>
                                {item.description && (
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {item.description}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                                {formatUsd(
                                  sel?.price ?? defaultPrice(min, max)
                                )}
                                {item.is_recurring && (
                                  <span className="block text-[11px] font-normal text-muted-foreground">
                                    por mes
                                  </span>
                                )}
                              </span>
                            </button>

                            {active && hasRange && !clientView && (
                              <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                                <span className="text-xs text-muted-foreground">
                                  Rango {formatUsd(min)} – {formatUsd(max)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => adjustPrice(item.id, -1)}
                                    disabled={sel.price <= min}
                                  >
                                    <Minus className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => adjustPrice(item.id, 1)}
                                    disabled={sel.price >= max}
                                  >
                                    <Plus className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ---------- Ajustes internos ---------- */}
      {!clientView && (
        <div className="mt-3 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">Descuento %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Recargo por urgencia %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={surchargePct}
              onChange={(e) => setSurchargePct(Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label className="text-xs">Notas internas</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto, condiciones, lo que hablaste con el cliente..."
            />
          </div>
        </div>
      )}

      {/* ---------- Panel interno ---------- */}
      {!clientView && selectedCount > 0 && (
        <div className="mt-3 grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
          <Metric label="Horas estimadas" value={`${totals.estimatedHours} h`} />
          <Metric
            label="Rentabilidad"
            value={`${formatUsd(totals.effectiveHourlyUsd)}/h`}
          />
          <Metric label="Precio de mercado" value={formatUsd(totals.marketTotalUsd)} />
          {totals.clientCostsUsd > 0 && (
            <Metric
              label="Costos del cliente"
              value={formatUsd(totals.clientCostsUsd)}
              hint="No suman al total"
            />
          )}
        </div>
      )}

      {/* ---------- Avisos ---------- */}
      <AnimatePresence>
        {maintenanceMissing && (
          <Warning key="maintenance" tone="destructive">
            Los SaaS para terceros llevan <strong>mantenimiento mensual obligatorio</strong>.
            Agregalo en el bloque de abono antes de guardar.
          </Warning>
        )}
        {!clientView && totals.underpricingPct >= 30 && selectedCount > 0 && (
          <Warning key="underpricing" tone="warning">
            Estás <strong>{Math.round(totals.underpricingPct)}% por debajo</strong> del precio
            de mercado ({formatUsd(totals.marketTotalUsd)}). Puede estar bien si buscás sumar
            clientes — pero que sea una decisión, no un descuido.
          </Warning>
        )}
      </AnimatePresence>

      {/* ---------- Barra fija de totales ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total del proyecto</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatArs(totals.totalArs)}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatUsd(totals.totalUsd)} · dólar {exchangeRate}
                {rateSource !== "live" && " (última cotización)"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Seña 40%</p>
              <p className="font-semibold tabular-nums">{formatArs(totals.depositArs)}</p>
              {totals.monthlyUsd > 0 && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  + {formatArs(totals.monthlyArs)}/mes
                </p>
              )}
            </div>
          </div>

          {!clientView && (
            <Button
              onClick={handleSave}
              disabled={pending || selectedCount === 0 || maintenanceMissing}
              className="w-full"
              size="lg"
            >
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Guardar presupuesto
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Warning({
  tone,
  children,
}: {
  tone: "warning" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        "mt-3 flex items-start gap-3 rounded-xl border p-3 text-sm",
        tone === "destructive"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-warning/30 bg-warning/10 text-warning"
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </motion.div>
  );
}
