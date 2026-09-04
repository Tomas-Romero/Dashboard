"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, FolderKanban, KeyRound, ArrowRight, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    title: "Creá tu primer cliente",
    description: "Nombre, empresa y contacto. Después le asignás proyectos.",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Creá un proyecto",
    description: "Estado, tarifa por hora, repo de GitHub y sitio en vivo.",
    href: "/projects/new",
    icon: FolderKanban,
  },
  {
    title: "Configurá tu bóveda",
    description: "Master Passphrase para guardar credenciales cifradas.",
    href: "/vault",
    icon: KeyRound,
  },
];

export function OnboardingHero({ firstName }: { firstName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-8 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
        className="flex size-16 items-center justify-center rounded-3xl bg-primary/15 text-primary"
      >
        <Rocket className="size-8" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight capitalize">
          Bienvenido, {firstName}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Tu panel está listo. Empezá cargando tu primer cliente y proyecto —
          las métricas y alertas se van a ir completando solas.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
          >
            <Link href={step.href}>
              <Card className="group h-full text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
                <CardContent className="flex h-full flex-col gap-3 py-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Empezar <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
