# 🚀 Plan Maestro de Desarrollo: Developer Dashboard Personal

> **Documento de contexto técnico para Claude Code**
> Autor: Arquitectura propuesta por IA — a validar y ejecutar por Tomás Romero
> Stack objetivo: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL)

---

## 📌 1. Resumen Ejecutivo

**Objetivo:** construir un panel de control personal (single-user) para centralizar la gestión de proyectos freelance, clientes, credenciales de acceso a sistemas de terceros e infraestructura web asociada a cada proyecto.

**Principios de diseño:**
- **Single-user first**: no hay multi-tenancy. Toda la app está protegida detrás de un único login (el del desarrollador). Esto simplifica drásticamente el modelo de autorización, pero no exime de seguridad seria en la bóveda de credenciales.
- **Seguridad como prioridad #1** en el módulo de credenciales: cifrado en el cliente antes de persistir, nunca contraseñas en texto plano ni en logs.
- **Extensible**: el esquema de datos debe soportar los módulos adicionales propuestos sin refactors mayores.
- **Ejecutable por fases**: el plan de implementación está pensado para que Claude Code lo siga secuencialmente, fase por fase, sin perder contexto.

---

## 💡 2. Funcionalidades Adicionales de Alto Valor

Además de los 4 requisitos core, se proponen las siguientes 5 funcionalidades. Se recomienda implementar al menos las primeras 3 en una v1.1 (post-MVP):

### 2.1 Time Tracking & Generador de Presupuestos/Facturas ⭐ (Alta prioridad)
Cronómetro por tarea/proyecto que acumula horas facturables. A partir de las horas registradas y una tarifa por cliente/proyecto, genera un presupuesto o factura exportable en PDF. Es el complemento natural del "seguimiento de cobros" ya pedido como core.

### 2.2 Centro de Alertas y Vencimientos ⭐ (Alta prioridad)
Un motor de notificaciones que vigila: dominios por vencer, certificados SSL, renovaciones de hosting, pagos pendientes de clientes y tareas con fecha límite próxima. Se muestra como un widget "🔔 Requiere tu atención" en el home del dashboard. Es el módulo que más tiempo ahorra en la vida real de un freelancer.

### 2.3 Integración con GitHub ⭐ (Alta prioridad)
Vincular cada proyecto a un repo de GitHub (usando tu API token) para mostrar: último commit, issues abiertas, estado de CI si existe. Convierte al dashboard en un verdadero "mission control" en vez de una simple base de datos manual.

### 2.4 Panel de Métricas / Analytics
Vista agregada de ingresos por mes, horas facturables vs. no facturables, proyectos activos vs. pausados, cliente más rentable. Útil para decisiones de negocio (a quién priorizar, cuándo subir tarifas).

### 2.5 CRM Ligero de Prospectos (Leads)
Tabla simple de leads/prospectos que aún no son clientes, con estado (contactado, propuesta enviada, ganado, perdido). Al convertirse en cliente, se promueve a la tabla `clients` con un clic.

---

## 🏗️ 3. Arquitectura del Sistema

### 3.1 Stack Tecnológico (confirmado y ajustado)

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend/SSR | **Next.js 14 (App Router)** | Server Components para data fetching seguro, Server Actions para mutaciones sin exponer API REST propia |
| Lenguaje | **TypeScript** | Tipado estricto en un dashboard con muchas entidades relacionadas reduce bugs |
| UI | **Tailwind CSS + shadcn/ui** | Velocidad de desarrollo + componentes accesibles ya resueltos (tablas, dialogs, forms) |
| Backend/DB | **Supabase (PostgreSQL)** | Auth integrada, Row Level Security, Storage para adjuntos, y extensión `pgcrypto` nativa para cifrado |
| Auth | **Supabase Auth (email/password + magic link)** | Un único usuario admin; se puede reforzar con MFA (TOTP) que Supabase soporta out-of-the-box |
| Cifrado credenciales | **Cifrado en el cliente (AES-256-GCM vía WebCrypto) antes de enviar a Supabase** | Ver sección 3.3 — el servidor nunca ve texto plano |
| Gráficos | **Recharts** | Métricas del módulo 2.4 |
| PDFs (facturas) | **`@react-pdf/renderer`** | Generación de facturas/presupuestos en el cliente o en Server Actions |
| Hosting | **Vercel** (frontend) + **Supabase Cloud** (DB) | Despliegue nativo con Next.js, tier gratuito suficiente para uso personal |

