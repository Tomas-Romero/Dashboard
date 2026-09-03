"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { TaskCard } from "./task-card";
import { TaskFormDialog } from "./task-form-dialog";
import { reorderTasksAction } from "@/lib/actions/tasks";
import { TASK_STATUS } from "@/lib/status-config";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/database.types";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "review", "done"];

function Column({
  status,
  tasks,
  projectId,
}: {
  status: TaskStatus;
  tasks: Task[];
  projectId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col gap-2 rounded-xl border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold">{TASK_STATUS[status].label}</h4>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <motion.div key={task.id} layout="position">
              <TaskCard task={task} projectId={projectId} />
            </motion.div>
          ))}
        </div>
      </SortableContext>
      {status === "todo" && <TaskFormDialog projectId={projectId} />}
    </div>
  );
}

export function KanbanBoard({
  projectId,
  tasks: initialTasks,
}: {
  projectId: string;
  tasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columns = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>(COLUMNS.map((s) => [s, []]));
    for (const task of tasks) map.get(task.status)?.push(task);
    return map;
  }, [tasks]);

  function findStatus(id: string): TaskStatus | undefined {
    if ((COLUMNS as string[]).includes(id)) return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeStatus = findStatus(active.id as string);
    const overStatus = findStatus(over.id as string);
    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: overStatus } : t))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const finalStatus = findStatus(overId);
    if (!finalStatus) return;

    setTasks((prev) => {
      const withStatus = prev.map((t) =>
        t.id === activeId ? { ...t, status: finalStatus } : t
      );
      const columnIds = withStatus.filter((t) => t.status === finalStatus).map((t) => t.id);
      const oldIndex = columnIds.indexOf(activeId);
      const overIndex = columnIds.indexOf(overId);
      const newColumnOrder =
        overIndex >= 0 ? arrayMove(columnIds, oldIndex, overIndex) : columnIds;

      const reordered = withStatus.filter((t) => t.status !== finalStatus);
      newColumnOrder.forEach((id, index) => {
        const task = withStatus.find((t) => t.id === id)!;
        reordered.push({ ...task, position: index });
      });

      const updates = newColumnOrder.map((id, index) => ({
        id,
        status: finalStatus,
        position: index,
      }));
      startTransition(() => {
        reorderTasksAction(projectId, updates);
      });

      return reordered;
    });
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            projectId={projectId}
            tasks={columns.get(status) ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95">
            <TaskCard task={activeTask} projectId={projectId} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
