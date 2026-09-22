# Dashboard TARC Tech

Panel de control personal de **TARC Tech** para gestión freelance — construido para mi propio uso día a día, no como plantilla genérica.

**Demo en vivo:** [dashboard.tarctech.com](https://dashboard.tarctech.com)

---

## ¿Qué es esto?

Un dashboard de un solo usuario (mío) que centraliza todo lo que antes tenía repartido entre notas, chats y planillas sueltas para manejar clientes freelance: quién me contrata, en qué proyecto estoy, cuánto cobrar, qué credenciales uso en cada sistema, y cuándo vence cada cosa.

No es multi-tenant ni pensado para venderse — es la herramienta interna de mi propia operación como desarrollador freelance (Tomás Romero / Tarc Technologies).

## ¿Para qué sirve?

- **Cotizar sin improvisar.** Una calculadora de presupuestos con catálogo propio de precios (por tipo de sistema, funcionalidad y complemento), que avisa cuándo estoy cotizando muy por debajo del mercado, y muestra el total en pesos y en dólares actualizado con la cotización del día.
- **Convertir un presupuesto aceptado en trabajo real con un click**: crea el cliente, el proyecto, las tareas iniciales, la infraestructura y la factura de la seña, todo junto.
- **Organizar cada proyecto**: Kanban de tareas, registro de mejoras, infraestructura (hosting/dominios/SSL) con vencimientos, y las credenciales de acceso.
- **Guardar credenciales sin que el servidor las vea nunca en texto plano** — cifrado en el navegador, no en la base.
- **Medir el tiempo real** con un cronómetro flotante, y compararlo contra lo que había estimado en el presupuesto.
- **Facturar** con seña automática y generación de PDF, sin cobrar dos veces las mismas horas.
- **Enterarme antes de que sea tarde**: un panel de alertas junta infraestructura por vencer, facturas vencidas, tareas próximas y presupuestos por caducar.

## ¿Qué tecnologías usa?

| Capa | Elección | Por qué |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Server Components + Server Actions, sin API REST propia que mantener |
| Lenguaje | **TypeScript** | Muchas entidades relacionadas (clientes, proyectos, presupuestos, facturas) — el tipado evita romper algo al tocar otra cosa |
| UI | **Tailwind CSS v4 + shadcn/ui** (Radix) | Componentes accesibles ya resueltos, velocidad para iterar el diseño |
| Animación | **Framer Motion** | Transiciones de página, entrada de widgets, el drag del Kanban |
| Backend/DB | **Supabase** (Postgres + Auth) | RLS real, Auth con MFA integrado, sin infraestructura propia que operar |
| Cifrado bóveda | **WebCrypto** (AES-256-GCM + PBKDF2), 100% cliente | El servidor nunca recibe ni guarda una contraseña en texto plano |
| Gráficos | **Recharts** | Métricas e ingresos |
| Drag & drop | **dnd-kit** | Kanban de tareas |
| PDF | **@react-pdf/renderer** | Facturas y presupuestos descargables |
| Estado global chico | **Zustand** | Command palette, timer flotante |
| Hosting | **Vercel** + **Supabase Cloud** | Deploy nativo de Next.js, tier gratuito de sobra para uso personal |

## ¿Cómo lo veo funcionando? (live demo)

La demo está desplegada y corriendo de verdad en **[dashboard.tarctech.com](https://dashboard.tarctech.com)** — pero es un panel privado de un solo usuario (el mío), así que la pantalla de login es lo único que vas a poder ver sin credenciales: MFA, bóveda, presupuestos y facturación son datos reales, no una demo pública con datos de prueba.

Si querés ver el resto funcionando, es más fácil correrlo local (siguiente sección) contra tu propio proyecto de Supabase — vas a tener el mismo panel, vacío, para explorar todo sin tocar nada real.

## ¿Cómo lo corro en mi máquina?

1. **Instalar dependencias**:

   ```bash
   npm install
   ```

2. **Crear un proyecto en [supabase.com](https://supabase.com)** (gratis). En *Project Settings → API Keys* vas a encontrar dos claves nuevas:
   - **`sb_publishable_...`** — pública, va al navegador.
   - **`sb_secret_...`** — privada, **nunca** con prefijo `NEXT_PUBLIC_`. Se usa solo en el servidor para el link público de presupuestos.

3. **Variables de entorno**: copiá `.env.local.example` a `.env.local` y completá las tres claves (ver el archivo, tiene la explicación de cada una):

   ```bash
   cp .env.local.example .env.local
   ```

4. **Correr las migraciones SQL**, en orden, en el *SQL Editor* de Supabase:
   - [`0001_init.sql`](./supabase/migrations/0001_init.sql) — esquema completo.
   - [`0002_catalog_seed.sql`](./supabase/migrations/0002_catalog_seed.sql) — catálogo de precios inicial de presupuestos.
   - [`0003_fix_rls.sql`](./supabase/migrations/0003_fix_rls.sql) — refuerza las políticas de seguridad (seguro de re-ejecutar).

   Pegá el contenido completo de cada uno y ejecutalo antes de pasar al siguiente.

5. **Crear tu usuario admin**: *Authentication → Users → Add user* → **"Create new user"** (no "Invite" — esa opción no setea contraseña). Tildá **"Auto Confirm User"**.

6. **Por seguridad, antes de exponerlo en internet**: en *Authentication → Sign In / Providers*, desactivá **"Allow new users to sign up"**. El panel asume que el único usuario autenticado es el dueño — si el alta pública queda abierta, cualquiera que encuentre la URL podría crearse una cuenta y ver todo.

7. **Levantar el servidor**:

   ```bash
   npm run dev
   ```

   Abrí `http://localhost:3000`, iniciá sesión, y listo.

## ¿Qué partes interesantes tiene?

- **La bóveda no es "cifrado en la base"**: la Master Passphrase nunca sale del navegador. Se deriva una clave con PBKDF2 (250.000 iteraciones), se cifra con AES-256-GCM ahí mismo, y a Supabase solo llegan `ciphertext` + `iv` + `salt`. Ni un dump completo de la base expone una contraseña real.
- **Los presupuestos se guardan en USD, se muestran en ARS al dólar del día** (API pública + caché en base + valor fijo de respaldo si la API está caída), y quedan **congelados 15 días** aunque el dólar se mueva después.
- **El catálogo de presupuestos avisa cuando estás regalando el trabajo**: cada ítem tiene un precio propio y un precio de referencia de mercado — el guardarraíl no bloquea nada, solo te lo muestra antes de mandarlo.
- **Un presupuesto aceptado se auto-convierte en proyecto real**: cliente, tareas (desde plantillas por ítem del catálogo), infraestructura y la factura de la seña, todo en una sola acción.
- **El link público de un presupuesto (`/p/[token]`) no usa sesión ni RLS normal** — usa un cliente de Supabase aparte con la clave secreta, server-only, solo para esa ruta puntual. Es la única parte de la app que bypassa Row Level Security a propósito, y de forma bien acotada.
- **Ninguna factura cobra dos veces las mismas horas**: cada `time_entry` tiene un flag `invoiced`, y generar una factura desde horas registradas siempre recalcula en el servidor — nunca confía en un total que mande el navegador.
- **MFA con desafío real en el login**, no solo un checkbox: si está activo, `/login` no alcanza, hace falta pasar por `/login/verify` con el código de la app autenticadora. Se valida tanto en el proxy (chequeo optimista) como en la capa de datos (chequeo autoritativo) — Next.js 16 renombró `middleware` a `proxy`.

---

## Qué queda para una próxima iteración

- Edición de ítems de factura línea por línea (la base ya soporta varias líneas, falta la UI).
- Rotación de la Master Passphrase sin perder las credenciales ya guardadas — hoy solo existe "reiniciar todo".
- Soporte offline / PWA: no contemplado.

## Seguridad de la bóveda — notas importantes

- Si se olvida la Master Passphrase **no hay forma de recuperarla** (es la idea). En Configuración hay un botón para reiniciar la bóveda entera y empezar de cero.
- RLS está activo en todas las tablas como capa defensiva, aunque el panel sea de un solo usuario.