### 3.2 Estructura de Carpetas Propuesta

```
dev-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + navbar protegidos
│   │   ├── page.tsx                # Home: widgets de alertas + métricas
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Detalle + tabs: tareas, mejoras, infra, credenciales
│   │   │       └── kanban.tsx
│   │   ├── vault/
│   │   │   └── page.tsx            # Bóveda de credenciales (requiere re-auth)
│   │   ├── infrastructure/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   ├── page.tsx            # Time tracking + facturas
│   │   │   └── invoices/[id]/pdf.tsx
│   │   ├── leads/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       └── github/route.ts         # Proxy seguro a GitHub API
├── components/
│   ├── ui/                         # shadcn components
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── crypto/
│   │   └── vault-encryption.ts     # AES-256-GCM helpers (WebCrypto)
│   └── actions/                    # Server Actions por dominio
│       ├── clients.ts
│       ├── projects.ts
│       ├── vault.ts
│       └── invoices.ts
├── types/
│   └── database.types.ts           # Generado por `supabase gen types`
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── middleware.ts                   # Protección de rutas /dashboard/*
└── .env.local
```

### 3.3 Estrategia de Seguridad — Bóveda de Credenciales (crítico)

Este es el módulo más sensible del sistema. Diseño recomendado:

1. **Nunca** se envían contraseñas en texto plano al servidor.
2. Al configurar la cuenta, el usuario define una **"Master Passphrase"** (distinta a la contraseña de login) que **nunca se persiste en ningún lado**.
3. De esa passphrase se deriva una clave AES-256 usando **PBKDF2 o Argon2** (vía WebCrypto API en el navegador).
4. Cada credencial se cifra en el cliente (AES-256-GCM) antes de hacer el `insert`. Se guarda: `ciphertext`, `iv` (nonce) y `salt`.
5. Supabase/Postgres solo almacena blobs cifrados ilegibles — ni siquiera un acceso directo a la base de datos expone las contraseñas reales.
6. Al ver una credencial, se pide la Master Passphrase en sesión (cacheada en memoria, nunca en `localStorage`) para descifrar client-side.
7. Adicionalmente, activar **Row Level Security (RLS)** en Supabase aunque sea single-user, como capa defensiva extra.
8. Habilitar **MFA (TOTP)** en Supabase Auth para el login principal.

> ⚠️ Este enfoque prioriza que ni un acceso a la base de datos ni un dump filtrado expongan credenciales reales. Es más importante que la comodidad de un cifrado server-side simple.

---

## 🗄️ 4. Esquema de Base de Datos

### 4.1 Modelo de Relaciones (resumen textual)

```
clients (1) ─── (N) projects
projects (1) ─── (N) tasks
projects (1) ─── (N) improvements_log
projects (1) ─── (N) infrastructure
projects (1) ─── (N) credentials_vault
projects (1) ─── (N) time_entries
clients  (1) ─── (N) invoices
projects (1) ─── (N) invoices (opcional, factura puede agrupar varios proyectos)
invoices (1) ─── (N) invoice_items
(standalone) leads
(standalone) alerts   -- generado/calculado, puede ser tabla o vista
```

### 4.2 DDL Completo (PostgreSQL / Supabase)

