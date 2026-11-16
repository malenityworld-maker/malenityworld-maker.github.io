-- =====================================================================
-- Malenity OS · Esquema de la base de datos (Supabase / Postgres)
-- Se pega UNA vez en Supabase → SQL Editor → Run.
-- Crea las tablas, los permisos por persona (RLS), las reglas
-- automáticas (4 rojos, registro de quién hizo qué) y nada de datos.
-- Los datos iniciales están en 02_datos_iniciales.sql.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

-- Personas del equipo = el "Accountability Chart" + los usuarios.
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  puesto text,                         -- ej. "Dueña", "Asistente Malenity Shop"
  responsabilidades text,              -- qué hace este puesto
  email text,                          -- con este mail se crea la cuenta (invitación)
  usuario_id uuid unique,              -- se completa solo cuando la persona entra por primera vez
  rol text not null default 'equipo' check (rol in ('admin','equipo')),
  ve_plata boolean not null default false, -- si es true, ve ganancia neta y fondos
  estado text not null default 'activa' check (estado in ('activa','a_contratar','inactiva')),
  orden int not null default 0,
  creado_en timestamptz not null default now()
);
create unique index if not exists personas_email_unico on public.personas (lower(email)) where email is not null;

-- Áreas = negocios (y "Vida y otras áreas").
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  que_vende text,
  para_que text,
  color text not null default '#B5423C',
  orden int not null default 0,
  activa boolean not null default true
);

-- Visión: una sola fila.
create table if not exists public.vision (
  id int primary key default 1 check (id = 1),
  meta_mensual text,
  meta_1_anio text,
  meta_3_anios text,
  mindset text,
  actualizado_en timestamptz not null default now()
);

-- Ideas y problemas: todo lo que no entra en el trimestre.
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text,
  tipo text not null default 'idea' check (tipo in ('idea','problema')),
  area_id uuid references public.areas(id) on delete set null,
  para_cuando text,                    -- ej. "2027-T2"
  estado text not null default 'espera' check (estado in ('espera','en_roca','descartada','resuelta')),
  veces_devuelta int not null default 0,
  creada_por uuid references public.personas(id) on delete set null,
  creada_en timestamptz not null default now()
);

-- Rocas: prioridades de 90 días.
create table if not exists public.rocas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  se_cumple_si text not null,          -- la medida de éxito
  por_que text,                        -- el por qué del deadline
  responsable_id uuid references public.personas(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  trimestre text not null,             -- ej. "2027-T1"
  inicio date,
  deadline date,
  estado text not null default 'activa' check (estado in ('activa','cumplida','devuelta','cancelada')),
  idea_id uuid references public.ideas(id) on delete set null,
  orden int not null default 0,
  creada_en timestamptz not null default now()
);

-- Semáforo semanal de cada roca (semana = lunes de esa semana).
create table if not exists public.roca_semanas (
  id uuid primary key default gen_random_uuid(),
  roca_id uuid not null references public.rocas(id) on delete cascade,
  semana date not null,
  color text not null check (color in ('verde','rojo')),
  nota text,
  marcada_en timestamptz not null default now(),
  unique (roca_id, semana)
);

-- Scorecard: los números de la semana.
create table if not exists public.metricas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  meta numeric,                        -- vacío = sin meta
  sentido text not null default 'mayor' check (sentido in ('mayor','menor')),
  unidad text,                         -- ej. "USD", "mochilas"
  para_que text,
  responsable_id uuid references public.personas(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  es_plata boolean not null default false, -- true = solo admin o quien tenga "ve plata"
  fuente text not null default 'manual' check (fuente in ('manual','meta_ads')),
  orden int not null default 0,
  activa boolean not null default true
);

create table if not exists public.valores (
  id uuid primary key default gen_random_uuid(),
  metrica_id uuid not null references public.metricas(id) on delete cascade,
  semana date not null,
  valor numeric not null,
  fuente text not null default 'manual' check (fuente in ('manual','meta_ads')),
  corregido boolean not null default false,
  cargado_por uuid references public.personas(id) on delete set null,
  cargado_en timestamptz not null default now(),
  unique (metrica_id, semana)
);

