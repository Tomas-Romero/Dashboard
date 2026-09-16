"use client";

import { motion } from "framer-motion";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  /** Pasá el ícono ya renderizado: `icon={<Users className="size-6" />}`.
   *  Una referencia de componente sin invocar (`icon={Users}`) no es
   *  serializable de Server a Client Component. */
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}
