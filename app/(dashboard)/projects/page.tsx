import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus, GitBranch, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PROJECT_STATUS } from "@/lib/status-config";
import type { Project, ProjectStatus } from "@/types/database.types";

interface ProjectRow extends Project {
  clients: { name: string } | null;
}

export const metadata: Metadata = { title: "Proyectos · Mission Control" };

export default async function ProjectsPage() {
  await verifySession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("updated_at", { ascending: false });

  const projects = (data ?? []) as unknown as ProjectRow[];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Proyectos</h2>
          <p className="text-sm text-muted-foreground">
            Todo tu trabajo freelance, organizado por proyecto.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus /> Nuevo proyecto
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Sin proyectos todavía"
          description="Creá tu primer proyecto para empezar a organizar tareas, infraestructura y credenciales."
          action={
            <Button asChild size="sm">
              <Link href="/projects/new">
                <Plus /> Nuevo proyecto
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="flex h-full flex-col gap-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{project.name}</h3>
                    <StatusBadge
                      label={PROJECT_STATUS[project.status as ProjectStatus]?.label}
                      tone={PROJECT_STATUS[project.status as ProjectStatus]?.tone}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {project.clients?.name ?? "Sin cliente"}
                  </p>
                  {project.description && (
                    <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {project.repo_url && <GitBranch className="size-4" />}
                    {project.live_url && <Globe className="size-4" />}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
