import type {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  InfraStatus,
  InvoiceStatus,
  LeadStatus,
} from "@/types/database.types";

type BadgeTone = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  planning: { label: "Planificación", tone: "secondary" },
  active: { label: "Activo", tone: "success" },
  paused: { label: "Pausado", tone: "warning" },
  completed: { label: "Completado", tone: "outline" },
  cancelled: { label: "Cancelado", tone: "destructive" },
};

export const TASK_STATUS: Record<TaskStatus, { label: string }> = {
  todo: { label: "Por hacer" },
  in_progress: { label: "En progreso" },
  review: { label: "Revisión" },
  done: { label: "Hecho" },
};

export const TASK_PRIORITY: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  low: { label: "Baja", tone: "secondary" },
  medium: { label: "Media", tone: "outline" },
  high: { label: "Alta", tone: "warning" },
  urgent: { label: "Urgente", tone: "destructive" },
};

export const INFRA_STATUS: Record<InfraStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Activo", tone: "success" },
  expiring_soon: { label: "Por vencer", tone: "warning" },
  expired: { label: "Vencido", tone: "destructive" },
  inactive: { label: "Inactivo", tone: "secondary" },
};

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Borrador", tone: "secondary" },
  sent: { label: "Enviada", tone: "outline" },
  paid: { label: "Pagada", tone: "success" },
  overdue: { label: "Vencida", tone: "destructive" },
  cancelled: { label: "Cancelada", tone: "secondary" },
};

export const LEAD_STATUS: Record<LeadStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "Nuevo", tone: "outline" },
  contacted: { label: "Contactado", tone: "secondary" },
  proposal_sent: { label: "Propuesta enviada", tone: "warning" },
  won: { label: "Ganado", tone: "success" },
  lost: { label: "Perdido", tone: "destructive" },
};
