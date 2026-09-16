# 💰 Plan: Sección de Presupuestos — Mission Control

> Documento resultante de la entrevista de proceso (2026-09-16).
> Complementa a [`plan-dashboard.md`](./plan-dashboard.md). Todo lo de acá se integra sobre lo ya construido en `dev-dashboard/`.

---

## 1. Objetivo del proceso

Construir una **calculadora de presupuestos** que permita cotizar cualquier tipo de trabajo (landing, web institucional, e-commerce, sistema a medida, SaaS, app mobile/desktop, automatizaciones, mantenimientos) en minutos y frente al cliente, con precios mantenibles que se actualizan solos según el dólar.

**El objetivo real no es automatizar un proceso existente — es crear el criterio de precios que hoy no existe.** Hoy se cotiza a intuición, preguntándole a una IA y tirando bajo. La herramienta tiene que corregir eso, no digitalizarlo.

Tres funciones, en orden de importancia:

1. **Cotizar rápido y sin dudar**, incluso presencialmente desde el celular.
2. **Dejar de subcotizar**: mostrar siempre el precio de mercado al lado del precio propio.
3. **Calibrar con datos reales**: guardar horas estimadas y compararlas contra el time tracking real para mejorar las estimaciones futuras.

## 2. Usuario / destinatario

- **Usuario**: Tomás, único usuario del panel. Perfil junior, mercado argentino, estrategia actual de precios bajos para sumar clientes y portfolio.
- **Destinatario secundario**: el cliente o prospecto, que recibe el presupuesto como PDF y como link web. Nunca ve datos internos (horas, costos, márgenes, precio de mercado).

## 3. Flujo paso a paso

1. Un prospecto escribe o se reúne presencialmente.
2. Tomás abre la **calculadora** (probablemente desde el celular, en el momento).
3. Selecciona **tipo de sistema** (base) → marca **funcionalidades** → agrega **complementos** → define **infraestructura** (hosting, dominio, base de datos) → decide si lleva **mantenimiento**.
4. Ajusta **modificadores**: urgencia, complejidad, descuento, segmento (local / exterior).
5. El sistema calcula en vivo: total en USD y en ARS (al blue del día), seña 40%, saldo 60%, abono mensual si corresponde, horas estimadas internas y comparación contra precio de mercado.
6. **Modo presentación**: gira el teléfono y le muestra al cliente la vista limpia (alcance + precio + seña).
7. Envía **PDF con explicaciones + link web** al cliente.
8. El presupuesto queda **congelado 15 días**. Vencido ese plazo, se recalcula al dólar del día.
9. Si el cliente acepta → se crea automáticamente: cliente (si no existía), proyecto, **tareas iniciales**, registros de infraestructura y **factura de la seña (40%)**.
10. Tomás confirma los pagos a mano desde Facturación.

## 4. Inputs necesarios

| Input | Origen |
|---|---|
| Tipo de sistema, funcionalidades, complementos | Catálogo mantenido por el usuario |
| Costos de infraestructura | Catálogo + tabla `infrastructure` existente |
| Cotización del dólar blue | API pública (dolarapi.com), cacheada |
| Datos del cliente/prospecto | Tabla `clients` o `leads`, o carga suelta |
| Segmento (local / exterior) | Elección por presupuesto |
| Modificadores (urgencia, descuento) | Elección por presupuesto |

## 5. Outputs esperados

1. **Presupuesto interno** (vista del usuario): desglose completo, horas estimadas, costos, margen, rango mín-máx, comparación con precio de mercado.
2. **Presupuesto para el cliente**, en dos formatos:
   - **PDF** con explicaciones en lenguaje claro de qué incluye cada ítem.
   - **Link web público** (token secreto, sin login) que el cliente puede abrir desde cualquier lado.
3. **Al aceptarse**: proyecto + tareas iniciales + infraestructura + factura de seña, todo creado automáticamente.

