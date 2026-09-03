import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { ProjectForm } from "./project-form";
import type { Client } from "@/types/database.types";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  await verifySession();
  const { client_id } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").order("name");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Proyectos
      </Link>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Nuevo proyecto</h2>
        <p className="text-sm text-muted-foreground">
          Completá los datos básicos, podés editarlos después.
        </p>
      </div>
      <ProjectForm clients={(data ?? []) as Client[]} defaultClientId={client_id} />
    </div>
  );
}
