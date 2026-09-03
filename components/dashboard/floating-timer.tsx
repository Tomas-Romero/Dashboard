"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Square, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startTimeEntryAction, stopTimeEntryAction } from "@/lib/actions/time-entries";
import type { Project } from "@/types/database.types";

interface RunningEntry {
  id: string;
  projectId: string;
  projectName: string;
  startedAt: string;
  description: string | null;
}

function useElapsed(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function FloatingTimer({
  initialEntry,
  projects,
}: {
  initialEntry: RunningEntry | null;
  projects: Project[];
}) {
  const [entry, setEntry] = useState(initialEntry);
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const elapsed = useElapsed(entry?.startedAt ?? null);

  function handleStart() {
    if (!projectId) return;
    const project = projects.find((p) => p.id === projectId);
    startTransition(async () => {
      const { id, startedAt } = await startTimeEntryAction(projectId, description);
      setEntry({
        id,
        projectId,
        projectName: project?.name ?? "—",
        startedAt,
        description: description || null,
      });
      setOpen(false);
      setDescription("");
    });
  }

  function handleStop() {
    if (!entry) return;
    startTransition(async () => {
      await stopTimeEntryAction(entry.id, entry.startedAt);
      setEntry(null);
    });
  }

  if (projects.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-30">
      <AnimatePresence mode="wait">
        {entry ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass card-glow flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-lg"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-destructive" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{entry.projectName}</p>
              <p className="font-mono text-sm tabular-nums">{formatDuration(elapsed)}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleStop}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-3.5 fill-current" />}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg">
                  <Timer /> Iniciar timer
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Proyecto
                    </label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Elegí un proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Descripción (opcional)
                    </label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="¿En qué estás trabajando?"
                    />
                  </div>
                  <Button onClick={handleStart} disabled={pending || !projectId}>
                    {pending ? <Loader2 className="animate-spin" /> : <Play />}
                    Iniciar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
