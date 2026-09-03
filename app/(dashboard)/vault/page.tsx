import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { getVaultVerifierInfo } from "@/lib/actions/vault";
import { VaultSessionProvider } from "@/lib/vault/vault-session";
import { VaultShell } from "./vault-shell";
import type { CredentialVaultEntry, Project } from "@/types/database.types";

export const metadata: Metadata = { title: "Bóveda · Mission Control" };

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await verifySession();
  const { project } = await searchParams;
  const supabase = await createClient();

  const [info, { data: rawEntries }, { data: projects }] = await Promise.all([
    getVaultVerifierInfo(),
    supabase
      .from("credentials_vault")
      .select("*, projects(name)")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("name"),
  ]);

  const entries = ((rawEntries ?? []) as unknown as (CredentialVaultEntry & {
    projects: { name: string } | null;
  })[])
    .filter((e) => !project || e.project_id === project)
    .map((e) => ({ ...e, projectName: e.projects?.name ?? "—" }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Bóveda de credenciales
        </h2>
        <p className="text-sm text-muted-foreground">
          Cifrado AES-256-GCM en tu navegador. El servidor nunca ve tus
          contraseñas en texto plano.
        </p>
      </div>

      <VaultSessionProvider info={info}>
        <VaultShell
          entries={entries}
          projects={(projects ?? []) as Project[]}
          defaultProjectId={project}
        />
      </VaultSessionProvider>
    </div>
  );
}
