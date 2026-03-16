-- ============================================================
-- IT Ops Growth Tracker — Schema Supabase
-- Incolla questo script nell'editor SQL di Supabase
-- ============================================================

-- Tabella operazioni
create table operations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  date date,
  note text,
  created_by uuid references auth.users(id),
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabella sotto-attività
create table tasks (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid references operations(id) on delete cascade,
  label text not null,
  done boolean default false,
  done_by_name text,
  done_at timestamptz,
  note text,
  note_by_name text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Indici
create index on tasks(operation_id);
create index on operations(created_at desc);

-- Row Level Security (RLS) — tutti gli utenti autenticati possono leggere/scrivere
alter table operations enable row level security;
alter table tasks enable row level security;

create policy "Autenticati leggono operazioni" on operations
  for select using (auth.role() = 'authenticated');

create policy "Autenticati creano operazioni" on operations
  for insert with check (auth.role() = 'authenticated');

create policy "Autenticati modificano operazioni" on operations
  for update using (auth.role() = 'authenticated');

create policy "Autenticati eliminano operazioni" on operations
  for delete using (auth.role() = 'authenticated');

create policy "Autenticati leggono task" on tasks
  for select using (auth.role() = 'authenticated');

create policy "Autenticati creano task" on tasks
  for insert with check (auth.role() = 'authenticated');

create policy "Autenticati modificano task" on tasks
  for update using (auth.role() = 'authenticated');

create policy "Autenticati eliminano task" on tasks
  for delete using (auth.role() = 'authenticated');

-- Funzione per aggiornare updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger operations_updated_at
  before update on operations
  for each row execute function update_updated_at();

-- Abilita Realtime per sync in tempo reale
alter publication supabase_realtime add table operations;
alter publication supabase_realtime add table tasks;
