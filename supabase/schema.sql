-- MysteryLeague
-- Ejecuta este archivo en el SQL Editor de Supabase (rol postgres).
-- Después copia la URL del proyecto y la clave publicable en .env.local:
--   VITE_SUPABASE_URL=
--   VITE_SUPABASE_PUBLISHABLE_KEY=
--
-- Los expedientes viven en la app. Aquí se guardan perfil, partida y libreta.
-- Cada detective solo puede modificar sus filas. La liga puede leer perfiles.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  rank text not null default 'Aprendiz' check (rank in ('Aprendiz', 'Investigador', 'Detective', 'Inspector', 'Comisario')),
  cases_solved integer not null default 0 check (cases_solved >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  score_sum integer not null default 0 check (score_sum >= 0),
  accuracy integer not null default 0 check (accuracy >= 0 and accuracy <= 100),
  streak integer not null default 0 check (streak >= 0),
  coins integer not null default 0 check (coins >= 0),
  badge_ids text[] not null default '{}',
  onboarding_completed boolean not null default false,
  avatar_id text not null default 'lens',
  last_active_on date,
  pinned_friends text[] not null default '{}',
  invite_code text,
  active_league_id uuid,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,16}$')
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create table if not exists public.case_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  case_id text not null,
  status text not null check (status in ('in_progress', 'solved')),
  started_at timestamptz not null default now(),
  solved_at timestamptz,
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  hints_used integer not null default 0 check (hints_used >= 0),
  score integer check (score is null or (score >= 0 and score <= 100)),
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  coins_awarded integer not null default 0 check (coins_awarded >= 0),
  culprit_correct boolean,
  answers jsonb,
  reward jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, case_id)
);

create index if not exists case_runs_user_idx on public.case_runs (user_id);

create table if not exists public.notebooks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  case_id text not null,
  notes text not null default '',
  marked_suspects text[] not null default '{}',
  marked_evidence text[] not null default '{}',
  hypotheses jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

alter table public.profiles enable row level security;
alter table public.case_runs enable row level security;
alter table public.notebooks enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update on public.case_runs to authenticated;
grant select, insert, update on public.notebooks to authenticated;

drop policy if exists "perfiles visibles para la liga" on public.profiles;
create policy "perfiles visibles para la liga"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "alta del propio perfil" on public.profiles;
create policy "alta del propio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "editar el propio perfil" on public.profiles;
create policy "editar el propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "partidas propias" on public.case_runs;
create policy "partidas propias"
  on public.case_runs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "libretas propias" on public.notebooks;
create policy "libretas propias"
  on public.notebooks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desired text;
begin
  desired := nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), '');
  if desired is null or desired !~ '^[A-Za-z0-9_]{3,16}$' then
    desired := 'det_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;

  insert into public.profiles (id, username, invite_code)
  values (new.id, desired, upper(substr(md5(new.id::text), 1, 6)))
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.prevent_username_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.username is distinct from old.username then
    raise exception 'username is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_username_immutable on public.profiles;
create trigger profiles_username_immutable
  before update on public.profiles
  for each row execute function private.prevent_username_change();

-- Comprueba el nombre antes de que exista sesión. Solo devuelve un booleano.
create or replace function public.username_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(trim(p_name), '') ~ '^[A-Za-z0-9_]{3,16}$'
    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(trim(p_name))
    );
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Social y liga. Idempotente: se puede volver a ejecutar sobre un proyecto ya creado.

alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists active_league_id uuid;

update public.profiles
set invite_code = upper(substr(md5(id::text), 1, 6))
where invite_code is null;

create unique index if not exists profiles_invite_code_idx
  on public.profiles (invite_code)
  where invite_code is not null;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);

create unique index if not exists friend_requests_pending_idx
  on public.friend_requests (least(from_id::text, to_id::text), greatest(from_id::text, to_id::text))
  where status = 'pending';

create table if not exists public.friendships (
  user_low uuid not null references public.profiles (id) on delete cascade,
  user_high uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  check (user_low::text < user_high::text)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references public.profiles (id) on delete cascade,
  user_high uuid not null references public.profiles (id) on delete cascade,
  unique (user_low, user_high),
  check (user_low::text < user_high::text)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

create table if not exists public.message_reads (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('case_solved', 'level_up', 'badge')),
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists activities_created_idx on public.activities (created_at desc);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 3 and 32),
  description text not null default '',
  avatar_id text not null default 'seal',
  invite_code text not null,
  max_members integer not null check (max_members between 2 and 50),
  created_at timestamptz not null default now(),
  unique (invite_code)
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists public.league_invites (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  number integer not null check (number >= 1),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('active', 'closed')),
  podium jsonb not null default '[]'::jsonb,
  unique (league_id, number)
);

