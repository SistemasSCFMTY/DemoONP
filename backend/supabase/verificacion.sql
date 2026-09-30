-- ============================================================
--  ONP FER — verificación
--
--  SOLO LEE. No crea, no altera, no borra. Se puede correr en
--  cualquier momento y contra cualquier proyecto.
--
--  Corre esto ANTES que nada. Dice si la base contra la que
--  apuntas es la que el Worker espera. Si algo sale FALTA, no
--  sigas: el error que verías después sería un 500 sin pistas.
--
--  Supabase → SQL Editor → New query → pegar → Run.
-- ============================================================

-- ------------------------------------------------------------
--  Las tablas
--
--  Las nueve primeras ya existían en el proyecto reusado. Las
--  tres últimas las crea `migrations/0001_tablas_nuevas.sql`.
-- ------------------------------------------------------------
select 'tabla: ' || t.nombre as revision,
       case when exists (select 1 from information_schema.tables
                         where table_schema = 'public' and table_name = t.nombre)
            then 'ok' else 'FALTA' end as resultado
from (values
    ('sofoms'), ('usuarios_panel'), ('expedientes'), ('propietarios_reales'),
    ('archivos'), ('documentos'), ('historial_estados'), ('plantillas'), ('bitacora'),
    ('prospectos'), ('otp_codigos'), ('producto')
) as t(nombre)

union all

-- ------------------------------------------------------------
--  Los tres ENUM
--
--  Esto es lo que más caro sale equivocar: un valor que no está
--  en el enum no da un error de validación, da un 500 del insert
--  a medio envío.
--
--  `estado_expediente` tiene `revision`, NO `en_revision` — el
--  contrato decía lo segundo y se corrigió.
--  `tipo_archivo` NO tiene `doc_curp` ni ninguno de los `doc_*`
--  del contrato; el Worker los traduce (src/schemas/comunes.ts).
-- ------------------------------------------------------------
select 'enum estado_expediente',
       coalesce(string_agg(e.enumlabel, ' | ' order by e.enumsortorder), 'FALTA')
from pg_type t left join pg_enum e on e.enumtypid = t.oid
where t.typname = 'estado_expediente'

union all

select 'enum tipo_archivo',
       coalesce(string_agg(e.enumlabel, ' | ' order by e.enumsortorder), 'FALTA')
from pg_type t left join pg_enum e on e.enumtypid = t.oid
where t.typname = 'tipo_archivo'

union all

select 'enum rol_usuario',
       coalesce(string_agg(e.enumlabel, ' | ' order by e.enumsortorder), 'FALTA')
from pg_type t left join pg_enum e on e.enumtypid = t.oid
where t.typname = 'rol_usuario'

union all

-- ------------------------------------------------------------
--  El bucket
-- ------------------------------------------------------------
select 'bucket expedientes',
       coalesce((select case when public then 'existe — PÚBLICO' else 'existe — privado' end
                 from storage.buckets where id = 'expedientes'), 'FALTA')

union all

-- ------------------------------------------------------------
--  DEMO_SOFOM_ID
--
--  `expedientes.sofom_id` es NOT NULL con llave foránea, así que
--  sin este secreto **ningún envío funciona**. Este es su valor.
-- ------------------------------------------------------------
select 'DEMO_SOFOM_ID',
       coalesce((select id::text from public.sofoms where activa is true
                 order by creado_en limit 1),
                'FALTA — no hay SOFOM activa')

union all

-- ------------------------------------------------------------
--  El usuario del panel
--
--  La contraseña NO está aquí: vive en Supabase Auth
--  (`auth.users`). Esta tabla es solo el perfil. El correo tiene
--  que coincidir exactamente con el del usuario de Auth, y
--  `activo` tiene que ser true.
-- ------------------------------------------------------------
select 'usuarios_panel activos',
       coalesce(string_agg(correo || ' (' || rol || ')', ', '), 'NINGUNO — el panel no abrirá')
from public.usuarios_panel where activo is true

union all

-- ------------------------------------------------------------
--  El renglón de producto (CP-B9)
-- ------------------------------------------------------------
select 'producto',
       case when exists (select 1 from information_schema.tables
                         where table_schema = 'public' and table_name = 'producto')
            then coalesce((select 'ok — tasa ' || tasa_anual || '%'
                           from public.producto where id = 1), 'tabla vacía — corre seed.sql')
            else 'FALTA la tabla — corre 0001_tablas_nuevas.sql' end

union all

-- ------------------------------------------------------------
--  Estado del acceso público
--
--  Cuenta las políticas que `arreglo_permisos_final.sql` dejó.
--  Mientras sean > 0, cualquiera con la llave publicable puede
--  leer el bucket entero. Lo cierra
--  `migrations/0002_cerrar_acceso_publico.sql`, que es OPCIONAL
--  y rompe la app original — lo decide el dueño.
-- ------------------------------------------------------------
select 'políticas abiertas en el bucket',
       count(*)::text || case when count(*) > 0 then ' — lectura pública abierta' else '' end
from pg_policies where schemaname = 'storage' and tablename = 'objects';