```sql
-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============ ENUMS ============
create type project_status as enum ('planning', 'active', 'paused', 'completed', 'cancelled');
create type task_status as enum ('todo', 'in_progress', 'review', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type infra_type as enum ('hosting', 'database', 'domain', 'ssl_certificate', 'email');
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
  provider text,          -- ej: 'DonWeb', 'Hostinger', 'AWS'
  identifier text,         -- ej: nombre de dominio o instancia
  status infra_status default 'active',
  renewal_date date,
  monthly_cost numeric(10,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ BÓVEDA DE CREDENCIALES (cifrado en cliente) ============
create table credentials_vault (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  service_name text not null,      -- ej: 'cPanel', 'Base de datos prod', 'FTP'
  username text,                    -- se puede dejar en claro o cifrar también
  encrypted_password text not null, -- ciphertext (base64)
  encryption_iv text not null,      -- nonce (base64)
  encryption_salt text not null,    -- salt de derivación (base64)
  url text,
  notes text,
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
  source text,             -- ej: 'referido', 'LinkedIn', 'web'
  status lead_status default 'new',
  notes text,
  created_at timestamptz default now()
);

-- ============ RLS (defensa en profundidad, single-user) ============
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table improvements_log enable row level security;
alter table infrastructure enable row level security;
alter table credentials_vault enable row level security;
alter table time_entries enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table leads enable row level security;

-- Política: solo el usuario autenticado (el dueño) puede operar
create policy "owner_full_access" on clients for all using (auth.uid() is not null);
create policy "owner_full_access" on projects for all using (auth.uid() is not null);
create policy "owner_full_access" on tasks for all using (auth.uid() is not null);
create policy "owner_full_access" on improvements_log for all using (auth.uid() is not null);
create policy "owner_full_access" on infrastructure for all using (auth.uid() is not null);
create policy "owner_full_access" on credentials_vault for all using (auth.uid() is not null);
create policy "owner_full_access" on time_entries for all using (auth.uid() is not null);
create policy "owner_full_access" on invoices for all using (auth.uid() is not null);
create policy "owner_full_access" on invoice_items for all using (auth.uid() is not null);
create policy "owner_full_access" on leads for all using (auth.uid() is not null);
```

---

## 🧭 5. Plan de Implementación Paso a Paso (para Claude Code)

> Instrucciones para Claude Code: ejecutar las fases **en orden**. Al terminar cada fase, correr `npm run build` para validar que no hay errores de compilación antes de avanzar a la siguiente. Hacer commit por fase.