create table if not exists public.league_scores (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_index integer not null check (week_index between 0 and 3),
  rapido integer not null default 0 check (rapido between 0 and 60),
  expediente integer not null default 0 check (expediente between 0 and 100),
  especial integer not null default 0 check (especial between 0 and 100),
  objetivo integer not null default 0 check (objetivo between 0 and 40),
  unique (season_id, user_id, week_index)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_active_league_fk') then
    alter table public.profiles
      add constraint profiles_active_league_fk
      foreign key (active_league_id) references public.leagues (id) on delete set null;
  end if;
end $$;

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.activities enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_invites enable row level security;
alter table public.seasons enable row level security;
alter table public.league_scores enable row level security;

grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert, delete on public.friendships to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update on public.message_reads to authenticated;
grant select, insert on public.activities to authenticated;
grant select, insert on public.leagues to authenticated;
grant select, insert on public.league_members to authenticated;
grant select, insert, update on public.league_invites to authenticated;
grant select, insert on public.seasons to authenticated;
grant select, insert, update on public.league_scores to authenticated;

drop policy if exists "solicitudes propias" on public.friend_requests;
create policy "solicitudes propias"
  on public.friend_requests for select to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "enviar solicitud" on public.friend_requests;
create policy "enviar solicitud"
  on public.friend_requests for insert to authenticated
  with check (auth.uid() = from_id);

drop policy if exists "responder solicitud" on public.friend_requests;
create policy "responder solicitud"
  on public.friend_requests for update to authenticated
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

drop policy if exists "borrar solicitud" on public.friend_requests;
create policy "borrar solicitud"
  on public.friend_requests for delete to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "ver amistades" on public.friendships;
create policy "ver amistades"
  on public.friendships for select to authenticated
  using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "crear amistad" on public.friendships;
create policy "crear amistad"
  on public.friendships for insert to authenticated
  with check (
    (auth.uid() = user_low or auth.uid() = user_high)
    and exists (
      select 1 from public.friend_requests r
      where r.status = 'accepted'
        and ((r.from_id = user_low and r.to_id = user_high) or (r.from_id = user_high and r.to_id = user_low))
    )
  );

drop policy if exists "romper amistad" on public.friendships;
create policy "romper amistad"
  on public.friendships for delete to authenticated
  using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "ver bloqueos" on public.blocks;
create policy "ver bloqueos"
  on public.blocks for select to authenticated
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

drop policy if exists "bloquear" on public.blocks;
create policy "bloquear"
  on public.blocks for insert to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "desbloquear" on public.blocks;
create policy "desbloquear"
  on public.blocks for delete to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "ver conversaciones" on public.conversations;
create policy "ver conversaciones"
  on public.conversations for select to authenticated
  using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "abrir conversacion" on public.conversations;
create policy "abrir conversacion"
  on public.conversations for insert to authenticated
  with check (
    (auth.uid() = user_low or auth.uid() = user_high)
    and exists (
      select 1 from public.friendships f
      where f.user_low = conversations.user_low and f.user_high = conversations.user_high
    )
  );

drop policy if exists "leer mensajes" on public.messages;
create policy "leer mensajes"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (auth.uid() = c.user_low or auth.uid() = c.user_high)
    )
  );

drop policy if exists "enviar mensaje" on public.messages;
create policy "enviar mensaje"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.user_low or auth.uid() = c.user_high)
        and exists (
          select 1 from public.friendships f
          where f.user_low = c.user_low and f.user_high = c.user_high
        )
    )
  );

drop policy if exists "lecturas propias" on public.message_reads;
create policy "lecturas propias"
  on public.message_reads for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "publicar actividad" on public.activities;
create policy "publicar actividad"
  on public.activities for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "ver actividad de amigos" on public.activities;
create policy "ver actividad de amigos"
  on public.activities for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where (f.user_low = auth.uid() and f.user_high = activities.user_id)
         or (f.user_high = auth.uid() and f.user_low = activities.user_id)
    )
  );

drop policy if exists "ver ligas propias" on public.leagues;
create policy "ver ligas propias"
  on public.leagues for select to authenticated
  using (
    exists (
      select 1 from public.league_members m
      where m.league_id = id and m.user_id = auth.uid()
    )
  );