-- Fondos (barras de avance), calculados a partir de un número del scorecard.
create table if not exists public.fondos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  metrica_id uuid references public.metricas(id) on delete set null,
  calculo text not null check (calculo in ('suma_anio','suma_mes','ultimo')),
  anio int,                            -- para suma_anio
  meta numeric,
  unidad text,
  para_que text,
  orden int not null default 0
);

-- Tareas.
create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text,
  responsable_id uuid references public.personas(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  roca_id uuid references public.rocas(id) on delete set null,
  fecha date,                          -- opcional
  bloque text,                         -- bloque de trabajo: Mañana / Tarde / Noche / Semana
  hecha boolean not null default false,
  hecha_en timestamptz,
  origen text not null default 'manual' check (origen in ('manual','automatica')),
  regla text,                          -- Fase 2: regla de Meta que la disparó
  disparador text,                     -- Fase 2: el número que la disparó
  creada_por uuid references public.personas(id) on delete set null,
  creada_en timestamptz not null default now()
);
create index if not exists tareas_resp_fecha on public.tareas (responsable_id, fecha);

-- Registro: quién hizo qué y cuándo.
create table if not exists public.registro (
  id bigint generated always as identity primary key,
  cuando timestamptz not null default now(),
  persona_id uuid,
  persona_nombre text,
  tabla text not null,
  accion text not null,
  descripcion text
);
create index if not exists registro_cuando on public.registro (cuando desc);

-- ---------------------------------------------------------------------
-- Funciones de permisos
-- ---------------------------------------------------------------------
create or replace function public.mi_persona() returns uuid
language sql stable security definer set search_path = public as $$
  select id from personas where usuario_id = auth.uid() and estado <> 'inactiva' limit 1
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from personas where usuario_id = auth.uid() and rol = 'admin' and estado <> 'inactiva')
$$;

create or replace function public.ve_plata() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from personas where usuario_id = auth.uid() and estado <> 'inactiva'
                 and (rol = 'admin' or ve_plata))
$$;

create or replace function public.es_miembro() returns boolean
language sql stable security definer set search_path = public as $$
  select public.mi_persona() is not null
$$;

-- Se llama al entrar. Vincula la cuenta con su persona:
--  · si todavía no hay ninguna administradora con cuenta, la primera
--    persona que entra queda como administradora (Malena);
--  · si no, busca una persona invitada con el mismo mail.
create or replace function public.vincular_usuario() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_id uuid;
begin
  if v_uid is null then return null; end if;
  select id into v_id from personas where usuario_id = v_uid;
  if v_id is not null then return v_id; end if;

  if not exists (select 1 from personas where rol = 'admin' and usuario_id is not null) then
    update personas set usuario_id = v_uid, email = coalesce(email, v_mail)
     where id = (select id from personas where rol = 'admin' and usuario_id is null order by orden limit 1)
     returning id into v_id;
  end if;

  if v_id is null and v_mail <> '' then
    update personas set usuario_id = v_uid, estado = case when estado = 'a_contratar' then 'activa' else estado end
     where lower(email) = v_mail and usuario_id is null and estado <> 'inactiva'
     returning id into v_id;
  end if;

  if v_id is not null then
    insert into registro (persona_id, persona_nombre, tabla, accion, descripcion)
    select id, nombre, 'personas', 'entró por primera vez', v_mail from personas where id = v_id;
  end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- Reglas automáticas
-- ---------------------------------------------------------------------

-- El equipo solo puede tildar/destildar tareas (no cambiar otra cosa).
create or replace function public.tareas_antes_de_guardar() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_hecha boolean;
begin
  if tg_op = 'UPDATE' and auth.uid() is not null and not public.es_admin() then
    v_hecha := new.hecha;
    new := old;
    new.hecha := v_hecha;
  end if;
  if tg_op = 'INSERT' and new.creada_por is null then
    new.creada_por := public.mi_persona();
  end if;
  if new.hecha and (tg_op = 'INSERT' or not old.hecha) then
    new.hecha_en := now();
  elsif not new.hecha then
    new.hecha_en := null;
  end if;
  return new;
end $$;
drop trigger if exists t_tareas_guardar on public.tareas;
create trigger t_tareas_guardar before insert or update on public.tareas
  for each row execute function public.tareas_antes_de_guardar();

