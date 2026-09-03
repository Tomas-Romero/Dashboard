"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <h2 className="font-semibold">Algo salió mal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "Ocurrió un error inesperado al cargar esta sección."}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw /> Reintentar
      </Button>
    </motion.div>
  );
}
