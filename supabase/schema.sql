-- PokéDex Manager — Schema inicial
-- Ejecutar en el SQL Editor de un proyecto Supabase NUEVO (aislado del resto).

-- =============================================
-- Tabla: collection (la colección personal de cada usuario)
-- =============================================
create table if not exists public.collection (
  id          uuid primary key default gen_random_uuid(),
  -- default auth.uid(): permite inserts vía REST (agente IA) sin user_id explícito;
  -- el valor sale del JWT y el with check de RLS lo sigue validando
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pokemon_id  integer not null,              -- id de PokéAPI (fuente de verdad externa)
  name        text not null,
  sprite_url  text,
  types       jsonb not null default '[]',   -- ["water", "flying"]
  stats       jsonb not null default '{}',   -- { "hp": 78, "attack": 84, ... }
  notes       text,
  captured_at timestamptz not null default now(),

  -- Un usuario no puede capturar el mismo Pokémon dos veces
  constraint collection_user_pokemon_unique unique (user_id, pokemon_id)
);

-- Índice para el patrón de acceso dominante: "mi colección"
create index if not exists collection_user_idx on public.collection (user_id, captured_at desc);

-- =============================================
-- RLS: aislamiento por usuario a nivel de base de datos
-- Decisión de arquitectura: la seguridad no depende del código de la app.
-- Aunque un endpoint tenga un bug, un usuario jamás ve filas ajenas.
-- =============================================
alter table public.collection enable row level security;

create policy "select_own_collection"
  on public.collection for select
  using (auth.uid() = user_id);

create policy "insert_own_collection"
  on public.collection for insert
  with check (auth.uid() = user_id);

create policy "update_own_collection"
  on public.collection for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_own_collection"
  on public.collection for delete
  using (auth.uid() = user_id);

-- =============================================
-- Tabla: chat_messages (historial persistente del asistente)
-- Mismo patrón RLS que collection; cards guarda los pokémon que el
-- frontend renderizó en ese mensaje (presentación, no fuente de verdad).
-- =============================================
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  cards       jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "select_own_chat"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "insert_own_chat"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "delete_own_chat"
  on public.chat_messages for delete
  using (auth.uid() = user_id);
