-- ============================================================
-- SEED: catálogo inicial de presupuestos
-- Ejecutar DESPUÉS de 0001_init.sql
--
-- Precios en USD, convertidos a 1.560 ARS/USD (dólar blue venta, 2026-09).
-- `market_reference_usd` son estimaciones de mercado usadas como guardarraíl
-- de subcotización — ajustalas cuando tengas mejores referencias.
-- ============================================================

insert into app_settings (key, value) values
  ('deposit_pct',         '40'::jsonb),
  ('validity_days',       '15'::jsonb),
  ('dollar_source',       '"blue"'::jsonb),
  ('fallback_rate',       '1560'::jsonb),
  ('segment_multipliers', '{"local": 1, "latam": 1.5, "export": 2.75}'::jsonb);

-- ---------- BASES ----------
insert into catalog_items (kind, category, name, description, price_min_usd, price_max_usd, market_reference_usd, estimated_hours, requires_maintenance, active, position) values
  ('base', 'Web',            'Landing page',                   'Una página con secciones, formulario de contacto, responsive y optimizada.', 32, 32, 250, 8, false, true, 1),
  ('base', 'Web',            'Web institucional PyME',         'Sitio de 5-6 secciones con diseño a medida y panel simple de novedades.', 96, 128, 400, 20, false, true, 2),
  ('base', 'Web',            'E-commerce',                     'Tienda online con catálogo, carrito y checkout.', 160, 192, 700, 40, false, true, 3),
  ('base', 'Sistemas',       'Sistema a medida (chico)',       'Sistema con login, ABM y gestión de datos. Ej: turnos, stock, clientes.', 160, 256, 900, 50, false, true, 4),
  ('base', 'Apps',           'App mobile (MVP)',               'Aplicación móvil básica. Las licencias de las tiendas las paga el cliente.', 385, 385, 1200, 70, false, true, 5),
  ('base', 'Apps',           'App desktop (ejecutable)',       'Precio a confirmar. Aplicación de escritorio con instalador local.', 192, 320, 900, 50, false, false, 6),
  ('base', 'SaaS',           'SaaS para un tercero',           'Desarrollo completo de un SaaS que explota el cliente. Requiere mantenimiento mensual.', 417, 513, 1500, 80, true, true, 7),
  ('base', 'Automatización', 'Automatización simple',          'Automatización de una tarea puntual o integración entre dos servicios.', 51, 77, 250, 10, false, true, 8),
  ('base', 'Automatización', 'Automatización compleja',        'Flujo con múltiples pasos, condiciones e integraciones.', 83, 147, 500, 22, false, true, 9);

-- ---------- FUNCIONALIDADES ----------
insert into catalog_items (kind, category, name, description, price_min_usd, price_max_usd, market_reference_usd, estimated_hours, position) values
  ('feature', 'Funcionalidades', 'Login con roles y permisos',         'Registro, inicio de sesión y distintos niveles de acceso.', 26, 26, 120, 8, 1),
  ('feature', 'Funcionalidades', 'Pasarela de pago',                   'Cobros online con Mercado Pago o Stripe.', 38, 38, 150, 10, 2),
  ('feature', 'Funcionalidades', 'Integración con API externa',        'Conexión con un servicio de terceros.', 26, 26, 120, 8, 3),
  ('feature', 'Funcionalidades', 'Métricas / dashboard',               'Panel con indicadores y gráficos del negocio.', 26, 38, 200, 12, 4),
  ('feature', 'Funcionalidades', 'Reportes',                           'Generación y exportación de reportes.', 19, 19, 100, 6, 5),
  ('feature', 'Funcionalidades', 'Diseño y migración de base de datos','Modelado de datos y migración desde un sistema anterior.', 19, 19, 120, 6, 6);

-- ---------- COMPLEMENTOS (precios propuestos — ajustar) ----------
insert into catalog_items (kind, category, name, description, price_min_usd, price_max_usd, market_reference_usd, estimated_hours, position) values
  ('addon', 'Complementos', 'Branding / logo',         'Precio propuesto. Identidad visual básica: logo, colores y tipografías.', 30, 45, 150, 8, 1),
  ('addon', 'Complementos', 'SEO inicial',             'Precio propuesto. Metadatos, estructura, sitemap y buenas prácticas.', 25, 40, 150, 6, 2),
  ('addon', 'Complementos', 'Redacción de textos',     'Precio propuesto. Textos del sitio escritos a medida.', 20, 35, 120, 6, 3),
  ('addon', 'Complementos', 'Migración de contenido',  'Precio propuesto. Traspaso de contenido desde el sitio anterior.', 19, 32, 100, 5, 4),
  ('addon', 'Complementos', 'Capacitación al cliente', 'Precio propuesto. Sesión de uso del sistema más material de referencia.', 15, 25, 80, 3, 5),
  ('addon', 'Complementos', 'Carga inicial de datos',  'Precio propuesto. Alta de productos, usuarios o contenido inicial.', 19, 32, 100, 5, 6);