### FASE 0 — Setup Inicial
- [ ] `npx create-next-app@latest dev-dashboard --typescript --tailwind --app --eslint`
- [ ] Instalar dependencias base: `@supabase/supabase-js @supabase/ssr shadcn-ui recharts @react-pdf/renderer date-fns lucide-react`
- [ ] Inicializar shadcn/ui: `npx shadcn@latest init` y agregar componentes base (button, card, dialog, table, form, input, select, badge, tabs)
- [ ] Crear proyecto en Supabase Cloud y configurar `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Configurar `lib/supabase/client.ts` y `lib/supabase/server.ts` (patrón SSR de Supabase)

### FASE 1 — Base de Datos
- [ ] Crear archivo `supabase/migrations/0001_init.sql` con el DDL completo de la sección 4.2
- [ ] Ejecutar la migración contra el proyecto Supabase (`supabase db push` o pegar en el SQL Editor del dashboard)
- [ ] Generar tipos TypeScript: `supabase gen types typescript --project-id <id> > types/database.types.ts`

### FASE 2 — Autenticación
- [ ] Implementar login con Supabase Auth (email/password) en `app/(auth)/login`
- [ ] Configurar `middleware.ts` para proteger todas las rutas bajo `app/(dashboard)/*`
- [ ] Habilitar MFA (TOTP) en la configuración de Supabase Auth y agregar flujo de enrolamiento en `settings`

### FASE 3 — Módulo de Clientes (CRUD)
- [ ] Server Actions en `lib/actions/clients.ts` (create, update, delete, list)
- [ ] Página `app/(dashboard)/clients/page.tsx` con tabla (shadcn `Table`) + botón "Nuevo Cliente" (Dialog + Form)
- [ ] Página de detalle `clients/[id]` mostrando proyectos asociados

### FASE 4 — Módulo de Proyectos + Tareas (Kanban)
- [ ] Server Actions en `lib/actions/projects.ts` y `lib/actions/tasks.ts`
- [ ] Listado de proyectos con filtro por estado y cliente
- [ ] Vista de detalle de proyecto con tabs: **Tareas (Kanban)**, **Mejoras**, **Infraestructura**, **Credenciales**
- [ ] Kanban de tareas con drag-and-drop (librería `@dnd-kit/core`) entre columnas `todo / in_progress / review / done`
- [ ] Formulario de "Registro de Mejora" (log simple con fecha y descripción)

### FASE 5 — Bóveda de Credenciales (cifrado)
- [ ] Implementar `lib/crypto/vault-encryption.ts` con funciones `deriveKey(passphrase, salt)`, `encrypt(plaintext, key)`, `decrypt(ciphertext, iv, key)` usando WebCrypto (AES-GCM + PBKDF2)
- [ ] Flujo de configuración de Master Passphrase en `settings` (solo se guarda un hash de verificación, nunca la clave)
- [ ] Formulario para agregar credencial: cifra en el cliente antes de invocar el Server Action
- [ ] Vista de credenciales: solicita passphrase en sesión, descifra en memoria, muestra con botón "revelar/ocultar" y "copiar"

### FASE 6 — Infraestructura
- [ ] CRUD de `infrastructure` asociado a cada proyecto
- [ ] Badge visual de estado (`active` verde, `expiring_soon` amarillo si `renewal_date` < 30 días, `expired` rojo) calculado en el cliente

### FASE 7 — Time Tracking + Facturación
- [ ] Cronómetro flotante (start/stop) vinculado a proyecto/tarea, persistido en `time_entries`
- [ ] Vista `billing`: resumen de horas facturables por proyecto/cliente en el período
- [ ] Generador de facturas: seleccionar cliente + items (manuales o desde horas registradas) → genera fila en `invoices`/`invoice_items`
- [ ] Exportación a PDF con `@react-pdf/renderer`

### FASE 8 — Centro de Alertas
- [ ] Función/vista que calcula alertas dinámicamente: infraestructura por vencer, facturas vencidas, tareas con `due_date` próxima
- [ ] Widget "🔔 Requiere tu atención" en el home del dashboard

### FASE 9 — Integración GitHub
- [ ] Route handler `app/api/github/route.ts` que usa un Personal Access Token (guardado como variable de entorno, no en la DB) para consultar la API de GitHub
- [ ] Mostrar en el detalle de proyecto: último commit, issues abiertas del repo vinculado

### FASE 10 — Dashboard Home + Métricas
- [ ] Página `app/(dashboard)/page.tsx` con: widget de alertas, gráfico de ingresos mensuales (Recharts), proyectos activos, próximas tareas
- [ ] Módulo de CRM de leads (`leads` CRUD simple)

### FASE 11 — Pulido y Despliegue
- [ ] Revisión de RLS policies y variables de entorno en producción
- [ ] Deploy en Vercel + configuración de dominio propio
- [ ] Checklist final de seguridad: sin contraseñas en logs, `.env` en `.gitignore`, MFA activo

---

## ✅ Checklist de Éxito del MVP

- [ ] Puedo loguearme con MFA
- [ ] Puedo crear un cliente y asociarle un proyecto
- [ ] Puedo mover tareas en el Kanban
- [ ] Puedo guardar una credencial y verla descifrada solo con mi passphrase
- [ ] Puedo ver el estado de infraestructura con alertas de vencimiento
- [ ] Puedo registrar horas y generar una factura en PDF