drop policy if exists "crear liga" on public.leagues;
create policy "crear liga"
  on public.leagues for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "ver miembros" on public.league_members;
create policy "ver miembros"
  on public.league_members for select to authenticated
  using (
    exists (
      select 1 from public.league_members mine
      where mine.league_id = league_members.league_id and mine.user_id = auth.uid()
    )
  );

drop policy if exists "fundar como dueno" on public.league_members;
create policy "fundar como dueno"
  on public.league_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and role = 'owner'
    and exists (select 1 from public.leagues l where l.id = league_id and l.owner_id = auth.uid())
  );

drop policy if exists "ver invitaciones de liga" on public.league_invites;
create policy "ver invitaciones de liga"
  on public.league_invites for select to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "invitar a la liga" on public.league_invites;
create policy "invitar a la liga"
  on public.league_invites for insert to authenticated
  with check (
    auth.uid() = from_id
    and exists (
      select 1 from public.league_members m
      where m.league_id = league_invites.league_id and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.friendships f
      where (f.user_low = auth.uid() and f.user_high = to_id)
         or (f.user_high = auth.uid() and f.user_low = to_id)
    )
  );

drop policy if exists "responder invitacion de liga" on public.league_invites;
create policy "responder invitacion de liga"
  on public.league_invites for update to authenticated
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

