"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encryptSecret, decryptSecret } from "@/lib/crypto/vault-encryption";
import { useVaultSession } from "@/lib/vault/vault-session";
import {
  createVaultEntryAction,
  updateVaultEntryAction,
} from "@/lib/actions/vault";
import type { CredentialVaultEntry, Project } from "@/types/database.types";

export function VaultEntryFormDialog({
  projects,
  entry,
  defaultProjectId,
}: {
  projects: Project[];
  entry?: CredentialVaultEntry;
  defaultProjectId?: string;
}) {
  const { masterKey, encryptionSalt } = useVaultSession();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && entry && masterKey && !password) {
      setLoadingExisting(true);
      try {
        const plain = await decryptSecret(
          { ciphertext: entry.encrypted_password, iv: entry.encryption_iv },
          masterKey
        );
        setPassword(plain);
      } catch {
        setError("No se pudo descifrar con la passphrase actual.");
      } finally {
        setLoadingExisting(false);
      }
    }
  }

  function handleSubmit(formData: FormData) {
    if (!masterKey || !encryptionSalt) return;
    setError(null);

    startTransition(async () => {
      const { ciphertext, iv } = await encryptSecret(password, masterKey);
      formData.set("encrypted_password", ciphertext);
      formData.set("encryption_iv", iv);
      formData.set("encryption_salt", encryptionSalt);

      const result = entry
        ? await updateVaultEntryAction(entry.id, {}, formData)
        : await createVaultEntryAction({}, formData);

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setPassword("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {entry ? (
          <Button variant="ghost" size="icon" className="size-8">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus /> Nueva credencial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Editar credencial" : "Nueva credencial"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="project_id">Proyecto *</Label>
            <Select name="project_id" defaultValue={entry?.project_id ?? defaultProjectId} required>
              <SelectTrigger id="project_id" className="w-full">
                <SelectValue placeholder="Elegí un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="service_name">Servicio *</Label>
              <Input
                id="service_name"
                name="service_name"
                defaultValue={entry?.service_name}
                placeholder="cPanel, base de datos..."
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" name="username" defaultValue={entry?.username ?? ""} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="text"
              value={loadingExisting ? "Descifrando..." : password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loadingExisting}
              autoComplete="off"
              required
              className="font-mono"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" defaultValue={entry?.url ?? ""} placeholder="https://..." />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={entry?.notes ?? ""} />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || loadingExisting}>
              {pending && <Loader2 className="animate-spin" />}
              {entry ? "Guardar cambios" : "Guardar credencial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
