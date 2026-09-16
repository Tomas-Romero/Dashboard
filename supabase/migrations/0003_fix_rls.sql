-- ============================================================
-- FIX: activar RLS en las tablas de Presupuestos que quedaron
-- sin protección (el bloque se cortó al pegar 0001_init.sql).
-- Seguro de re-ejecutar: no borra ni duplica datos.
-- ============================================================

alter table catalog_items enable row level security;
alter table catalog_item_tasks enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table exchange_rates enable row level security;
alter table app_settings enable row level security;

drop policy if exists "owner_full_access" on catalog_items;
drop policy if exists "owner_full_access" on catalog_item_tasks;
drop policy if exists "owner_full_access" on quotes;
drop policy if exists "owner_full_access" on quote_items;
drop policy if exists "owner_full_access" on exchange_rates;
drop policy if exists "owner_full_access" on app_settings;

create policy "owner_full_access" on catalog_items for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on catalog_item_tasks for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on quotes for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on quote_items for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on exchange_rates for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "owner_full_access" on app_settings for all using (auth.uid() is not null) with check (auth.uid() is not null);
