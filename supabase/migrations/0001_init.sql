-- ============================================================
-- Developer Dashboard — schema inicial
-- Ejecutar en el SQL Editor de Supabase (o `supabase db push`)
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============ ENUMS ============
create type project_status as enum ('planning', 'active', 'paused', 'completed', 'cancelled');
create type task_status as enum ('todo', 'in_progress', 'review', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type infra_type as enum ('hosting', 'database', 'domain', 'ssl_certificate', 'email', 'other');
create type infra_status as enum ('active', 'expiring_soon', 'expired', 'inactive');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type lead_status as enum ('new', 'contacted', 'proposal_sent', 'won', 'lost');

-- ============ CLIENTES ============
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  email text,
  phone text,
  avatar_color text default '#6d5ef8',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ PROYECTOS ============
create table projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete set null,
  name text not null,
  description text,
  status project_status default 'planning',
  repo_url text,
  live_url text,
  hourly_rate numeric(10,2),
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ TAREAS (Kanban) ============
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  status task_status default 'todo',
  priority task_priority default 'medium',
  position integer default 0,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ REGISTRO DE MEJORAS ============
create table improvements_log (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  description text not null,
  entry_date date default current_date,
  created_at timestamptz default now()
);

-- ============ INFRAESTRUCTURA ============
create table infrastructure (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  type infra_type not null,
  provider text,
  identifier text,
  status infra_status default 'active',
  renewal_date date,
  monthly_cost numeric(10,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ BÓVEDA DE CREDENCIALES (cifrado en cliente, AES-256-GCM) ============
create table credentials_vault (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  service_name text not null,
  username text,
  encrypted_password text not null,
  encryption_iv text not null,
  encryption_salt text not null,
  url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Guarda únicamente el verificador (hash) de la Master Passphrase, jamás la clave.
-- Fila única (single-user). Se usa para confirmar la passphrase antes de descifrar.
create table vault_settings (
  id boolean primary key default true constraint single_row check (id),
  verifier_hash text not null,
  verifier_salt text not null,
  encryption_salt text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ TIME TRACKING ============
create table time_entries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  billable boolean default true,
  invoiced boolean default false not null,
  description text,
  created_at timestamptz default now()
);

-- ============ FACTURACIÓN ============
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete set null not null,
  invoice_number text unique not null,
  status invoice_status default 'draft',
  issue_date date default current_date,
  due_date date,
  paid_date date,
  total_amount numeric(10,2) not null default 0,
  currency text default 'ARS',
  created_at timestamptz default now()
);

create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  description text not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) generated always as (quantity * unit_price) stored
);

-- ============ CRM DE LEADS ============
create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_info text,
  source text,
  status lead_status default 'new',
  notes text,
  created_at timestamptz default now()
);

-- ============ updated_at triggers ============
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clients_updated_at before update on clients for each row execute function set_updated_at();
create trigger trg_projects_updated_at before update on projects for each row execute function set_updated_at();
create trigger trg_tasks_updated_at before update on tasks for each row execute function set_updated_at();
create trigger trg_infrastructure_updated_at before update on infrastructure for each row execute function set_updated_at();
create trigger trg_credentials_vault_updated_at before update on credentials_vault for each row execute function set_updated_at();
create trigger trg_vault_settings_updated_at before update on vault_settings for each row execute function set_updated_at();

-- ============ RLS (defensa en profundidad, single-user) ============
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table improvements_log enable row level security;
alter table infrastructure enable row level security;
alter table credentials_vault enable row level security;
alter table vault_settings enable row level security;
alter table time_entries enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table leads enable row level security;

create policy "owner_full_access" on clients for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on projects for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on tasks for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on improvements_log for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on infrastructure for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on credentials_vault for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on vault_settings for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on time_entries for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on invoice_items for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on leads for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============ Índices útiles ============
create index idx_projects_client_id on projects(client_id);
create index idx_tasks_project_id on tasks(project_id);
create index idx_infrastructure_project_id on infrastructure(project_id);
create index idx_credentials_vault_project_id on credentials_vault(project_id);
create index idx_time_entries_project_id on time_entries(project_id);
create index idx_invoices_client_id on invoices(client_id);
create index idx_invoice_items_invoice_id on invoice_items(invoice_id);