-- Si alguien del equipo corrige un número, no puede cambiar de qué número es.
create or replace function public.valores_antes_de_guardar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.cargado_por is null then new.cargado_por := public.mi_persona(); end if;
  if tg_op = 'UPDATE' then
    new.metrica_id := old.metrica_id;
    new.semana := old.semana;
    new.cargado_por := coalesce(public.mi_persona(), new.cargado_por);
    new.cargado_en := now();
    -- un dato que vino de Meta y lo cambia una persona queda como "corregido"
    if old.fuente = 'meta_ads' and auth.uid() is not null and new.valor is distinct from old.valor then
      new.corregido := true;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_valores_guardar on public.valores;
create trigger t_valores_guardar before insert or update on public.valores
  for each row execute function public.valores_antes_de_guardar();

-- Ideas: quien la carga queda como autora.
create or replace function public.ideas_antes_de_guardar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.creada_por is null then new.creada_por := public.mi_persona(); end if;
  return new;
end $$;
drop trigger if exists t_ideas_guardar on public.ideas;
create trigger t_ideas_guardar before insert on public.ideas
  for each row execute function public.ideas_antes_de_guardar();

-- Regla de los 4 rojos: al 4.º rojo la roca sale de las prioridades y vuelve a Ideas.
create or replace function public.regla_cuatro_rojos() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_rojos int;
  r record;
  v_idea uuid;
begin
  select count(*) into v_rojos from roca_semanas where roca_id = new.roca_id and color = 'rojo';
  select * into r from rocas where id = new.roca_id;
  if v_rojos >= 4 and r.estado = 'activa' then
    if r.idea_id is not null and exists (select 1 from ideas where id = r.idea_id) then
      update ideas set estado = 'espera', veces_devuelta = veces_devuelta + 1,
             detalle = coalesce(detalle,'') || E'\n\nVolvió de las rocas (' || r.trimestre || ') por 4 rojos.'
       where id = r.idea_id;
      v_idea := r.idea_id;
    else
      insert into ideas (titulo, detalle, area_id, estado, veces_devuelta, creada_por)
      values (r.titulo,
              'Se cumplía si: ' || r.se_cumple_si || coalesce(E'\nPor qué: ' || r.por_que, '') ||
              E'\n\nVolvió de las rocas (' || r.trimestre || ') por 4 rojos.',
              r.area_id, 'espera', 1, r.responsable_id)
      returning id into v_idea;
    end if;
    update rocas set estado = 'devuelta', idea_id = v_idea where id = r.id;
    insert into registro (persona_id, persona_nombre, tabla, accion, descripcion)
    values (null, 'Sistema', 'rocas', 'volvió a Ideas (4 rojos)', r.titulo);
  end if;
  return new;
end $$;
drop trigger if exists t_cuatro_rojos on public.roca_semanas;
create trigger t_cuatro_rojos after insert or update on public.roca_semanas
  for each row execute function public.regla_cuatro_rojos();

-- Registro de cambios.
create or replace function public.registrar_cambio() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  v_pid uuid := public.mi_persona();
  v_nombre text;
  v_accion text := case tg_op when 'INSERT' then 'creó' when 'UPDATE' then 'editó' else 'borró' end;
  v_desc text;
