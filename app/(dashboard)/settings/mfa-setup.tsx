"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  enrollMfaAction,
  verifyMfaEnrollAction,
  unenrollMfaAction,
} from "@/lib/actions/mfa";

interface Factor {
  id: string;
  status: string;
  friendly_name?: string;
}

export function MfaSetup({ initialFactors }: { initialFactors: Factor[] }) {
  const verified = initialFactors.find((f) => f.status === "verified");
  const [factors, setFactors] = useState(initialFactors);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"enroll" | "verify">("enroll");
  const [enrolled, setEnrolled] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeFactor = factors.find((f) => f.status === "verified");

  function openEnrollDialog() {
    setError(null);
    setCode("");
    setStep("enroll");
    setOpen(true);
    startTransition(async () => {
      const result = await enrollMfaAction();
      if (result.error || !result.factorId || !result.qrCode || !result.secret) {
        setError(result.error ?? "No se pudo iniciar la configuración.");
        return;
      }
      setEnrolled({ factorId: result.factorId, qrCode: result.qrCode, secret: result.secret });
      setStep("verify");
    });
  }

  function handleVerify() {
    if (!enrolled) return;
    setError(null);
    startTransition(async () => {
      const result = await verifyMfaEnrollAction(enrolled.factorId, code);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFactors((prev) => [...prev, { id: enrolled.factorId, status: "verified" }]);
      setOpen(false);
      toast.success("Autenticación de dos factores activada.");
    });
  }

  function handleDisable() {
    if (!activeFactor) return;
    startTransition(async () => {
      const result = await unenrollMfaAction(activeFactor.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setFactors((prev) => prev.filter((f) => f.id !== activeFactor.id));
      toast.success("Autenticación de dos factores desactivada.");
    });
  }

  if (verified || activeFactor) {
    return (
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-success" />
        <span className="text-sm text-success">Activada</span>
        <Button variant="ghost" size="sm" onClick={handleDisable} disabled={pending} className="ml-2">
          {pending && <Loader2 className="animate-spin" />}
          Desactivar
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button size="sm" onClick={openEnrollDialog}>
        <ShieldPlus /> Activar 2FA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Autenticación de dos factores</DialogTitle>
            <DialogDescription>
              Escaneá el código con Google Authenticator, Authy o similar, y
              confirmá con el código de 6 dígitos.
            </DialogDescription>
          </DialogHeader>

          {step === "enroll" || !enrolled ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div
                className="mx-auto size-48 [&_svg]:size-full"
                dangerouslySetInnerHTML={{ __html: enrolled.qrCode }}
              />
              <div className="grid gap-1.5">
                <p className="text-center text-xs text-muted-foreground">
                  O ingresá esta clave manualmente:
                </p>
                <Input readOnly value={enrolled.secret} className="text-center font-mono text-xs" />
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleVerify} disabled={pending || code.length !== 6 || !enrolled}>
              {pending && <Loader2 className="animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
