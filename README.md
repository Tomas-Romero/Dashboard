# Mission Control — Developer Dashboard

Panel de control personal para gestionar proyectos freelance, clientes, credenciales e infraestructura. Ver [`plan-dashboard.md`](../plan-dashboard.md) para el diseño original.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 + shadcn/ui (Radix) · Supabase (Postgres + Auth) · Framer Motion · Recharts · dnd-kit · WebCrypto (AES-256-GCM) para la bóveda.

## Puesta en marcha

1. **Instalar dependencias** (ya hecho si estás viendo esto recién generado):

   ```bash
   npm install
   ```

2. **Crear un proyecto en [supabase.com](https://supabase.com)** (gratis). Al crearlo, andá a *Project Settings → API* y copiá:
   - `Project URL`
   - `anon public` key

3. **Configurar variables de entorno**: copiá `.env.local.example` a `.env.local` y pegá esas credenciales:

   ```bash
   cp .env.local.example .env.local
   ```

4. **Correr la migración SQL**: abrí el *SQL Editor* de tu proyecto Supabase y pegá el contenido completo de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Ejecutalo una sola vez.

5. **Crear tu usuario admin**: en Supabase, andá a *Authentication → Users → Add user* y creá tu usuario (email + contraseña). Esta app es single-user: ese es el único login.

6. **Levantar el servidor**:

   ```bash
   npm run dev
   ```

   Abrí `http://localhost:3000`, iniciá sesión con el usuario que creaste, y listo.

## Qué está implementado

- **Auth**: login con Supabase Auth, sesión protegida vía `proxy.ts` (Next 16 renombró `middleware` → `proxy`) + verificación autoritativa en `lib/dal.ts`.
- **MFA (TOTP)**: activación desde Configuración (QR + código de verificación); si está activo, el login pide un segundo paso (`/login/verify`) antes de otorgar acceso — gateado tanto en el proxy (chequeo optimista) como en el DAL (chequeo autoritativo).
- **Clientes**: CRUD completo con detalle y proyectos asociados.
- **Proyectos**: CRUD, tabs de detalle con:
  - **Tareas**: Kanban con drag-and-drop (dnd-kit) entre `todo/in_progress/review/done`, con reordenamiento **dentro** de cada columna (no solo cambio de columna) y overlay animado durante el arrastre.
  - **Mejoras**: registro simple con fecha.
  - **Infraestructura**: CRUD de hosting/dominios/SSL/DB con vencimientos.
  - **Credenciales**: acceso directo a la bóveda filtrada por proyecto.
  - **GitHub**: si el proyecto tiene `repo_url`, se muestra el último commit y la cantidad de issues abiertas (vía `/api/github`, usa `GITHUB_TOKEN` si está configurado para evitar rate limits).
- **Bóveda de credenciales**: cifrado **AES-256-GCM en el navegador** (WebCrypto). Configurás una Master Passphrase (nunca se envía ni se guarda) que deriva la clave vía PBKDF2 (250k iteraciones). El servidor solo almacena `ciphertext` + `iv` + `salt`. La clave derivada vive únicamente en memoria (React state) durante la sesión del navegador — nunca en `localStorage`.
- **Time tracking**: cronómetro flotante global (visible en todo el panel), un solo timer activo a la vez, vinculado a un proyecto. Las horas registradas alimentan el widget "Horas esta semana" del home y el resumen de facturación.
- **Facturación**: alta manual de facturas, cambio de estado (borrador/enviada/pagada/vencida), **generación de factura a partir de horas registradas** (toma horas × tarifa del proyecto) y **exportación a PDF** (`@react-pdf/renderer`, endpoint `/api/invoices/[id]/pdf`).
- **Infraestructura (vista global)** y **Leads (CRM ligero)**.
- **Métricas**: ingresos por cliente, proyectos por estado y horas registradas por proyecto (Recharts).
- **Dashboard home**: métricas animadas, gráfico de ingresos, widget de alertas (infraestructura por vencer, facturas vencidas, tareas próximas) y accesos rápidos.
- **Command palette** (`⌘K` / `Ctrl+K`): navegación rápida a cualquier sección desde cualquier pantalla.
- **Diseño**: tema oscuro por defecto con acento índigo/violeta, animaciones de entrada y transición de página con Framer Motion, glassmorphism en login/bóveda, esqueletos de carga (`loading.tsx`) por sección y páginas de error/404 con el mismo lenguaje visual.

## Qué queda para una próxima iteración

- El generador de facturas es intencionalmente simple (sin edición de ítems línea por línea en la UI); `invoice_items` ya soporta múltiples líneas si querés extenderlo.
- "Horas registradas" en Facturación no descuenta horas ya facturadas previamente (no hay un flag `invoiced` en el schema) — es un total acumulado, pensado para revisar antes de generar la factura.
- Soporte offline / PWA no está contemplado.

## Seguridad de la bóveda — notas importantes

- Si olvidás la Master Passphrase **no hay forma de recuperarla** (por diseño). En _Configuración_ hay un botón para reiniciar la bóveda (borra todo y empezás de cero).
- RLS (Row Level Security) está activo en todas las tablas como capa defensiva extra, aunque la app es single-user.
