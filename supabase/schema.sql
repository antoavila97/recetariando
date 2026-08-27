-- =====================================================
-- RECETARIANDO — Base de datos en Supabase (PostgreSQL)
-- -----------------------------------------------------
-- COMO USAR:
--   1. Abre https://supabase.com → tu proyecto
--   2. Ve a SQL Editor → New query
--   3. Pega TODO este archivo y ejecuta
--   4. Ejecuta despues seed_demo.sql para las recetas demo
-- Se puede volver a ejecutar (es idempotente).
-- =====================================================

create extension if not exists pg_trgm;

-- ============ TABLAS ============

-- Recetas (catalogo principal)
create table if not exists public.recetas (
    id bigint generated always as identity primary key,
    spoonacular_id bigint unique,
    titulo text not null,
    imagen_url text,
    resumen text,
    instrucciones text,
    tiempo_preparacion int,          -- minutos
    tiempo_coccion int,              -- minutos
    porciones int default 1,
    calificacion numeric(3,2),
    fuente_url text,
    vegano boolean default false,
    vegetariano boolean default false,
    sin_gluten boolean default false,
    sin_lactosa boolean default false,
    saludable boolean default false,
    barato boolean default false,
    muy_popular boolean default false,
    creado_en timestamptz default now(),
    actualizado_en timestamptz default now()
);

-- Ingredientes (catalogo independiente)
create table if not exists public.ingredientes (
    id bigint generated always as identity primary key,
    spoonacular_id bigint unique,
    nombre text not null unique,
    imagen_url text,
    categoria text
);

-- Relacion receta <-> ingredientes
create table if not exists public.receta_ingredientes (
    id bigint generated always as identity primary key,
    receta_id bigint not null references public.recetas(id) on delete cascade,
    ingrediente_id bigint not null references public.ingredientes(id) on delete cascade,
    cantidad text,
    unidad text,
    unique (receta_id, ingrediente_id)
);

-- Tipos de dieta / restricciones
create table if not exists public.tipos_dieta (
    id bigint generated always as identity primary key,
    nombre text unique not null,
    descripcion text
);

insert into public.tipos_dieta (nombre, descripcion) values
('vegano', 'Sin productos de origen animal'),
('vegetariano', 'Sin carne ni pescado'),
('sin_gluten', 'Sin trigo, cebada, centeno'),
('sin_lactosa', 'Sin lacteos'),
('paleo', 'Basada en alimentos naturales'),
('keto', 'Alta en grasas, baja en carbohidratos'),
('pescetariana', 'Incluye pescado pero no carne'),
('primal', 'Similar a paleo, menos restrictiva')
on conflict (nombre) do nothing;

-- Informacion nutricional por receta
create table if not exists public.nutricion (
    id bigint generated always as identity primary key,
    receta_id bigint not null unique references public.recetas(id) on delete cascade,
    calorias numeric,
    proteinas numeric,
    carbohidratos numeric,
    grasa numeric,
    fibra numeric
);

-- Favoritos de usuarios (usa la autenticacion de Supabase)
create table if not exists public.favoritos (
    id bigint generated always as identity primary key,
    usuario_id uuid not null references auth.users(id) on delete cascade,
    receta_id bigint not null references public.recetas(id) on delete cascade,
    guardado_en timestamptz default now(),
    unique (usuario_id, receta_id)
);

-- ============ INDICES ============

create index if not exists recetas_calificacion_idx on public.recetas (calificacion desc);
create index if not exists recetas_inicio_idx on public.recetas (id desc);
create index if not exists recetas_busqueda_idx on public.recetas using gin (titulo gin_trgm_ops, resumen gin_trgm_ops);
create index if not exists ingredientes_busqueda_idx on public.ingredientes using gin (nombre gin_trgm_ops);
create index if not exists receta_ingredientes_receta_idx on public.receta_ingredientes (receta_id);
create index if not exists favoritos_usuario_idx on public.favoritos (usuario_id);

-- ============ TRIGGER: actualizado_en ============

create or replace function public.actualizar_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$;

drop trigger if exists trg_recetas_actualizado on public.recetas;
create trigger trg_recetas_actualizado
before update on public.recetas
for each row execute function public.actualizar_timestamp();

-- ============ SEGURIDAD (RLS) ============

alter table public.recetas enable row level security;
alter table public.ingredientes enable row level security;
alter table public.receta_ingredientes enable row level security;
alter table public.nutricion enable row level security;
alter table public.tipos_dieta enable row level security;
alter table public.favoritos enable row level security;

-- Catalogo: lectura publica para todos
drop policy if exists recetas_lectura_publica on public.recetas;
create policy recetas_lectura_publica on public.recetas for select using (true);

drop policy if exists ingredientes_lectura_publica on public.ingredientes;
create policy ingredientes_lectura_publica on public.ingredientes for select using (true);

drop policy if exists receta_ingredientes_lectura_publica on public.receta_ingredientes;
create policy receta_ingredientes_lectura_publica on public.receta_ingredientes for select using (true);

drop policy if exists nutricion_lectura_publica on public.nutricion;
create policy nutricion_lectura_publica on public.nutricion for select using (true);

drop policy if exists tipos_dieta_lectura_publica on public.tipos_dieta;
create policy tipos_dieta_lectura_publica on public.tipos_dieta for select using (true);

