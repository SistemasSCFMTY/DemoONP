import { Hono } from 'hono';
import type { Env } from '../env';
import { cuerpoJson, responder } from '../lib/respuesta';
import { supabaseDe } from '../lib/supabase';
import { ProspectoCreadoSchema, ProspectoSchema } from '../schemas/prospecto';
import { correoBienvenida } from '../services/correo/bienvenida';
import { enviarCorreo } from '../services/correo/mailer';
import { registrarProspecto } from '../services/prospectos';

export const prospectos = new Hono<{ Bindings: Env }>();

prospectos.post('/', async (c) => {
  const datos = await cuerpoJson(c, ProspectoSchema);

  // El registro crea el expediente en `borrador`; el id que devuelve es
  // el del expediente, y `web-app/` lo manda de vuelta en el envío para
  // que la solicitud complete ese renglón en vez de abrir otro.
  const { id } = await registrarProspecto(supabaseDe(c.env), datos, c.env.DEMO_SOFOM_ID);

  // El correo va DESPUÉS de que la escritura salió bien, y va en
  // `waitUntil`: la respuesta no lo espera y un fallo no la toca
  // (01-conventions.md §10). `enviarCorreo` tampoco lanza — dos
  // candados, porque un prospecto cuya cuenta quedó creada no debe ver
  // un error porque una API de correo tardó.
  //
  // `c.executionCtx` no se desestructura: `waitUntil` pierde su `this`
  // y revienta con "Illegal invocation".
  const { asunto, html } = correoBienvenida(datos.nombres);
  c.executionCtx.waitUntil(
    enviarCorreo(c.env.RESEND_API_KEY, { para: datos.correo, asunto, html }),
  );

  return responder(c, ProspectoCreadoSchema, { id }, 201);
});
