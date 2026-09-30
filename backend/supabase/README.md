# Supabase — verificación, tablas nuevas y semilla

**El esquema ya está.** Este backend escribe contra el proyecto de Supabase que ya
existe, el mismo que usa la app original de un solo archivo. Se sondeó en solo lectura
el 2026-09-30: las nueve tablas del modelo están, `expedientes` tiene **106 columnas** y
es un superconjunto de nuestro contrato, y el bucket `expedientes` está creado y privado.

Así que aquí casi no hay migraciones. Lo que hay es una verificación, tres tablas que
faltaban, y un cierre de permisos que es opcional.

## Orden

Supabase → SQL Editor → New query → pegar el archivo completo → Run.

| # | Archivo | Obligatorio | Qué hace |
|---|---|---|---|
| 1 | `verificacion.sql` | **léelo primero** | Solo lee. Dice si la base es la que el Worker espera |
| 2 | `migrations/0001_tablas_nuevas.sql` | **sí** | Crea `prospectos`, `otp_codigos`, `producto` |
| 3 | `seed.sql` | **sí** | El renglón de `producto` |
| 4 | `migrations/0002_cerrar_acceso_publico.sql` | **no** | Cierra RLS y el bucket. Lee la advertencia |

Todo es idempotente. Nada borra ni recrea nada que ya exista.

`verificacion.sql` imprime el valor de `DEMO_SOFOM_ID`. Cópialo al secreto.

## Los tres ENUM — esto es lo que más caro sale equivocar

Un valor fuera del enum no da error de validación: da un 500 de Postgres a media
solicitud, cuando el prospecto ya subió las fotos.

```
estado_expediente  borrador | pendiente | revision | aprobado | rechazado | cancelado
rol_usuario        administrador | analista | consulta
tipo_archivo       id_frente | id_reverso | firma | video_identificacion | huella |
                   rostro | comprobante_domicilio | constancia_curp |
                   constancia_fiscal | constancia_fea | poder_notarial |
                   id_propietario_real | domicilio_propietario_real | otro
```

Dos correcciones al contrato salieron de aquí, ya aplicadas en `02-api-contract.md`:

- Es **`revision`**, no `en_revision`. El panel tiene que mandar `revision`.
- Ninguno de los ocho `doc_*` del contrato existe en `tipo_archivo`. El Worker los
  traduce al guardar (`src/schemas/comunes.ts`); los nombres de parte del multipart no
  cambian, porque `web-app/` ya está construido contra ellos.

## Lo que ya estaba y no tocamos

`sofoms` · `usuarios_panel` · `expedientes` · `propietarios_reales` · `archivos` ·
`documentos` · `historial_estados` · `plantillas` · `bitacora`, y las vistas
`v_lista_expedientes` y `v_ubicaciones`.

`expedientes` trae además campos de dictamen (`monto_aprobado`, `dictaminado_por`,
`motivo_rechazo`), bancarios (`clabe`, `banco`, `titular_cuenta`), `ip_origen`,
`cat_estimado`, `comision_estimada` y `conservar_hasta` (retención). Fuera de alcance
esta noche; no se tocan y no se borran.

Dos NOT NULL que la fuente nunca ponía y el Worker sí: `curp_verificada_renapo` e
`ine_verificada`, ambos en **falso**. Son banderas de verificación contra RENAPO y
contra el padrón del INE — trámites que esta demo no hace. Ponerlos en verdadero sería
afirmar una verificación que no ocurrió, en un expediente regulado.

`historial_estados` sí se llena: el Worker escribe un renglón en cada cambio de estado
(`PATCH /expedientes/:id`). Una tabla de auditoría que nadie llena es peor que no
tenerla, porque aparenta que hay registro.

`archivos.calidad_aprobada` y `calidad_detalle` quedan en NULL. Son para la salida de
`analizarCalidad` (`:4686`), que corre en el navegador; el contrato no define cómo
viaja, así que no se inventa.

## `expedientes.sofom_id`

Existe, es **NOT NULL** con llave foránea a `sofoms`. **Sin `DEMO_SOFOM_ID` ningún
envío funciona.** Somos un solo tenant y no administramos `sofoms`; el uuid de la fila
que ya existe —ONP FER, S.A. de C.V., SOFOM E.N.R., `activa = true`— entra como secreto
del Worker. `verificacion.sql` lo imprime.

## Contraseñas del personal

**No están en `usuarios_panel`.** Esa tabla no tiene columna de contraseña y nunca la
tuvo: es el perfil (`rol`, `activo`, `nombre_completo`), que es como la fuente la usaba
(`:5300`) después de llamar a `signInWithPassword` (`:5291`). Las contraseñas viven en
Supabase Auth (`auth.users`).

El proyecto ya tiene un administrador activo; `verificacion.sql` lo lista. Para dar de
alta a alguien más:

1. Supabase → Authentication → Users → **Add user**. Marca **Auto Confirm User**; si no,
   el login falla con «Email not confirmed» y se va media hora en encontrarlo.
2. Inserta el perfil con ese mismo correo y `activo = true`. `seed.sql` trae el SQL.

El Worker autentica contra Auth con la llave publicable, comprueba `activo` y `rol` con
la llave secreta, emite **su propio** JWT HS256 firmado con `JWT_SECRET` y tira la
sesión de Supabase. Ningún token de Supabase llega al navegador.

## `0002_cerrar_acceso_publico.sql` es opcional y rompe la app original

**Rompe `../ONP/onp_fer_etapa2_pf.html`.** Esa app habla directo con Supabase desde el
navegador con la llave publicable y depende de las políticas abiertas que esa migración
quita. Después de correrla deja de poder subir archivos y de poder leer expedientes.

**No hace falta para que nuestro Worker funcione.** El Worker entra con la llave secreta
(`service_role`), que esquiva RLS: funciona igual antes y después.

Lo que sí hace es tapar un agujero de lectura. `../ONP/arreglo_permisos_final.sql` da
`select to public` sobre todo el bucket y `insert with check (true)` en cinco tablas.
Con la llave publicable —que en la app original viaja al navegador— eso alcanza para
leer la INE, la firma, el domicilio y el ingreso de cualquier solicitante.
`verificacion.sql` cuenta cuántas políticas de esas siguen puestas.

Córrela cuando la app original ya no se use. **La decisión es del dueño.**

## La trampa que sí vale la pena de `arreglo_permisos_final.sql`

Supabase guarda las carpetas en `storage.prefixes`, con sus propios candados, y cada
nivel de carpeta necesita permiso. Por eso la ruta es de un solo nivel —
`{folio}/{tipo}.{ext}`, no `{año}/{mes}/{folio}/…`. Es el razonamiento del comentario de
`subirArchivo` (`:2998`) y se conserva.