-- Favoritos: cada usuario solo maneja los suyos
drop policy if exists favoritos_lectura_propia on public.favoritos;
create policy favoritos_lectura_propia on public.favoritos for select using (auth.uid() = usuario_id);

drop policy if exists favoritos_crear_propio on public.favoritos;
create policy favoritos_crear_propio on public.favoritos for insert with check (auth.uid() = usuario_id);

drop policy if exists favoritos_borrar_propio on public.favoritos;
create policy favoritos_borrar_propio on public.favoritos for delete using (auth.uid() = usuario_id);

-- Permisos para los roles del API (anon/authenticated)
grant usage on schema public to anon, authenticated;
grant select on table public.recetas to anon, authenticated;
grant select on table public.ingredientes to anon, authenticated;
grant select on table public.receta_ingredientes to anon, authenticated;
grant select on table public.nutricion to anon, authenticated;
grant select on table public.tipos_dieta to anon, authenticated;
grant select, insert, delete on table public.favoritos to authenticated;

-- =====================================================
-- FUNCION buscar_recetas
-- Equivalente a api/buscar.php del documento original:
-- busqueda por texto, filtros de dieta, tiempo, calorias
-- e "ingredientes que debe contener TODOS".
-- Devuelve { total, pagina, limite, recetas[] }
-- =====================================================

create or replace function public.buscar_recetas(
    p_q text default '',
    p_ingredientes text[] default null,
    p_vegano boolean default null,
    p_vegetariano boolean default null,
    p_sin_gluten boolean default null,
    p_sin_lactosa boolean default null,
    p_tiempo_max int default null,
    p_calorias_max numeric default null,
    p_pagina int default 1,
    p_limite int default 20
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_where text[] := '{}';
    v_sql text;
    v_total bigint;
    v_recetas jsonb;
begin
    p_pagina := greatest(1, p_pagina);
    p_limite := least(50, greatest(1, p_limite));

    -- Busqueda por texto
    if btrim(coalesce(p_q, '')) <> '' then
        v_where := array_append(v_where, format(
            '(r.titulo ilike %L or r.resumen ilike %L)',
            '%' || p_q || '%', '%' || p_q || '%'
        ));
    end if;

    -- Filtros de dieta
    if p_vegano is not null then
        v_where := array_append(v_where, format('r.vegano = %L', p_vegano));
    end if;
    if p_vegetariano is not null then
        v_where := array_append(v_where, format('r.vegetariano = %L', p_vegetariano));
    end if;
    if p_sin_gluten is not null then
        v_where := array_append(v_where, format('r.sin_gluten = %L', p_sin_gluten));
    end if;
    if p_sin_lactosa is not null then
        v_where := array_append(v_where, format('r.sin_lactosa = %L', p_sin_lactosa));
    end if;

    -- Tiempo maximo (preparacion + coccion)
    if p_tiempo_max is not null then
        v_where := array_append(v_where, format(
            '(coalesce(r.tiempo_preparacion, 0) + coalesce(r.tiempo_coccion, 0)) <= %L',
            p_tiempo_max
        ));
    end if;

    -- Calorias maximas
    if p_calorias_max is not null then
        v_where := array_append(v_where, format(
            'coalesce((select n.calorias from public.nutricion n where n.receta_id = r.id), 1e9) <= %L',
            p_calorias_max
        ));
    end if;

    -- Ingredientes: la receta debe contener TODOS los indicados
    if p_ingredientes is not null and array_length(p_ingredientes, 1) > 0 then
        v_where := array_append(v_where, format(
            'r.id in (
                select ri.receta_id
                from public.receta_ingredientes ri
                join public.ingredientes i on i.id = ri.ingrediente_id
                where i.nombre = any(%L::text[])
                group by ri.receta_id
                having count(distinct i.nombre) = %L
            )',
            p_ingredientes,
            array_length(p_ingredientes, 1)
        ));
    end if;

    -- Conteo total
    v_sql := 'select count(*)::bigint from public.recetas r';
    if array_length(v_where, 1) > 0 then
        v_sql := v_sql || ' where ' || array_to_string(v_where, ' and ');
    end if;
    execute v_sql into v_total;

    -- Resultados con paginacion
    v_sql := 'select coalesce(jsonb_agg(t order by t.calificacion desc nulls last, t.id desc), ''[]''::jsonb)
              from (
                  select r.id, r.spoonacular_id, r.titulo, r.imagen_url, r.resumen,
                         r.tiempo_preparacion, r.tiempo_coccion, r.porciones, r.calificacion,
                         r.vegano, r.vegetariano, r.sin_gluten, r.sin_lactosa,
                         (select n.calorias from public.nutricion n where n.receta_id = r.id) as calorias
                  from public.recetas r';
    if array_length(v_where, 1) > 0 then
        v_sql := v_sql || ' where ' || array_to_string(v_where, ' and ');
    end if;
    v_sql := v_sql || format(
        ' order by r.calificacion desc nulls last, r.id desc limit %L offset %L
              ) t',
        p_limite,
        (p_pagina - 1) * p_limite
    );
    execute v_sql into v_recetas;

    return jsonb_build_object(
        'total', v_total,
        'pagina', p_pagina,
        'limite', p_limite,
        'recetas', coalesce(v_recetas, '[]'::jsonb)
    );
end;
$$;

grant execute on function public.buscar_recetas(text, text[], boolean, boolean, boolean, boolean, int, numeric, int, int) to anon, authenticated;

-- =====================================================
-- FIN DE schema.sql
-- =====================================================