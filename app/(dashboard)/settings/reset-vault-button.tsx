"use client";

import { useTransition } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { resetVaultAction } from "@/lib/actions/settings";

export function ResetVaultButton() {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <TriangleAlert /> Reiniciar bóveda
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar la bóveda de credenciales?</AlertDialogTitle>
          <AlertDialogDescription>
            Esto borra permanentemente todas las credenciales guardadas y la
            Master Passphrase configurada. No se puede deshacer. Usalo solo si
            olvidaste la passphrase.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await resetVaultAction();
              });
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending && <Loader2 className="animate-spin" />}
            Sí, reiniciar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
