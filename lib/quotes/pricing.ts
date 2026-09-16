import type { CatalogKind, QuoteSegment } from "@/types/database.types";

/**
 * Motor de cálculo de presupuestos.
 *
 * Funciones puras, sin base de datos ni React: se pueden probar sueltas y
 * dan el mismo resultado en el servidor y en el cliente (la calculadora
 * necesita recalcular en vivo mientras el usuario marca opciones).
 *
 * Regla de negocio central: el precio sale del ALCANCE, no de las horas.
 * Las horas se acumulan solo como control interno de rentabilidad.
 */

export const SEGMENT_MULTIPLIERS: Record<QuoteSegment, number> = {
  local: 1,
  latam: 1.5,
  export: 2.75,
};

export const SEGMENT_LABELS: Record<QuoteSegment, string> = {
  local: "Argentina",
  latam: "LATAM",
  export: "Exterior",
};

export interface PricingLine {
  catalogItemId: string | null;
  kind: CatalogKind;
  name: string;
  description?: string | null;
  quantity: number;
  unitPriceUsd: number;
  estimatedHours: number;
  isRecurring: boolean;
  isClientCost: boolean;
  marketReferenceUsd?: number | null;
}

export interface PricingInput {
  lines: PricingLine[];
  segment: QuoteSegment;
  discountPct: number;
  surchargePct: number;
  depositPct: number;
  exchangeRate: number;
  segmentMultipliers?: Record<QuoteSegment, number>;
}

export interface PricingResult {
  /** Suma de ítems únicos, ya con el multiplicador de segmento aplicado. */
  subtotalUsd: number;
  /** Subtotal con descuento y recargo aplicados. */
  totalUsd: number;
  totalArs: number;
  /** Abono mensual recurrente (mantenimiento, suscripciones, infra). */
  monthlyUsd: number;
  monthlyArs: number;
  depositUsd: number;
  depositArs: number;
  balanceUsd: number;
  balanceArs: number;
  /** Costos que paga el cliente aparte — no suman al total. */
  clientCostsUsd: number;
  /** Control interno. */
  estimatedHours: number;
  effectiveHourlyUsd: number;
  /** Guardarraíl: cuánto valdría a precio de mercado. */
  marketTotalUsd: number;
  underpricingPct: number;
  discountAmountUsd: number;
  surchargeAmountUsd: number;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function computeQuote(input: PricingInput): PricingResult {
  const {
    lines,
    segment,
    discountPct,
    surchargePct,
    depositPct,
    exchangeRate,
    segmentMultipliers = SEGMENT_MULTIPLIERS,
  } = input;

  const multiplier = segmentMultipliers[segment] ?? 1;

  let subtotalUsd = 0;
  let monthlyUsd = 0;
  let clientCostsUsd = 0;
  let estimatedHours = 0;
  let marketTotalUsd = 0;

  for (const line of lines) {
    const lineTotal = line.unitPriceUsd * line.quantity;

    // Los costos del cliente se informan pero nunca suman al precio.
    if (line.isClientCost) {
      clientCostsUsd += lineTotal;
      continue;
    }

    if (line.isRecurring) {
      monthlyUsd += lineTotal * multiplier;
    } else {
      subtotalUsd += lineTotal * multiplier;
      estimatedHours += line.estimatedHours * line.quantity;
      marketTotalUsd += (line.marketReferenceUsd ?? line.unitPriceUsd) * line.quantity;
    }
  }

  const discountAmountUsd = subtotalUsd * (discountPct / 100);
  const surchargeAmountUsd = subtotalUsd * (surchargePct / 100);
  const totalUsd = Math.max(0, subtotalUsd - discountAmountUsd + surchargeAmountUsd);

  const depositUsd = totalUsd * (depositPct / 100);
  const balanceUsd = totalUsd - depositUsd;

  // El mercado también se compara contra el segmento: cotizarle a un cliente
  // del exterior se mide contra precios del exterior.
  const marketAdjusted = marketTotalUsd * multiplier;
  const underpricingPct =
    marketAdjusted > 0 ? Math.max(0, (1 - totalUsd / marketAdjusted) * 100) : 0;

  return {
    subtotalUsd: round2(subtotalUsd),
    totalUsd: round2(totalUsd),
    totalArs: round2(totalUsd * exchangeRate),
    monthlyUsd: round2(monthlyUsd),
    monthlyArs: round2(monthlyUsd * exchangeRate),
    depositUsd: round2(depositUsd),
    depositArs: round2(depositUsd * exchangeRate),
    balanceUsd: round2(balanceUsd),
    balanceArs: round2(balanceUsd * exchangeRate),
    clientCostsUsd: round2(clientCostsUsd),
    estimatedHours: round2(estimatedHours),
    effectiveHourlyUsd: estimatedHours > 0 ? round2(totalUsd / estimatedHours) : 0,
    marketTotalUsd: round2(marketAdjusted),
    underpricingPct: round2(underpricingPct),
    discountAmountUsd: round2(discountAmountUsd),
    surchargeAmountUsd: round2(surchargeAmountUsd),
  };
}

/** Precio sugerido por defecto: el punto medio del rango, no el mínimo. */
export function defaultPrice(min: number, max: number) {
  return round2((Number(min) + Number(max)) / 2);
}

export function formatUsd(n: number) {
  return `USD ${Math.round(n).toLocaleString("es-AR")}`;
}

export function formatArs(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

/**
 * Valida reglas de negocio que no se pueden romper.
 * Devuelve la lista de problemas encontrados (vacía = todo bien).
 */
export function validateQuote(lines: PricingLine[], catalogRequiresMaintenance: boolean) {
  const errors: string[] = [];

  const hasBase = lines.some((l) => l.kind === "base" && !l.isClientCost);
  if (!hasBase) {
    errors.push("Elegí al menos un tipo de sistema para la base del presupuesto.");
  }

  if (catalogRequiresMaintenance) {
    const hasMaintenance = lines.some((l) => l.isRecurring && !l.isClientCost);
    if (!hasMaintenance) {
      errors.push(
        "Los SaaS para terceros requieren mantenimiento mensual obligatorio. Agregalo antes de guardar."
      );
    }
  }

  return errors;
}
