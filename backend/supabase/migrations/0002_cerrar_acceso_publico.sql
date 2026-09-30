-- ============================================================
--  ONP FER — 0002 · cerrar el acceso público
--
--  ============ OPCIONAL. LA DECIDE EL DUEÑO. =================
--
--  ROMPE LA APP ORIGINAL DE UN SOLO ARCHIVO
--  (`../ONP/onp_fer_etapa2_pf.html`). Esa app habla directo con
--  Supabase usando la llave pública desde el navegador y depende
--  de las políticas abiertas que esta migración quita. Después de
--  correr esto, deja de poder subir archivos y de poder leer
--  expedientes. Córrela cuando la app original ya no se use.
--
--  NO ES REQUISITO PARA QUE NUESTRO WORKER FUNCIONE. El Worker
--  entra con la llave secreta (`service_role`), que **esquiva
--  RLS**: funciona igual antes y después. Esto no es para
--  desbloquearnos.
--
--  ¿Entonces para qué? Para tapar el agujero de lectura.
--  `arreglo_permisos_final.sql` da `select to public` sobre todo
--  el bucket `expedientes` y `insert with check (true)` en cinco
--  tablas. Con la llave pública —que viaja al navegador en la app
--  original— eso alcanza para leer la INE, la firma, el domicilio
--  y el ingreso de cualquier solicitante. No es una hipótesis: es
--  lo que esas políticas dicen.
--
--  Aquella migración se escribió para desbloquear a un cliente de
--  navegador. Nuestros tres proyectos no tienen ninguno: ni
--  `web-app/` ni `superadmin-app/` conocen la URL ni ninguna
--  llave de Supabase (01-conventions.md §1).
--
--  Idempotente: se puede correr dos veces.
-- ============================================================

-- ------------------------------------------------------------
--  PASO 1 — RLS encendido y forzado
--
--  Forzado también para el dueño de la tabla, para que un rol con
--  `bypassrls` no sea el descuido que deje la puerta abierta. La
--  llave secreta sigue pasando: `service_role` es distinto.
-- ------------------------------------------------------------
do $$
declare
    t text;
    tablas constant text[] := array[
        'expedientes', 'propietarios_reales', 'archivos', 'documentos',
        'usuarios_panel', 'otp_codigos', 'producto'
    ];
begin
    foreach t in array tablas loop
        if exists (select 1 from information_schema.tables
                   where table_schema = 'public' and table_name = t) then
            execute format('alter table public.%I enable row level security', t);
            execute format('alter table public.%I force  row level security', t);
        end if;
    end loop;
end $$;

-- ------------------------------------------------------------
--  PASO 2 — Quitar las políticas abiertas
--
--  Sin política, RLS niega. No se sustituyen por otras más
--  estrechas porque no hay a quién dárselas: el único cliente
--  legítimo esquiva RLS por diseño.
-- ------------------------------------------------------------
do $$
declare p record;
begin
    for p in
        select tablename, policyname
        from pg_policies
        where schemaname = 'public'
          and tablename in ('expedientes','propietarios_reales','archivos',
                            'documentos','usuarios_panel',
                            'otp_codigos','producto','plantillas','bitacora')
    loop
        execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
    end loop;
end $$;

-- ------------------------------------------------------------
--  PASO 3 — El bucket
--
--  Se pone privado y se le quitan las políticas. La interfaz de
--  Supabase genera duplicados con nombres raros
--  ("subir expedientes 1abc2de_0"), así que se barren por prefijo
--  además de por nombre exacto.
-- ------------------------------------------------------------
update storage.buckets set public = false where id = 'expedientes';

do $$
declare p record;
begin
    for p in select policyname from pg_policies
             where schemaname = 'storage' and tablename = 'objects'
    loop
        execute format('drop policy if exists %I on storage.objects', p.policyname);
    end loop;

    if exists (select 1 from information_schema.tables
               where table_schema = 'storage' and table_name = 'prefixes') then
        for p in select policyname from pg_policies
                 where schemaname = 'storage' and tablename = 'prefixes'
        loop
            execute format('drop policy if exists %I on storage.prefixes', p.policyname);
        end loop;
    end if;
end $$;

-- ------------------------------------------------------------
--  PASO 4 — Revocar los GRANT
--
--  RLS solo filtra renglones; los GRANT siguen por debajo. Se
--  revocan para que la llave pública no tenga ni por dónde
--  intentarlo.
--
--  `service_role` no aparece aquí y no debe: es la identidad del
--  Worker.
-- ------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- ------------------------------------------------------------
--  PASO 5 — Comprobación. Los tres primeros deben ser 0.
-- ------------------------------------------------------------
select 'Políticas en public (deben ser 0)' as revision,
       count(*)::text as resultado
from pg_policies where schemaname = 'public'

union all

select 'Políticas del bucket (deben ser 0)',
       count(*)::text
from pg_policies where schemaname = 'storage' and tablename = 'objects'

union all

select 'Permisos de anon/authenticated en public (deben ser 0)',
       count(*)::text
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon','authenticated')

union all

select 'Bucket expedientes privado',
       case when exists (select 1 from storage.buckets
                         where id = 'expedientes' and public = false)
            then 'ok' else 'FALTA' end;