-- ---------- INFRAESTRUCTURA (costo real, base del mantenimiento) ----------
insert into catalog_items (kind, category, name, description, price_min_usd, price_max_usd, estimated_hours, is_recurring, position) values
  ('infra', 'Infraestructura', 'Hosting compartido',                  'Hosting para sitios chicos y medianos.', 5, 10, 0, true, 1),
  ('infra', 'Infraestructura', 'VPS / servidor',                      'Servidor dedicado para sistemas con más carga.', 6, 15, 0, true, 2),
  ('infra', 'Infraestructura', 'Base de datos (Supabase Pro)',        'Base de datos gestionada con backups.', 25, 25, 0, true, 3),
  ('infra', 'Infraestructura', 'Hosting de aplicación (Vercel Pro)',  'Despliegue y CDN para la aplicación.', 20, 20, 0, true, 4);

-- ---------- RECURRENTES ----------
insert into catalog_items (kind, category, name, description, price_min_usd, price_max_usd, market_reference_usd, estimated_hours, is_recurring, position) values
  ('recurring', 'Mantenimiento', 'Mantenimiento mensual',          'Actualizaciones, backups y soporte. Se suma al costo de infraestructura.', 13, 32, 60, 2, true, 1),
  ('recurring', 'Mantenimiento', 'Mantenimiento SaaS de terceros', 'Obligatorio. Soporte, corrección de bugs y tareas menores. No incluye funcionalidades nuevas.', 128, 192, 400, 10, true, 2),
  ('recurring', 'Suscripciones', 'Suscripción a SaaS propio',      'Abono mensual por el uso de un sistema propio (ej. KiosControl).', 13, 38, 50, 0, true, 3);

-- ---------- COSTOS QUE PAGA EL CLIENTE ----------
insert into catalog_items (kind, category, name, description, price_min_usd, price_max_usd, estimated_hours, is_client_cost, position) values
  ('infra', 'Costos del cliente', 'Licencia Google Play Store', 'Pago único a Google para publicar la app. Lo abona el cliente.', 25, 25, 0, true, 10),
  ('infra', 'Costos del cliente', 'Licencia Apple App Store',   'Suscripción anual a Apple para publicar la app. Lo abona el cliente.', 99, 99, 0, true, 11),
  ('infra', 'Costos del cliente', 'Dominio (.com / .com.ar)',   'Registro anual del dominio a nombre del cliente.', 15, 25, 0, true, 12);

-- ---------- TAREAS PLANTILLA ----------
-- Al aceptarse un presupuesto, estas tareas se crean solas en el Kanban del proyecto.

insert into catalog_item_tasks (catalog_item_id, title, priority, position)
select ci.id, t.title, t.priority::task_priority, t.position
from catalog_items ci
cross join (values
  ('Definir alcance y estructura con el cliente', 'high', 1),
  ('Diseño de pantallas', 'high', 2),
  ('Maquetado responsive', 'medium', 3),
  ('Carga de contenido', 'medium', 4),
  ('Revisión, ajustes y puesta online', 'high', 5)
) as t(title, priority, position)
where ci.kind = 'base' and ci.category = 'Web';

insert into catalog_item_tasks (catalog_item_id, title, priority, position)
select ci.id, t.title, t.priority::task_priority, t.position
from catalog_items ci
cross join (values
  ('Modelar entidades y base de datos', 'high', 1),
  ('Implementar autenticación y roles', 'high', 2),
  ('ABM principal', 'high', 3),
  ('Pantallas de listado y detalle', 'medium', 4),
  ('Pruebas y puesta en producción', 'high', 5)
) as t(title, priority, position)
where ci.kind = 'base' and ci.category in ('Sistemas', 'SaaS');

insert into catalog_item_tasks (catalog_item_id, title, priority, position)
select ci.id, t.title, t.priority::task_priority, t.position
from catalog_items ci
cross join (values
  ('Modelar usuarios y roles', 'high', 1),
  ('Implementar autenticación', 'high', 2),
  ('Pantalla de login y registro', 'medium', 3),
  ('Permisos por rol', 'medium', 4)
) as t(title, priority, position)
where ci.kind = 'feature' and ci.name = 'Login con roles y permisos';

insert into catalog_item_tasks (catalog_item_id, title, priority, position)
select ci.id, t.title, t.priority::task_priority, t.position
from catalog_items ci
cross join (values
  ('Configurar cuenta y credenciales de la pasarela', 'high', 1),
  ('Integrar checkout', 'high', 2),
  ('Manejar webhooks y estados de pago', 'high', 3),
  ('Probar pagos en sandbox', 'medium', 4)
) as t(title, priority, position)
where ci.kind = 'feature' and ci.name = 'Pasarela de pago';