## 6. Reglas principales

- **Precios anclados en USD**, mostrados siempre en USD y ARS. El catálogo no envejece: se actualiza solo al moverse el dólar.
- **Referencia: dólar blue, valor venta.** Configurable.
- **Validez: 15 días** con precio en pesos congelado. Vencido, se recalcula.
- **Seña 40% / saldo 60%.**
- **El precio sale del alcance, nunca de las horas.** Las horas son control interno de rentabilidad. (Si el precio saliera de horas × tarifa, trabajar más rápido con IA significaría ganar menos.)
- **Responsive, buen diseño y UX están incluidos en toda base.** No son adicionales.
- **Mantenimiento opcional según titularidad de la infra**: si el hosting y dominio quedan a nombre del cliente y los paga él, no hay abono. Si los pone Tomás, sí.
- **SaaS para terceros tiene reglas propias**: precio de desarrollo más alto + **mantenimiento obligatorio** + funcionalidades y cambios posteriores cotizados aparte, fuera del abono.
- **Tres segmentos con multiplicador**: Local 1x, LATAM 1,5x, Exterior 2,75x.
- **Los costos de terceros los paga el cliente** (licencias de tiendas, dominios, servicios externos). Se listan explícitamente como *no incluidos* para que no haya sorpresas.
- **Cada ítem del catálogo lleva tres datos**: precio (rango mín-máx), horas estimadas y **tareas plantilla**.
- **El cliente nunca ve**: horas, costos de infra, márgenes, precio de mercado ni rangos.

## 7. Excepciones y casos límite

| Caso | Comportamiento |
|---|---|
| Prospecto que todavía no es cliente ni lead | Se permite presupuesto suelto con nombre y contacto; al aceptarse se crea el cliente |
| El dólar se mueve dentro de los 15 días | Precio en pesos congelado, se respeta |
| Presupuesto vencido | Se marca `expired`; se puede reactivar recalculando al dólar del día |
| Ítem que no está en el catálogo | Se permite ítem libre (nombre + precio + horas manuales) |
| Proyecto sin tarifa por hora | El cálculo por alcance funciona igual; solo se pierde el control de rentabilidad |
| Cliente del exterior | Multiplicador de segmento (default 3x, ajustable) |
| Precio por debajo del mercado | Se permite, pero el sistema avisa cuánto porcentaje se está dejando en la mesa |
| SaaS para terceros sin mantenimiento | Bloqueado: el sistema exige el abono |
| API del dólar caída | Se usa la última cotización cacheada, con aviso de antigüedad |

## 8. Criterios de calidad

El sistema funciona bien si:

- Un presupuesto completo se arma en **menos de 3 minutos** desde el celular.
- La vista cliente es **presentable sin retoques** — se puede mostrar en persona sin vergüenza.
- Nunca se filtra un dato interno al PDF ni al link público.
- Al aceptar, **no hay que cargar nada dos veces**: proyecto, tareas, infra y factura salen solos.
- Después de 5-10 proyectos, la comparación estimado vs. real permite ajustar el catálogo con datos propios.
- El usuario deja de preguntarse "¿cuánto cobro?" y pasa a preguntarse "¿en qué nivel me posiciono?".

## 9. Riesgos y ambigüedades pendientes

1. **El ancla sigue baja.** Los precios del catálogo inicial son los actuales del usuario, que están muy por debajo del mercado (landing USD 32). El guardarraíl de mercado mitiga esto, pero los números de referencia de mercado los propone el asistente, no salen de una fuente verificable.
2. **No existe API de precios de mercado para servicios de desarrollo.** Solo se automatiza el dólar. Los rangos de mercado son estimaciones a revisar periódicamente a mano.
3. **Precios de funcionalidades sin definir.** El usuario dio precios por tipo de sistema pero no por funcionalidad individual. Los valores propuestos abajo son un punto de partida a ajustar.
4. **App mobile / desktop y automatizaciones sin precio definido.** Marcados como pendientes.
5. **Brecha local vs. exterior sin calibrar.** El único dato real es un caso (USD 300 vs USD ~110 equivalente local ≈ 3x). El multiplicador default 3x se basa en un solo punto.
6. **SaaS para terceros**: se resolvió subiendo precio + mantenimiento obligatorio, pero queda abierta la opción más rentable de precio base + porcentaje de las suscripciones.

