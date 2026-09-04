"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
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
import { useCommandPaletteStore } from "@/lib/stores/command-palette-store";
import { globalSearchAction, type SearchResult } from "@/lib/actions/search";

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

function resultHref(result: SearchResult) {
  return result.type === "client" ? `/clients/${result.id}` : `/projects/${result.id}`;
}

export function CommandPalette() {
  const { open, setOpen, toggle } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();
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

  useEffect(() => {
    if (query.trim().length < 2) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const found = await globalSearchAction(query);
        setResults(found);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  }

  function go(url: string) {
    setOpen(false);
    router.push(url);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) setResults([]);
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Buscar" description="Navegación rápida">
      <CommandInput
        placeholder="Buscar clientes, proyectos o una sección..."
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        {query.trim().length >= 2 && (
          <CommandGroup heading="Resultados">
            {pending && results.length === 0 && (
              <CommandItem disabled>
                <Loader2 className="animate-spin" /> Buscando...
              </CommandItem>
            )}
            {!pending && results.length === 0 && (
              <CommandEmpty>Sin resultados para &quot;{query}&quot;.</CommandEmpty>
            )}
            {results.map((result) => (
              <CommandItem key={`${result.type}-${result.id}`} onSelect={() => go(resultHref(result))}>
                {result.type === "client" ? <Users /> : <FolderKanban />}
                <span>{result.title}</span>
                {result.subtitle && (
                  <span className="ml-auto text-xs text-muted-foreground">{result.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query.trim().length < 2 && (
          <>
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
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-end border-t px-3 py-2">
        <CommandShortcut>⌘K</CommandShortcut>
      </div>
    </CommandDialog>
  );
}
