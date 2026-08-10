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

-- =============================================
-- Perfiles públicos de entrenador + directorio (capa social)
-- La colección NUNCA se abre al público: lo visible sale por funciones
-- security definer con contrato mínimo (ver D12 en docs/DECISIONS.md).
-- =============================================
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Entrenador/a',
  avatar_url   text,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_read_public"
  on public.profiles for select
  to public
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Directorio: nombre/foto/conteo — nunca filas de collection
create or replace function public.trainer_directory()
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  pokemon_count bigint,
  joined_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.user_id, p.display_name, p.avatar_url,
         count(c.id) as pokemon_count, u.created_at as joined_at
  from public.profiles p
  join auth.users u on u.id = p.user_id
  left join public.collection c on c.user_id = p.user_id
  group by p.user_id, p.display_name, p.avatar_url, u.created_at
  order by pokemon_count desc, joined_at asc;
$$;

grant execute on function public.trainer_directory() to anon, authenticated;

-- Equipo público de un entrenador: solo datos de exhibición (sin notas)
create or replace function public.trainer_pokemons(target uuid)
returns table (
  pokemon_id integer,
  name text,
  sprite_url text,
  types jsonb,
  captured_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select c.pokemon_id, c.name, c.sprite_url, c.types, c.captured_at
  from public.collection c
  where c.user_id = target
    and exists (select 1 from public.profiles p where p.user_id = target)
  order by c.captured_at desc;
$$;

grant execute on function public.trainer_pokemons(uuid) to anon, authenticated;

-- =============================================
-- Storage: fotos de perfil (bucket público, escritura solo en carpeta propia)
-- =============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatar_upload_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
