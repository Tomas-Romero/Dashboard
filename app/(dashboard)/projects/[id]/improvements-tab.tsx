"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/dashboard/confirm-delete-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  createImprovementAction,
  deleteImprovementAction,
} from "@/lib/actions/improvements";
import type { ActionState } from "@/lib/actions/clients";
import type { ImprovementLog } from "@/types/database.types";

const initialState: ActionState = {};

export function ImprovementsTab({
  projectId,
  improvements,
}: {
  projectId: string;
  improvements: ImprovementLog[];
}) {
  const action = createImprovementAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="order-2 space-y-2 lg:order-1">
        {improvements.length === 0 ? (
          <EmptyState
            icon={History}
            title="Sin mejoras registradas"
            description="Llevá un registro simple de las mejoras que le hacés a este proyecto."
          />
        ) : (
          improvements.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group">
                <CardContent className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.entry_date), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100">
                    <ConfirmDeleteButton
                      title="¿Eliminar esta entrada?"
                      onDelete={() => deleteImprovementAction(item.id, projectId)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Card className="order-1 h-fit lg:order-2">
        <CardContent className="pt-6">
          <form action={formAction} className="grid gap-3">
            <Textarea
              name="description"
              placeholder="Ej: Optimicé las queries del dashboard de reportes..."
              rows={4}
              required
            />
            <input
              type="date"
              name="entry_date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="hidden"
            />
            {state.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending} size="sm">
              {pending ? <Loader2 className="animate-spin" /> : <Plus />}
              Registrar mejora
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
