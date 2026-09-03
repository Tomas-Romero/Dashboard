import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PROJECT_STATUS } from "@/lib/status-config";
import type { RecentProject } from "@/lib/queries/dashboard";
import type { ProjectStatus } from "@/types/database.types";

export function RecentProjects({ projects }: { projects: RecentProject[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="size-4 text-primary" />
          Proyectos recientes
        </CardTitle>
        <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {projects.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todavía no creaste ningún proyecto.
          </p>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{project.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {project.clientName ?? "Sin cliente"}
                </p>
              </div>
              <StatusBadge
                label={PROJECT_STATUS[project.status as ProjectStatus]?.label ?? project.status}
                tone={PROJECT_STATUS[project.status as ProjectStatus]?.tone ?? "outline"}
              />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
