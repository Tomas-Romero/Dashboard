"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { verifyLoginMfaAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const initialState: AuthFormState = {};

export function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyLoginMfaAction, initialState);
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
            <ShieldCheck className="size-6" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Verificación en dos pasos</h1>
            <p className="text-sm text-muted-foreground">
              Ingresá el código de tu app autenticadora
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid justify-items-center gap-4">
            <input type="hidden" name="next" value={next} />
            <InputOTP maxLength={6} name="code" autoFocus>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            {state?.error && (
              <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <Loader2 className="animate-spin" /> : "Verificar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
