"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { decryptSecret } from "@/lib/crypto/vault-encryption";
import { useVaultSession } from "@/lib/vault/vault-session";
import { deleteVaultEntryAction } from "@/lib/actions/vault";
import { VaultEntryFormDialog } from "./vault-entry-form-dialog";
import type { CredentialVaultEntry, Project } from "@/types/database.types";

export function VaultEntryRow({
  entry,
  projectName,
  projects,
}: {
  entry: CredentialVaultEntry;
  projectName: string;
  projects: Project[];
}) {
  const { masterKey } = useVaultSession();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    if (!masterKey) return;
    if (revealed) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    try {
      const plain = await decryptSecret(
        { ciphertext: entry.encrypted_password, iv: entry.encryption_iv },
        masterKey
      );
      setRevealed(plain);
    } catch {
      toast.error("No se pudo descifrar esta credencial.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!masterKey) return;
    try {
      const plain =
        revealed ??
        (await decryptSecret(
          { ciphertext: entry.encrypted_password, iv: entry.encryption_iv },
          masterKey
        ));
      await navigator.clipboard.writeText(plain);
      toast.success("Contraseña copiada al portapapeles.");
    } catch {
      toast.error("No se pudo copiar la contraseña.");
    }
  }

  return (
    <Card className="group">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{entry.service_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {projectName}
              {entry.username && ` · ${entry.username}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <code className="min-w-[9ch] rounded-md bg-muted px-2 py-1 text-xs">
            {loading ? "..." : revealed ?? "••••••••"}
          </code>
          <Button variant="ghost" size="icon" className="size-8" onClick={reveal} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : revealed ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={copy}>
            <Copy className="size-4" />
          </Button>
          <VaultEntryFormDialog entry={entry} projects={projects} />
          <ConfirmDeleteButton
            title={`¿Eliminar la credencial de ${entry.service_name}?`}
            onDelete={() => deleteVaultEntryAction(entry.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
