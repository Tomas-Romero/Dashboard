"use client";

import { Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useVaultSession } from "@/lib/vault/vault-session";
import { VaultSetupForm } from "./vault-setup-form";
import { VaultUnlockForm } from "./vault-unlock-form";
import { VaultEntryFormDialog } from "./vault-entry-form-dialog";
import { VaultEntryRow } from "./vault-entry-row";
import type { CredentialVaultEntry, Project } from "@/types/database.types";

interface EntryWithProject extends CredentialVaultEntry {
  projectName: string;
}

export function VaultShell({
  entries,
  projects,
  defaultProjectId,
}: {
  entries: EntryWithProject[];
  projects: Project[];
  defaultProjectId?: string;
}) {
  const { configured, unlocked, lock } = useVaultSession();

  if (!configured) return <VaultSetupForm />;
  if (!unlocked) return <VaultUnlockForm />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} credencial{entries.length === 1 ? "" : "es"} guardada
          {entries.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={lock}>
            <Lock /> Bloquear
          </Button>
          <VaultEntryFormDialog projects={projects} defaultProjectId={defaultProjectId} />
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Sin credenciales guardadas"
          description="Agregá tu primera credencial. Se cifra en tu navegador antes de guardarse."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <VaultEntryRow
              key={entry.id}
              entry={entry}
              projectName={entry.projectName}
              projects={projects}
            />
          ))}
        </div>
      )}
    </div>
  );
}
