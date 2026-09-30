-- ============================================================
--  ONP FER — 0001 · las tres tablas que faltaban
--
--  **EL ESQUEMA YA ESTÁ.** Se sondeó el proyecto real: las nueve
--  tablas del modelo existen, `expedientes` tiene 106 columnas y
--  es un superconjunto de nuestro contrato, y el bucket
--  `expedientes` ya está creado y privado.
--
--  Así que esta migración NO crea `expedientes`, ni
--  `propietarios_reales`, ni `archivos`, ni `documentos`, ni
--  `usuarios_panel`, ni `sofoms`, ni `historial_estados`, ni
--  `plantillas`, ni `bitacora`, ni el bucket. Tampoco agrega
--  columnas: no falta ninguna.
--
--  Solo crea las tres que el sondeo no encontró y que los
--  endpoints del contrato necesitan. Las tres son nuestras y
--  nacen vacías, así que crearlas no puede romper la app
--  original.
--
--  Antes de correr esto, corre `verificacion.sql` y lee su
--  salida. Si dice que algo ya existe, esta migración lo
--  respeta: todo va con `if not exists`.
--
--  Forward-only e idempotente.
-- ============================================================

-- ------------------------------------------------------------
--  prospectos — el registro previo a la solicitud
--
--  DECISIÓN QUE EL PLAN NO RESUELVE. El contrato exige
--  `POST /prospectos → 201 { id }` y no dice dónde vive ese id.
--  Devolver uno que no apunta a nada sería mentir. La fuente no
--  guardaba nada en este paso: solo avanzaba de pantalla
--  (onp_fer_etapa2_pf.html:2539).
--
--  La contraseña se guarda como PBKDF2-SHA256 y nunca en claro.
--  El prospecto NO es un usuario de Supabase Auth: Auth es para
--  el personal del panel.
-- ------------------------------------------------------------
create table if not exists public.prospectos (
    id               uuid primary key default gen_random_uuid(),
    sofom_id         uuid references public.sofoms(id),
    nombres          text not null,
    apellido_paterno text not null,
    apellido_materno text,
    correo           text not null,
    telefono         text not null,
    password_hash    text not null,
    creado_en        timestamptz not null default now()
);

create index if not exists prospectos_correo_idx on public.prospectos (lower(correo));

-- ------------------------------------------------------------
--  otp_codigos — el código de un solo uso
--
--  DECISIÓN QUE EL PLAN NO RESUELVE: dónde vive el OTP. Aquí y
--  no en KV, para que el despliegue no dependa de aprovisionar
--  un namespace más; Supabase ya es requisito. El tope de envíos
--  lo pone el binding nativo de rate limiting del Worker, antes
--  de tocar esta tabla.
--
--  Nunca se guarda el código en claro: se guarda el SHA-256 de
--  `telefono:codigo`. El teléfono es dato personal y el código
--  es una credencial. Con el teléfono dentro del hash, un código
--  tampoco sirve para otro número.
-- ------------------------------------------------------------
create table if not exists public.otp_codigos (
    id          uuid primary key default gen_random_uuid(),
    telefono    text not null,
    codigo_hash text not null,
    expira_en   timestamptz not null,
    usado_en    timestamptz,
    creado_en   timestamptz not null default now()
);

create index if not exists otp_codigos_telefono_idx
    on public.otp_codigos (telefono, creado_en desc);

-- ------------------------------------------------------------
--  producto — los parámetros del simulador
--
--  De la constante `PRODUCTO` (onp_fer_etapa2_pf.html:2340). Un
--  solo renglón, fijado en id = 1: el producto es único y el
--  panel lo edita en su lugar (CP-B9 / CP-S5).
--
--  Guarda solo lo que el contrato publica. El CAT, el pago
--  mensual y la comisión NO se guardan: se calculan en el
--  navegador a partir de estos parámetros, para que la UI nunca
--  tenga que confiar en una cifra precalculada que no puede
--  verificar.
-- ------------------------------------------------------------
create table if not exists public.producto (
    id                smallint primary key default 1 check (id = 1),
    monto_min         numeric(14,2) not null,
    monto_max         numeric(14,2) not null,
    plazo_min         integer not null,
    plazo_max         integer not null,
    tasa_anual        numeric(6,2) not null,
    comision_apertura boolean not null default true,
    comision_pct      numeric(6,2) not null default 0,
    comision_desde    numeric(14,2) not null default 0,
    actualizado_en    timestamptz not null default now()
);

-- ------------------------------------------------------------
--  Comprobación
-- ------------------------------------------------------------
select t.nombre as tabla,
       case when exists (select 1 from information_schema.tables
                         where table_schema = 'public' and table_name = t.nombre)
            then 'ok' else 'FALTA' end as resultado
from (values ('prospectos'), ('otp_codigos'), ('producto')) as t(nombre);
