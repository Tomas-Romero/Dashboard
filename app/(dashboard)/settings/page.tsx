import type { Metadata } from "next";
import { ShieldCheck, ShieldOff, UserRound, KeyRound } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getVaultVerifierInfo } from "@/lib/actions/vault";
import { listMfaFactorsAction } from "@/lib/actions/mfa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResetVaultButton } from "./reset-vault-button";
import { MfaSetup } from "./mfa-setup";

export const metadata: Metadata = { title: "Configuración · Mission Control" };

export default async function SettingsPage() {
  const session = await verifySession();
  const [vaultInfo, factors] = await Promise.all([
    getVaultVerifierInfo(),
    listMfaFactorsAction(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Cuenta y seguridad de tu panel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" /> Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{session.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" /> Autenticación de dos factores
          </CardTitle>
          <CardDescription>
            Requiere un código adicional (TOTP) al iniciar sesión, además de tu
            contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetup initialFactors={factors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {vaultInfo.configured ? (
              <ShieldCheck className="size-4 text-success" />
            ) : (
              <ShieldOff className="size-4 text-muted-foreground" />
            )}
            Bóveda de credenciales
          </CardTitle>
          <CardDescription>
            {vaultInfo.configured
              ? "Tu Master Passphrase está configurada. Se te pide al abrir la bóveda en cada sesión."
              : "Todavía no configuraste tu Master Passphrase. Andá a Bóveda para crearla."}
          </CardDescription>
        </CardHeader>
        {vaultInfo.configured && (
          <>
            <Separator />
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-medium">Zona de peligro</p>
                <p className="text-xs text-muted-foreground">
                  Borra todas las credenciales guardadas y la passphrase.
                </p>
              </div>
              <ResetVaultButton />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
