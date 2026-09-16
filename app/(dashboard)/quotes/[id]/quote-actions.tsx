"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import {
  updateQuoteStatusAction,
  deleteQuoteAction,
  refreshQuoteRateAction,
} from "@/lib/actions/quotes";
import { QUOTE_STATUS } from "@/lib/status-config";
import type { Quote, QuoteStatus } from "@/types/database.types";

export function QuoteActions({ quote, expired }: { quote: Quote; expired: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {expired && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await refreshQuoteRateAction(quote.id);
              if (result?.error) toast.error(result.error);
              else toast.success("Recalculado al dólar de hoy y renovado por 15 días.");
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Recalcular
        </Button>
      )}

      <Select
        defaultValue={quote.status}
        onValueChange={(status) =>
          startTransition(() =>
            updateQuoteStatusAction(quote.id, status as QuoteStatus)
          )
        }
      >
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(QUOTE_STATUS).map(([value, { label }]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmDeleteButton
        title={`¿Eliminar el presupuesto ${quote.quote_number}?`}
        onDelete={() => deleteQuoteAction(quote.id)}
      />
    </div>
  );
}