drop policy if exists "ver temporadas" on public.seasons;
create policy "ver temporadas"
  on public.seasons for select to authenticated
  using (
    exists (
      select 1 from public.league_members m
      where m.league_id = seasons.league_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "abrir temporada" on public.seasons;
create policy "abrir temporada"
  on public.seasons for insert to authenticated
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists "ver puntuacion" on public.league_scores;
create policy "ver puntuacion"
  on public.league_scores for select to authenticated
  using (
    exists (
      select 1
      from public.seasons s
      join public.league_members m on m.league_id = s.league_id
      where s.id = season_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "anotar puntuacion" on public.league_scores;
create policy "anotar puntuacion"
  on public.league_scores for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.seasons s
      join public.league_members m on m.league_id = s.league_id
      where s.id = season_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "actualizar puntuacion" on public.league_scores;
create policy "actualizar puntuacion"
  on public.league_scores for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.accept_user_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  other uuid;
  low uuid;
  high uuid;
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  select id into other from public.profiles where invite_code = upper(trim(p_code));
  if other is null then
    return null;
  end if;
  if other = uid then
    raise exception 'own code';
  end if;
  if exists (
    select 1 from public.blocks
    where (blocker_id = uid and blocked_id = other) or (blocker_id = other and blocked_id = uid)
  ) then
    raise exception 'blocked';
  end if;
  select least(uid::text, other::text)::uuid, greatest(uid::text, other::text)::uuid into low, high;
  insert into public.friendships (user_low, user_high) values (low, high) on conflict do nothing;
  return other;
end;
$$;

create or replace function public.join_league(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  lid uuid;
  cap integer;
  members integer;
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  select id, max_members into lid, cap from public.leagues where invite_code = upper(trim(p_code));
  if lid is null then
    raise exception 'code not found';
  end if;
  if exists (select 1 from public.league_members where league_id = lid and user_id = uid) then
    return lid;
  end if;
  select count(*) into members from public.league_members where league_id = lid;
  if members >= cap then
    raise exception 'league full';
  end if;
  insert into public.league_members (league_id, user_id, role) values (lid, uid, 'member');
  return lid;
end;
$$;

create or replace function public.accept_league_invite(p_invite uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  lid uuid;
  cap integer;
  members integer;
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  select league_id into lid
  from public.league_invites
  where id = p_invite and to_id = uid and status = 'pending';
  if lid is null then
    raise exception 'invite missing';
  end if;
  if exists (select 1 from public.league_members where league_id = lid and user_id = uid) then
    update public.league_invites set status = 'accepted' where id = p_invite;
    return lid;
  end if;
  select max_members into cap from public.leagues where id = lid;
  select count(*) into members from public.league_members where league_id = lid;
  if members >= cap then
    raise exception 'league full';
  end if;
  insert into public.league_members (league_id, user_id, role) values (lid, uid, 'member');
  update public.league_invites set status = 'accepted' where id = p_invite;
  return lid;
end;
$$;

create or replace function public.roll_league_season(p_league uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  season public.seasons%rowtype;
  start_at timestamptz;
begin
  if uid is null then
    raise exception 'auth required';
  end if;
  if not exists (
    select 1 from public.league_members where league_id = p_league and user_id = uid
  ) then
    raise exception 'not a member';
  end if;
  select * into season
  from public.seasons
  where league_id = p_league and status = 'active'
  order by number desc
  limit 1
  for update;
  if season.id is null or season.ends_at > now() then
    return;
  end if;
  update public.seasons
  set status = 'closed',
      podium = coalesce((
        select jsonb_agg(jsonb_build_object(
          'userId', ranked.user_id,
          'place', ranked.place,
          'points', ranked.points,
          'prize', case ranked.place when 1 then 'oro' when 2 then 'plata' else 'bronce' end
        ) order by ranked.place)
        from (
          select scored.user_id, scored.points, row_number() over (order by scored.points desc) as place
          from (
            select m.user_id, coalesce(sum(s.rapido + s.expediente + s.especial + s.objetivo), 0) as points
            from public.league_members m
            left join public.league_scores s on s.user_id = m.user_id and s.season_id = season.id
            where m.league_id = p_league
            group by m.user_id
          ) scored
          where scored.points > 0
          order by scored.points desc
          limit 3
        ) ranked
      ), '[]'::jsonb)
  where id = season.id;
  start_at := now();
  insert into public.seasons (league_id, number, starts_at, ends_at, status, podium)
  values (p_league, season.number + 1, start_at, start_at + interval '28 days', 'active', '[]'::jsonb);
end;
$$;

revoke all on function public.accept_user_invite(text) from public;
revoke all on function public.join_league(text) from public;
revoke all on function public.accept_league_invite(uuid) from public;
revoke all on function public.roll_league_season(uuid) from public;
grant execute on function public.accept_user_invite(text) to authenticated;
grant execute on function public.join_league(text) to authenticated;
grant execute on function public.accept_league_invite(uuid) to authenticated;
grant execute on function public.roll_league_season(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.messages;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.friend_requests;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.activities;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.league_invites;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.friendships;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  week_key text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  username text not null,
  role text not null check (role in ('analista', 'interrogador', 'forense', 'coordinador')),
  kind text not null check (kind in ('prueba', 'teoria', 'sospechoso', 'hipotesis')),
  body text not null check (char_length(body) between 20 and 280),
  scored boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.community_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  league_id uuid not null references public.leagues (id) on delete cascade,
  chapter integer not null check (chapter between 1 and 4),
  updated_at timestamptz not null default now(),
  primary key (user_id, league_id)
);

create table if not exists public.generated_cases (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wardrobes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  owned text[] not null default '{}',
  frame text not null default '',
  background text not null default '',
  card text not null default 'tarjeta-clasica',
  theme text not null default 'tema-noche'
);

alter table public.community_posts enable row level security;
alter table public.community_progress enable row level security;
alter table public.generated_cases enable row level security;
alter table public.wardrobes enable row level security;

grant select, insert on public.community_posts to authenticated;
grant select, insert, update on public.community_progress to authenticated;
grant select, insert, update on public.generated_cases to authenticated;
grant select, insert, update on public.wardrobes to authenticated;

drop policy if exists "leer tablon de la liga" on public.community_posts;
create policy "leer tablon de la liga"
  on public.community_posts for select to authenticated
  using (
    exists (
      select 1 from public.league_members m
      where m.league_id = community_posts.league_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "publicar en el tablon" on public.community_posts;
create policy "publicar en el tablon"
  on public.community_posts for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.league_members m
      where m.league_id = community_posts.league_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "progreso del expediente" on public.community_progress;
create policy "progreso del expediente"
  on public.community_progress for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "casos generados propios" on public.generated_cases;
create policy "casos generados propios"
  on public.generated_cases for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "vestuario propio" on public.wardrobes;
create policy "vestuario propio"
  on public.wardrobes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.wardrobes add column if not exists title text not null default '';

create table if not exists public.progress_states (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.league_identities (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  universe text not null default 'league-studios',
  apps text[] not null default '{mysteryleague}',
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.progress_states enable row level security;
alter table public.league_identities enable row level security;

grant select, insert, update on public.progress_states to authenticated;
grant select, insert, update on public.league_identities to authenticated;

drop policy if exists "progreso propio" on public.progress_states;
create policy "progreso propio"
  on public.progress_states for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "identidad propia" on public.league_identities;
create policy "identidad propia"
  on public.league_identities for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
