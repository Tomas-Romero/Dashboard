"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVaultSession } from "@/lib/vault/vault-session";

export function VaultUnlockForm() {
  const { unlock } = useVaultSession();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const ok = await unlock(passphrase);
      if (!ok) setError("Passphrase incorrecta.");
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-sm"
    >
      <Card className="card-glow">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Lock className="size-6" />
          </div>
          <CardTitle>Bóveda bloqueada</CardTitle>
          <CardDescription>
            Ingresá tu Master Passphrase para ver y agregar credenciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="unlock-passphrase">Master Passphrase</Label>
              <Input
                id="unlock-passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoFocus
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
              Desbloquear
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
