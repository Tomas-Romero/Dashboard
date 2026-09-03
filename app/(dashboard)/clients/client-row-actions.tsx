"use client";

import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { deleteClientAction } from "@/lib/actions/clients";

export function ClientRowActions({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmDeleteButton
      title={`¿Eliminar a ${name}?`}
      description="Se eliminará el cliente. Los proyectos asociados quedarán sin cliente."
      onDelete={() => deleteClientAction(id)}
    />
  );
}
