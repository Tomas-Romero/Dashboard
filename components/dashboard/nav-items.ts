import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  KeyRound,
  Server,
  Receipt,
  UserPlus,
  BarChart3,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
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
