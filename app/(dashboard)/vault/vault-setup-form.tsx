"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVaultSession } from "@/lib/vault/vault-session";
import { setupVaultAction } from "@/lib/actions/vault";

export function VaultSetupForm() {
  const { setup } = useVaultSession();
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (passphrase.length < 10) {
      setError("Usá al menos 10 caracteres.");
      return;
    }
    if (passphrase !== confirm) {
      setError("Las passphrases no coinciden.");
      return;
    }

    startTransition(async () => {
      const { verifier_hash, verifier_salt, encryption_salt } = await setup(passphrase);
      const formData = new FormData();
      formData.set("verifier_hash", verifier_hash);
      formData.set("verifier_salt", verifier_salt);
      formData.set("encryption_salt", encryption_salt);
      const result = await setupVaultAction({}, formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md"
    >
      <Card className="card-glow">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle>Configurá tu Master Passphrase</CardTitle>
          <CardDescription>
            Se usa para cifrar y descifrar tus credenciales en el navegador. No
            se guarda en ningún lado — si la olvidás, no hay forma de
            recuperarla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="passphrase">Master Passphrase</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm">Confirmar</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Crear bóveda
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
