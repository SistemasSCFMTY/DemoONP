-- ============================================================
--  ONP FER — 0003 · dónde se quedó la solicitud
--
--  Una columna para saber en qué pantalla del flujo va cada
--  expediente, y poder devolver a la persona ahí en vez de
--  hacerla empezar de nuevo.
--
--  **Es aditiva y anulable**, así que no rompe la app original:
--  un `select *` suyo simplemente recibe una llave de más, y
--  ningún insert existente deja de funcionar por una columna que
--  acepta null.
--
--  `text` y no un enum. El valor es un `PasoId` de
--  `web-app/src/app/model/interfaces/paso.ts`, y esa lista cambia
--  cuando cambian las pantallas: un enum de Postgres obligaría a
--  un `alter type` por cada pantalla nueva, sobre un tipo que la
--  app original también lee. El front es el dueño de la lista; la
--  base sólo la guarda.
--
--  No lleva `check`: un valor que el front ya no conoce debe
--  degradar al primer paso, no reventar el insert de una
--  solicitud.
--
--  Forward-only e idempotente.
-- ============================================================

alter table public.expedientes
    add column if not exists paso_actual text;

comment on column public.expedientes.paso_actual is
    'Último paso alcanzado del flujo de solicitud (PasoId de web-app). '
    'Null en expedientes anteriores a esta columna y en los que ya se enviaron.';

-- ------------------------------------------------------------
--  Comprobación
-- ------------------------------------------------------------
select case when exists (
         select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name   = 'expedientes'
            and column_name  = 'paso_actual')
       then 'ok' else 'FALTA' end as paso_actual;
