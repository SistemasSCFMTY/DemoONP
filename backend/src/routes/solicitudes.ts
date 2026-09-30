import { Hono } from 'hono';
import type { SesionProspecto } from '../lib/sesion-prospecto';
import { requireProspecto } from '../middleware/prospecto';
import { GuardarPasoSchema, PasoActualSchema } from '../schemas/cliente';
import { guardarPaso, leerPaso } from '../services/clientes';
import type { Env } from '../env';
import { badRequest } from '../lib/errors';
import { cuerpoJson, responder } from '../lib/respuesta';
import { supabaseDe } from '../lib/supabase';
import { SolicitudCreadaSchema } from '../schemas/expediente';
import { correoConfirmacion } from '../services/correo/confirmacion';
import { enviarCorreo } from '../services/correo/mailer';
import { recibirSolicitud } from '../services/solicitudes';

/**
 * `POST /solicitudes` — la solicitud completa, multipart.
 *
 * La ruta es delgada a propósito (01-conventions.md §10): lee el
 * multipart y delega. Toda la lógica vive en `services/solicitudes.ts`.
 */
export const solicitudes = new Hono<{
  Bindings: Env;
  Variables: { prospecto: SesionProspecto };
}>();

/**
 * Dónde se quedó el flujo — `PATCH` para guardar, `GET` para retomar.
 *
 * **El expediente sale de la cookie, no de la URL.** No hay un id que
 * un curioso pueda cambiar, así que no hay expediente ajeno al que
 * apuntar. La cookie la emite `POST /otp/validar` y sólo después de
 * que la persona probó tener el teléfono del expediente.
 *
 * Guardar el avance no puede tumbar el flujo: si esto falla, el front
 * lo ignora y la persona sigue llenando. Por eso no hay nada aquí que
 * el cliente tenga que esperar.
 */
solicitudes.patch('/paso', requireProspecto, async (c) => {
  const { paso } = await cuerpoJson(c, GuardarPasoSchema);
  await guardarPaso(supabaseDe(c.env), c.get('prospecto').sub, paso);
  return c.body(null, 204);
});

solicitudes.get('/paso', requireProspecto, async (c) => {
  const expedienteId = c.get('prospecto').sub;
  const paso = await leerPaso(supabaseDe(c.env), expedienteId);
  return responder(c, PasoActualSchema, { expedienteId, paso });
});

solicitudes.post('/', async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw badRequest('No pudimos leer los archivos que enviaste. Inténtalo de nuevo.');
  }

  const creada = await recibirSolicitud(supabaseDe(c.env), c.env, form);

  // Confirmación con el folio (CP-B10). Después de que la escritura
  // salió bien y dentro de `waitUntil`, igual que el de bienvenida: la
  // respuesta no lo espera y un fallo no la toca. Una solicitud
  // aceptada no puede convertirse en un error porque Resend tardó.
  if (creada.correo) {
    const { asunto, html } = correoConfirmacion(creada.folio);
    c.executionCtx.waitUntil(
      enviarCorreo(c.env.RESEND_API_KEY, { para: creada.correo, asunto, html }),
    );
  }

  // `archivosFallidos` no sale en la respuesta: el contrato dice
  // `201 → { folio, id }` y nada más. Queda en el log del servidor,
  // que es donde el personal lo necesita — el prospecto no puede
  // hacer nada con esa lista salvo asustarse.
  return responder(c, SolicitudCreadaSchema, { folio: creada.folio, id: creada.id }, 201);
});
