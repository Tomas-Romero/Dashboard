// Tipos escritos a mano para reflejar supabase/migrations/0001_init.sql.
// Cuando tengas un proyecto Supabase conectado, podés regenerarlos con:
//   npx supabase gen types typescript --project-id <id> > types/database.types.ts

export type ProjectStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type InfraType =
  | "hosting"
  | "database"
  | "domain"
  | "ssl_certificate"
  | "email"
  | "other";
export type InfraStatus = "active" | "expiring_soon" | "expired" | "inactive";
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";
export type LeadStatus =
  | "new"
  | "contacted"
  | "proposal_sent"
  | "won"
  | "lost";

export type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  avatar_color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  repo_url: string | null;
  live_url: string | null;
  hourly_rate: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ImprovementLog = {
  id: string;
  project_id: string;
  description: string;
  entry_date: string;
  created_at: string;
};

export type Infrastructure = {
  id: string;
  project_id: string;
  type: InfraType;
  provider: string | null;
  identifier: string | null;
  status: InfraStatus;
  renewal_date: string | null;
  monthly_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CredentialVaultEntry = {
  id: string;
  project_id: string;
  service_name: string;
  username: string | null;
  encrypted_password: string;
  encryption_iv: string;
  encryption_salt: string;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VaultSettings = {
  id: true;
  verifier_hash: string;
  verifier_salt: string;
  encryption_salt: string;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  project_id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  invoiced: boolean;
  description: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  total_amount: number;
  currency: string;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  project_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type Lead = {
  id: string;
  name: string;
  contact_info: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      clients: Table<Client>;
      projects: Table<Project>;
      tasks: Table<Task>;
      improvements_log: Table<ImprovementLog>;
      infrastructure: Table<Infrastructure>;
      credentials_vault: Table<CredentialVaultEntry>;
      vault_settings: Table<VaultSettings>;
      time_entries: Table<TimeEntry>;
      invoices: Table<Invoice>;
      invoice_items: Table<InvoiceItem>;
      leads: Table<Lead>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
