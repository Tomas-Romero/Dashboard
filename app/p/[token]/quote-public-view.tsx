"use client";

import { motion } from "framer-motion";
import { FileDown, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PublicQuoteData } from "@/lib/queries/public-quote";

const money = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;
const usd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

export function QuotePublicView({
  data,
  clientName,
  expired,
  token,
}: {
  data: PublicQuoteData["quote"];
  clientName: string;
  expired: boolean;
  token: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-xl"
    >
      <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <LayoutDashboard className="size-4" />
        Mission Control
      </div>

      <Card className="glass card-glow border-white/10">
        <CardHeader className="items-center gap-1 pb-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight">{data.title}</h1>
          <p className="text-sm text-muted-foreground">
            Presupuesto {data.quote_number} para {clientName}
          </p>
          {expired && (
            <p className="mt-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
              Este precio venció — pedile a quien te lo mandó que lo actualice
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="rounded-xl bg-muted/40 p-5 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {money(Number(data.total_ars ?? 0))}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {usd(Number(data.total_usd))}
            </p>
            {Number(data.monthly_usd) > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                + abono mensual
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                Seña ({Number(data.deposit_pct)}%)
              </p>
              <p className="font-semibold tabular-nums">
                {money(Number(data.total_ars ?? 0) * (Number(data.deposit_pct) / 100))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="font-semibold tabular-nums">
                {money(
                  Number(data.total_ars ?? 0) *
                    (1 - Number(data.deposit_pct) / 100)
                )}
              </p>
            </div>
          </div>

          <Separator />

          <Button asChild size="lg" className="w-full">
            <a href={`/api/quotes/${token}/pdf`} target="_blank" rel="noreferrer">
              <FileDown /> Descargar PDF con el detalle
            </a>
          </Button>

          {data.valid_until && !expired && (
            <p className="text-center text-xs text-muted-foreground">
              Precio válido hasta el{" "}
              {new Date(data.valid_until).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
              })}
              .
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
