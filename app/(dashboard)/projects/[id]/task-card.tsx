"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { TASK_PRIORITY } from "@/lib/status-config";
import { deleteTaskAction } from "@/lib/actions/tasks";
import type { Task, TaskPriority } from "@/types/database.types";

export function TaskCard({ task, projectId }: { task: Task; projectId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "z-50 opacity-50" : undefined}
    >
      <Card className="group gap-2 py-3 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-2 px-3">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium">{task.title}</p>
            <div className="flex shrink-0 items-center">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab touch-none rounded p-1 text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100 active:cursor-grabbing"
                aria-label="Mover tarea"
              >
                <GripVertical className="size-3.5" />
              </button>
              <div className="opacity-0 group-hover:opacity-100">
                <ConfirmDeleteButton
                  title="¿Eliminar tarea?"
                  onDelete={() => deleteTaskAction(task.id, projectId)}
                />
              </div>
            </div>
          </div>
          {task.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <StatusBadge
              label={TASK_PRIORITY[task.priority as TaskPriority]?.label}
              tone={TASK_PRIORITY[task.priority as TaskPriority]?.tone}
            />
            {task.due_date && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="size-3" />
                {format(new Date(task.due_date), "d MMM", { locale: es })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
