"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { useCommandPaletteStore } from "@/lib/stores/command-palette-store";

function currentTitle(pathname: string) {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.url.length - a.url.length)
    .find((item) => item.url === "/" ? pathname === "/" : pathname.startsWith(item.url));
  return match?.title ?? "Mission Control";
}

export function Topbar() {
  const pathname = usePathname();
  const toggleCommandPalette = useCommandPaletteStore((s) => s.toggle);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-lg">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <h1 className="text-sm font-medium">{currentTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleCommandPalette}
          className="hidden items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex"
        >
          <Search className="size-3.5" />
          Buscar
          <kbd className="ml-1 rounded border bg-background px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