---

## 10. Plan técnico de implementación

### 10.1 Esquema de base de datos

> La migración `0001_init.sql` **todavía no fue ejecutada**, así que estas tablas se agregan ahí directamente en vez de crear una `0002`.

```sql
create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type catalog_kind as enum ('base', 'feature', 'addon', 'infra', 'recurring');
create type quote_segment as enum ('local', 'latam', 'export');

-- Catálogo maestro de precios
create table catalog_items (
  id uuid primary key default uuid_generate_v4(),
  kind catalog_kind not null,
  category text,                         -- agrupador visual
  name text not null,
  description text,                      -- explicación para el cliente (va al PDF)
  price_min_usd numeric(10,2) not null,
  price_max_usd numeric(10,2) not null,
  market_reference_usd numeric(10,2),    -- guardarraíl: lo que vale en el mercado
  estimated_hours numeric(6,2),
  is_recurring boolean default false,
  requires_maintenance boolean default false,  -- para SaaS de terceros
  is_client_cost boolean default false,        -- lo paga el cliente aparte (licencias de tiendas, etc.)
  active boolean default true,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tareas plantilla: al aceptar un presupuesto, se crean solas
create table catalog_item_tasks (
  id uuid primary key default uuid_generate_v4(),
  catalog_item_id uuid references catalog_items(id) on delete cascade not null,
  title text not null,
  description text,
  priority task_priority default 'medium',
  position integer default 0
);

-- Presupuestos
create table quotes (
  id uuid primary key default uuid_generate_v4(),
  quote_number text unique not null,
  client_id uuid references clients(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  contact_name text,                     -- prospecto suelto
  contact_info text,
  title text not null,
  segment quote_segment default 'local',
  status quote_status default 'draft',
  -- precios
  subtotal_usd numeric(10,2) not null default 0,
  discount_pct numeric(5,2) default 0,
  surcharge_pct numeric(5,2) default 0,  -- urgencia / complejidad
  total_usd numeric(10,2) not null default 0,
  total_ars numeric(12,2),               -- congelado al emitir
  exchange_rate numeric(10,2),           -- dólar usado, congelado
  monthly_usd numeric(10,2) default 0,   -- abono recurrente
  deposit_pct numeric(5,2) default 40,
  -- control interno
  estimated_hours numeric(8,2) default 0,
  market_total_usd numeric(10,2),        -- cuánto valdría a precio de mercado
  -- ciclo de vida
  valid_until date,
  public_token text unique not null,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  project_id uuid references projects(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid references quotes(id) on delete cascade not null,
  catalog_item_id uuid references catalog_items(id) on delete set null,
  kind catalog_kind not null,
  name text not null,
  description text,
  quantity numeric(10,2) default 1,
  unit_price_usd numeric(10,2) not null,
  estimated_hours numeric(6,2) default 0,
  is_recurring boolean default false,
  position integer default 0
);

-- Cache de cotización del dólar
create table exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  source text not null default 'blue',
  buy numeric(10,2),
  sell numeric(10,2),
  fetched_at timestamptz default now()
);

-- Ajustes generales (clave/valor)
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
-- seed: deposit_pct=40, validity_days=15, export_multiplier=3, dollar_source='blue'
```

Más RLS con la misma política `owner_full_access` que el resto, e índices por `quote_id`, `client_id`, `public_token`.

### 10.2 Catálogo inicial (seed)

**Bases** — precios locales, nivel Entrada, a 1.560 ARS/USD:

