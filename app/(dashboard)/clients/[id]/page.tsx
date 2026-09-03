import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, FolderKanban, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PROJECT_STATUS } from "@/lib/status-config";
import type { Client, Project, ProjectStatus } from "@/types/database.types";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const typedClient = client as Client;
  const typedProjects = (projects ?? []) as Project[];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/clients"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{typedClient.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {typedClient.company && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4" /> {typedClient.company}
            </span>
          )}
          {typedClient.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-4" /> {typedClient.email}
            </span>
          )}
          {typedClient.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-4" /> {typedClient.phone}
            </span>
          )}
          {typedClient.notes && (
            <p className="w-full text-foreground">{typedClient.notes}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Proyectos</h3>
        <Button asChild size="sm">
          <Link href={`/projects/new?client_id=${typedClient.id}`}>
            <Plus /> Nuevo proyecto
          </Link>
        </Button>
      </div>

      {typedProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Sin proyectos todavía"
          description="Creá un proyecto para este cliente para empezar a trackear tareas, infraestructura y facturación."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {typedProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="flex items-start justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    label={PROJECT_STATUS[project.status as ProjectStatus]?.label}
                    tone={PROJECT_STATUS[project.status as ProjectStatus]?.tone}
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
