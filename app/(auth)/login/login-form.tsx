"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { login, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="glass card-glow border-white/10">
        <CardHeader className="items-center gap-3 pb-2 text-center">
          <motion.div
            initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
            className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <LayoutDashboard className="size-6" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Mission Control
            </h1>
            <p className="text-sm text-muted-foreground">
              Iniciá sesión para continuar
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {state?.error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {state.error}
              </motion.p>
            )}

            <Button type="submit" disabled={pending} className="mt-1 w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Panel de uso personal — un único usuario administrador.
      </p>
    </motion.div>
  );
}
