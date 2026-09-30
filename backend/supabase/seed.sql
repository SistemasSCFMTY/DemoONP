-- ============================================================
--  ONP FER — semilla
--
--  NO es una migración. Se corre a mano, después de
--  `migrations/0001_tablas_nuevas.sql`. Es idempotente.
--
--  Es corta porque casi todo ya está: la SOFOM existe y está
--  activa, y `usuarios_panel` ya tiene un administrador. Lo
--  único que falta sembrar es el renglón de producto.
-- ============================================================

-- ------------------------------------------------------------
--  Los parámetros del simulador
--
--  Valores de `PRODUCTO` (onp_fer_etapa2_pf.html:2340). El tope
--  está en pesos y no en UDIs a propósito: la UDI cambia todos
--  los días y la app no la consulta, así que se fija con holgura
--  por debajo del límite real y se actualiza a mano.
-- ------------------------------------------------------------
insert into public.producto (
    id, monto_min, monto_max, plazo_min, plazo_max,
    tasa_anual, comision_apertura, comision_pct, comision_desde
)
values (1, 5000, 200000, 6, 72, 36, true, 2, 10000)
on conflict (id) do nothing;

-- ------------------------------------------------------------
--  Usuarios del panel — NO HACE FALTA TOCAR NADA
--
--  El proyecto ya tiene un administrador activo. Se deja como
--  está: reescribirlo sería cambiarle el acceso a alguien que ya
--  entra.
--
--  Si quieres OTRO usuario para la demo:
--
--    1. Supabase → Authentication → Users → Add user.
--       Marca **Auto Confirm User**; si no, el login falla con
--       «Email not confirmed» y se va media hora en encontrarlo.
--       La contraseña vive ahí, no en `usuarios_panel`.
--
--    2. Ya está el renglón. Un trigger sobre `auth.users` lo crea
--       solo, con `id` = el id del usuario de Auth, `activo = true`
--       y `rol = 'consulta'`. NO intentes insertarlo a mano:
--       `usuarios_panel.id` no tiene default y el insert truena con
--       23502 (null value in column "id").
--
--    3. Súbele el rol si lo quieres en el panel completo:
--
--         update public.usuarios_panel
--            set rol = 'administrador', nombre_completo = 'Nombre Apellido'
--          where correo = 'nuevo@ejemplo.mx';
--
--  `rol` solo acepta: administrador | analista | consulta.
--
--  Ojo con el trigger: CUALQUIER usuario nuevo de Auth entra a
--  `usuarios_panel` activo y con rol `consulta`. Hoy no importa
--  —la llave publicable solo vive en el Worker y no hay registro
--  público—, pero si esto pasa de la demo, el default debería ser
--  `activo = false`.
-- ------------------------------------------------------------

select 'producto' as sembrado,
       coalesce((select 'tasa ' || tasa_anual || '%, monto ' ||
                        monto_min::bigint || '–' || monto_max::bigint
                 from public.producto where id = 1), 'FALTA') as resultado

union all

select 'usuarios_panel activos',
       coalesce(string_agg(correo, ', '), 'NINGUNO')
from public.usuarios_panel where activo is true;
