"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptQuoteAction } from "@/lib/actions/quotes";

export function AcceptQuoteButton({ quoteId }: { quoteId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptQuoteAction(quoteId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Proyecto creado con las tareas, infraestructura y la factura de la seña.");
      router.push(`/projects/${result.projectId}`);
    });
  }

  return (
    <Button onClick={handleAccept} disabled={pending} size="sm">
      {pending ? <Loader2 className="animate-spin" /> : <Rocket />}
      Aceptar y crear proyecto
    </Button>
  );
}