| Ítem | ARS | USD | Mercado (ref.) | Horas est. |
|---|---|---|---|---|
| Landing page | 50.000 | 32 | 250 | 8 |
| Web institucional PyME | 150.000 – 200.000 | 96 – 128 | 400 | 20 |
| E-commerce | 250.000 – 300.000 | 160 – 192 | 700 | 40 |
| Sistema a medida chico | 250.000 – 400.000 | 160 – 256 | 900 | 50 |
| App mobile (MVP básico) | 600.000 | 385 | 1.200 | 70 |
| SaaS para un tercero | 650.000 – 800.000 | 417 – 513 | 1.500 | 80 |
| Automatización simple | 80.000 – 120.000 | 51 – 77 | 250 | 10 |
| Automatización compleja | 130.000 – 230.000 | 83 – 147 | 500 | 22 |
| App desktop (ejecutable local) | *a definir* | *a definir* | 900 | 50 |

**Funcionalidades** — precios reales del usuario:

| Funcionalidad | ARS | USD | Horas |
|---|---|---|---|
| Login con roles y permisos | 40.000 | 26 | 8 |
| Pasarela de pago (Mercado Pago / Stripe) | 60.000 | 38 | 10 |
| Integración con API externa | 40.000 | 26 | 8 |
| Métricas / dashboard | 40.000 – 60.000 | 26 – 38 | 12 |
| Reportes | 30.000 | 19 | 6 |
| Diseño y migración de base de datos | 30.000 | 19 | 6 |

> Coherencia verificada: una web institucional (150k) + login (40k) + dashboard (50k) + reportes (30k) = 270k, que cae dentro del rango de "sistema a medida chico" (250-400k). El catálogo no se contradice consigo mismo.

**Complementos**: branding/logo, SEO inicial, redacción de textos, migración de contenido, capacitación al cliente, carga inicial de datos.

**Costos del cliente** (`is_client_cost`) — se listan en el presupuesto como *no incluidos*, para que no haya sorpresas:

| Ítem | Costo | Quién paga |
|---|---|---|
| Licencia Google Play Store | USD 25 (único) | Cliente |
| Licencia Apple App Store | USD 99 / año | Cliente |
| Dominio, hosting, servicios de terceros | según corresponda | Cliente, salvo que se incluyan en el mantenimiento |

**Recurrentes**:

| Ítem | ARS/mes | USD/mes |
|---|---|---|
| Mantenimiento mensual (web / sistema) | 20.000 – 50.000 | 13 – 32 (+ infra) |
| Suscripción SaaS propio (KiosControl) | 20.000 – 60.000 | 13 – 38 |
| **Mantenimiento SaaS de terceros** (obligatorio) | 200.000 – 300.000 | **128 – 192** |

> El mantenimiento de SaaS de terceros incluye soporte, corrección de bugs y tareas menores. **No incluye** funcionalidades nuevas ni cambios de alcance: eso se cotiza aparte como presupuesto adicional.

**Multiplicadores por segmento:**

| Segmento | Multiplicador |
|---|---|
| Local (Argentina) | 1x |
| Resto de LATAM | 1,5x |
| Exterior (USA / Europa) | 2,75x (rango 2,5 – 3x) |

**Infraestructura** (costo real, se traslada al cliente + margen): hosting compartido, VPS, dominio `.com` / `.com.ar`, Supabase free/pro, Vercel free/pro.

### 10.3 Fases de construcción

> **Estado: Fases A-F implementadas** (2026-09-16). Esquema en `0001_init.sql` + `0002_catalog_seed.sql` + `0003_fix_rls.sql`. Calculadora en `/quotes/new`, link público en `/p/[token]`, PDF en `/api/quotes/[token]/pdf`, conversión a proyecto con el botón "Aceptar y crear proyecto" en el detalle, vencimiento visible en el widget de alertas del home, y comparación estimado-vs-real una vez que el presupuesto tiene proyecto asociado. Pendiente: probar el flujo completo con datos reales (el usuario ya puede loguearse).

