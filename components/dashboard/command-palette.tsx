"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommandPaletteStore } from "@/lib/stores/command-palette-store";
import {
  Users,
  FolderKanban,
  KeyRound,
  Server,
  Receipt,
  UserPlus,
  BarChart3,
  Settings,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

const NAV = [
  { title: "Inicio", url: "/", icon: LayoutDashboard },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Proyectos", url: "/projects", icon: FolderKanban },
  { title: "Bóveda", url: "/vault", icon: KeyRound },
  { title: "Infraestructura", url: "/infrastructure", icon: Server },
  { title: "Facturación", url: "/billing", icon: Receipt },
  { title: "Métricas", url: "/metrics", icon: BarChart3 },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Configuración", url: "/settings", icon: Settings },
];

const QUICK_ACTIONS = [
  { title: "Nuevo proyecto", url: "/projects/new", icon: Plus },
];

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPaletteStore();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  function go(url: string) {
    setOpen(false);
    router.push(url);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Buscar" description="Navegación rápida">
      <CommandInput placeholder="Buscar una sección o acción..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Acciones rápidas">
          {QUICK_ACTIONS.map((item) => (
            <CommandItem key={item.url} onSelect={() => go(item.url)}>
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navegación">
          {NAV.map((item) => (
            <CommandItem key={item.url} onSelect={() => go(item.url)}>
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-end border-t px-3 py-2">
        <CommandShortcut>⌘K</CommandShortcut>
      </div>
    </CommandDialog>
  );
}
