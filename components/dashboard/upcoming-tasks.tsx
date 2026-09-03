import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TASK_PRIORITY } from "@/lib/status-config";
import type { UpcomingTask } from "@/lib/queries/dashboard";
import type { TaskPriority } from "@/types/database.types";

export function UpcomingTasks({ tasks }: { tasks: UpcomingTask[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-4 text-primary" />
          Próximas tareas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin tareas con vencimiento próximo.
          </p>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${task.projectId}?tab=tasks`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {task.projectName}
                  {task.due_date &&
                    ` · ${format(new Date(task.due_date), "d MMM", { locale: es })}`}
                </p>
              </div>
              <StatusBadge
                label={TASK_PRIORITY[task.priority as TaskPriority]?.label ?? task.priority}
                tone={TASK_PRIORITY[task.priority as TaskPriority]?.tone ?? "outline"}
              />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