**Fase A — Datos y catálogo**
- Tablas nuevas en `0001_init.sql` + tipos TypeScript.
- Seed del catálogo con los valores de arriba.
- ABM de catálogo en `/settings/catalogo`: editar precios, horas, tareas plantilla.

**Fase B — Calculadora (mobile-first)**
- `/quotes/new`: selección por bloques (base → funcionalidades → complementos → infra → recurrente → modificadores).
- Total flotante fijo abajo, siempre visible: USD + ARS + seña + abono.
- Pensada para una mano y dedo gordo: chips grandes, sin scroll infinito, sin campos de texto salvo que haga falta.
- Panel interno colapsable: horas, costos, margen, comparación con mercado.

**Fase C — Salida al cliente**
- **Modo presentación**: oculta todo lo interno, pantalla limpia para mostrar en persona.
- **Link público** `/p/[token]` — sin login, fuera del matcher del proxy, marca `viewed_at` al abrirse.
- **PDF** con explicaciones, reusando `@react-pdf/renderer` (endpoint público por token).

**Fase D — Conversión a proyecto**
- `acceptQuoteAction`: crea cliente (si hace falta) → proyecto → tareas desde `catalog_item_tasks` → registros de infraestructura → factura de la seña (40%).
- El presupuesto queda vinculado al proyecto (`project_id`).

**Fase E — Dólar y vigencia**
- `/api/exchange-rate` con fetch a `dolarapi.com/v1/dolares/blue`, cacheado (~30 min) y persistido en `exchange_rates`.
- Congelamiento de 15 días al enviar; marcado automático de `expired`; botón de recalcular.
- Alerta en el home cuando hay presupuestos por vencer (se engancha al widget de alertas existente).

**Fase F — Guardarraíles e inteligencia**
- Aviso de subcotización: "estás 68% por debajo del precio de mercado".
- Bloqueo de SaaS para terceros sin mantenimiento.
- **Estimado vs. real**: comparar `quotes.estimated_hours` contra las horas del time tracking del proyecto, y mostrar la rentabilidad real (USD/hora) por proyecto en Métricas.

### 10.4 Integración con lo ya construido

| Ya existe | Cómo se usa |
|---|---|
| `clients`, `leads` | Origen y destino del presupuesto |
| `projects`, `tasks` | Se crean al aceptar |
| `infrastructure` (`monthly_cost`) | Alimenta el cálculo del mantenimiento |
| `invoices`, `invoice_items` | Factura de la seña automática |
| `time_entries` | Calibración estimado vs. real |
| PDF (`@react-pdf/renderer`) | Reutilizado para el presupuesto |
| Widget de alertas del home | Presupuestos por vencer / sin respuesta |
| Command palette (⌘K) | "Nuevo presupuesto" como acción rápida |

---

## 11. Siguiente acción recomendada

Arrancar por **Fase A + Fase B**: esquema, catálogo cargado con los números reales y la calculadora funcionando en mobile. Con eso solo, ya se puede cotizar mejor que hoy. El resto (link público, PDF, conversión automática) se construye encima sin rehacer nada.

**Decisiones que quedaron abiertas:**

1. **App desktop**: sin precio definido. Propuesta a confirmar: 300.000 – 500.000 ARS (USD 192 – 320), en línea con "sistema a medida" más el empaquetado del ejecutable.
2. **Confirmar que el mantenimiento de SaaS de terceros (200-300k) es mensual.** Se asume mensual en todo el plan. Si fuera anual, el modelo de negocio de ese tipo de proyecto cambia por completo.
3. Precios de **complementos** (branding, SEO, redacción, capacitación) todavía sin definir.

Ninguna de las tres bloquea el arranque: se cargan desde el ABM de catálogo cuando estén definidas.
