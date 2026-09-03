import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  DollarSign,
  GitBranch,
  Globe,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { GithubCard } from "@/components/dashboard/github-card";
import { PROJECT_STATUS } from "@/lib/status-config";
import { ProjectEditDialog } from "./project-edit-dialog";
import { KanbanBoard } from "./kanban-board";
import { ImprovementsTab } from "./improvements-tab";
import { InfrastructureTab } from "./infrastructure-tab";
import type {
  Client,
  Infrastructure,
  ImprovementLog,
  Project,
  ProjectStatus,
  Task,
} from "@/types/database.types";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const { tab } = await searchParams;
  const supabase = await createClient();

  const [
    { data: project },
    { data: tasks },
    { data: improvements },
    { data: infrastructure },
    { data: clients },
  ] = await Promise.all([
    supabase.from("projects").select("*, clients(name)").eq("id", id).single(),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("position")
      .order("created_at"),
    supabase
      .from("improvements_log")
      .select("*")
      .eq("project_id", id)
      .order("entry_date", { ascending: false }),
    supabase.from("infrastructure").select("*").eq("project_id", id),
    supabase.from("clients").select("*").order("name"),
  ]);

  if (!project) notFound();

  const typedProject = project as unknown as Project & { clients: { name: string } | null };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Proyectos
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 py-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{typedProject.name}</h2>
                <StatusBadge
                  label={PROJECT_STATUS[typedProject.status as ProjectStatus]?.label}
                  tone={PROJECT_STATUS[typedProject.status as ProjectStatus]?.tone}
                />
              </div>
              {typedProject.description && (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {typedProject.description}
                </p>
              )}
            </div>
            <ProjectEditDialog project={typedProject} clients={(clients ?? []) as Client[]} />
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {typedProject.clients?.name && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" /> {typedProject.clients.name}
              </span>
            )}
            {typedProject.hourly_rate != null && (
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="size-4" /> ${typedProject.hourly_rate}/h
              </span>
            )}
            {typedProject.start_date && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarRange className="size-4" />
                {typedProject.start_date}
                {typedProject.end_date ? ` → ${typedProject.end_date}` : ""}
              </span>
            )}
            {typedProject.repo_url && (
              <a
                href={typedProject.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <GitBranch className="size-4" /> Repositorio
              </a>
            )}
            {typedProject.live_url && (
              <a
                href={typedProject.live_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Globe className="size-4" /> Sitio en vivo
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {typedProject.repo_url && <GithubCard repoUrl={typedProject.repo_url} />}

      <Tabs defaultValue={tab ?? "tasks"}>
        <TabsList>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="improvements">Mejoras</TabsTrigger>
          <TabsTrigger value="infrastructure">Infraestructura</TabsTrigger>
          <TabsTrigger value="vault">Credenciales</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <KanbanBoard projectId={id} tasks={(tasks ?? []) as Task[]} />
        </TabsContent>

        <TabsContent value="improvements" className="mt-4">
          <ImprovementsTab
            projectId={id}
            improvements={(improvements ?? []) as ImprovementLog[]}
          />
        </TabsContent>

        <TabsContent value="infrastructure" className="mt-4">
          <InfrastructureTab
            projectId={id}
            items={(infrastructure ?? []) as Infrastructure[]}
          />
        </TabsContent>

        <TabsContent value="vault" className="mt-4">
          <Link href={`/vault?project=${id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-3 py-6">
                <KeyRound className="size-5 text-primary" />
                <div>
                  <p className="font-medium">Ir a la bóveda de credenciales</p>
                  <p className="text-sm text-muted-foreground">
                    Ver y agregar credenciales cifradas para {typedProject.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}
