"use client";

import { useTransition } from "react";
import { UserCheck, Loader2 } from "lucide-react";
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
  updateLeadStatusAction,
  convertLeadToClientAction,
  deleteLeadAction,
} from "@/lib/actions/leads";
import { LEAD_STATUS } from "@/lib/status-config";
import type { Lead, LeadStatus } from "@/types/database.types";

export function LeadRowActions({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Select
        defaultValue={lead.status}
        onValueChange={(status) =>
          startTransition(() => updateLeadStatusAction(lead.id, status as LeadStatus))
        }
      >
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LEAD_STATUS).map(([value, { label }]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {lead.status !== "won" && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={pending}
          onClick={() =>
            startTransition(() => convertLeadToClientAction(lead.id, lead.name))
          }
          title="Convertir a cliente"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
        </Button>
      )}
      <ConfirmDeleteButton
        title={`¿Eliminar a ${lead.name}?`}
        onDelete={() => deleteLeadAction(lead.id)}
      />
    </div>
  );
}