begin
  -- vincular la cuenta ya queda registrado como "entró por primera vez"
  if tg_table_name = 'personas' and tg_op = 'UPDATE'
     and (v_row ->> 'usuario_id') is distinct from (v_old ->> 'usuario_id') then
    return null;
  end if;
  select nombre into v_nombre from personas where id = v_pid;
  if v_pid is null then v_nombre := 'Sistema'; end if;

  if tg_table_name = 'tareas' and tg_op = 'UPDATE'
     and (v_row ->> 'hecha') is distinct from (v_old ->> 'hecha') then
    v_accion := case when (v_row ->> 'hecha')::boolean then 'completó' else 'reabrió' end;
  end if;

  v_desc := case tg_table_name
    when 'valores' then (select nombre from metricas where id = (v_row ->> 'metrica_id')::uuid)
                        || ' · semana ' || (v_row ->> 'semana') || ' = ' || (v_row ->> 'valor')
    when 'roca_semanas' then (select titulo from rocas where id = (v_row ->> 'roca_id')::uuid)
                        || ' · semana ' || (v_row ->> 'semana') || ' → ' || (v_row ->> 'color')
    when 'vision' then 'Visión'
    else coalesce(v_row ->> 'titulo', v_row ->> 'nombre', '')
  end;

  insert into registro (persona_id, persona_nombre, tabla, accion, descripcion)
  values (v_pid, v_nombre, tg_table_name, v_accion, v_desc);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['personas','areas','vision','ideas','rocas','roca_semanas','metricas','valores','fondos','tareas'] loop
    execute format('drop trigger if exists t_registro on public.%I', t);
    execute format('create trigger t_registro after insert or update or delete on public.%I
                    for each row execute function public.registrar_cambio()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Permisos por fila (RLS)
-- ---------------------------------------------------------------------
alter table public.personas     enable row level security;
alter table public.areas        enable row level security;
alter table public.vision       enable row level security;
alter table public.ideas        enable row level security;
alter table public.rocas        enable row level security;
alter table public.roca_semanas enable row level security;
alter table public.metricas     enable row level security;
alter table public.valores      enable row level security;
alter table public.fondos       enable row level security;
alter table public.tareas       enable row level security;
alter table public.registro     enable row level security;

-- Borro políticas anteriores (para poder volver a correr este archivo).
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Lectura general del equipo
create policy leer on public.personas     for select using (public.es_miembro());
create policy leer on public.areas        for select using (public.es_miembro());
create policy leer on public.vision       for select using (public.es_miembro());
create policy leer on public.ideas        for select using (public.es_miembro());
create policy leer on public.rocas        for select using (public.es_miembro());
create policy leer on public.roca_semanas for select using (public.es_miembro());

-- La plata: solo admin o quien tenga "ve plata"
create policy leer on public.metricas for select
  using (public.es_miembro() and (not es_plata or public.ve_plata()));
create policy leer on public.valores for select
  using (exists (select 1 from metricas m where m.id = metrica_id
                 and public.es_miembro() and (not m.es_plata or public.ve_plata())));
create policy leer on public.fondos for select using (public.ve_plata());

-- Tareas: cada persona ve las suyas; la admin ve todas
create policy leer on public.tareas for select
  using (public.es_admin() or responsable_id = public.mi_persona());

-- Registro: solo la admin
create policy leer on public.registro for select using (public.es_admin());

-- Escritura: la admin puede todo
create policy admin_todo on public.personas     for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.areas        for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.vision       for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.ideas        for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.rocas        for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.roca_semanas for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.metricas     for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.valores      for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.fondos       for all using (public.es_admin()) with check (public.es_admin());
create policy admin_todo on public.tareas       for all using (public.es_admin()) with check (public.es_admin());

-- Equipo: sumar ideas
create policy equipo_suma_ideas on public.ideas for insert
  with check (public.es_miembro());

-- Equipo: tildar sus tareas (el trigger impide cambiar otra cosa)
create policy equipo_tilda on public.tareas for update
  using (responsable_id = public.mi_persona())
  with check (responsable_id = public.mi_persona());

-- Equipo: cargar los números de los que es responsable
create policy equipo_carga_numeros on public.valores for insert
  with check (exists (select 1 from metricas m where m.id = metrica_id
                      and m.responsable_id = public.mi_persona()
                      and (not m.es_plata or public.ve_plata())));
create policy equipo_corrige_numeros on public.valores for update
  using (exists (select 1 from metricas m where m.id = metrica_id
                 and m.responsable_id = public.mi_persona()
                 and (not m.es_plata or public.ve_plata())));

-- Equipo: marcar verde/rojo las rocas de las que es responsable
create policy equipo_marca_rocas on public.roca_semanas for insert
  with check (exists (select 1 from rocas r where r.id = roca_id and r.responsable_id = public.mi_persona()));
create policy equipo_remarca_rocas on public.roca_semanas for update
  using (exists (select 1 from rocas r where r.id = roca_id and r.responsable_id = public.mi_persona()));

-- Permisos básicos de Supabase
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.vincular_usuario() to authenticated;
revoke all on all tables in schema public from anon;
