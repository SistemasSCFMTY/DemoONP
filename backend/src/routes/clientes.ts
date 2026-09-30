import { Hono } from 'hono';
import { isDemoMode, type Env } from '../env';
import { sha256Texto } from '../lib/hash';
import { cuerpoJson, responder } from '../lib/respuesta';
import { supabaseDe } from '../lib/supabase';
import { consumirLimite, ipDe } from '../middleware/limite';
import { ClienteVerificadoSchema, VerificarClienteSchema } from '../schemas/cliente';
import { enmascararTelefono, localizarPorCurp } from '../services/clientes';
import { emitirCodigo } from '../services/otp';

/**
 * «Verifica tu identidad» y, con ella, retomar una solicitud.
 *
 * Localizar por CURP y mandar el código son un solo paso a propósito:
 * dos endpoints permitirían preguntar «¿esta CURP es cliente?» sin
 * gastar un envío, que es justo el uso que no queremos facilitar.
 */
export const clientes = new Hono<{ Bindings: Env }>();

clientes.post('/verificar', async (c) => {
  const { curp } = await cuerpoJson(c, VerificarClienteSchema);

  // Por IP, porque aquí no hay un teléfono todavía sobre el cual
  // limitar. Sin esto, la CURP es enumerable.
  await consumirLimite(
    c.env.LIMITE_OTP_IP,
    ipDe(c),
    'Demasiados intentos desde esta conexión. Espera un minuto.',
  );

  const cliente = await localizarPorCurp(supabaseDe(c.env), curp, c.env.DEMO_SOFOM_ID);
  if (!cliente) {
    return responder(c, ClienteVerificadoSchema, { encontrado: false });
  }

  // El tope por teléfono se aplica también aquí: si no, este endpoint
  // sería la puerta de atrás para martillear un número sin pasar por
  // `/otp/enviar`.
  await consumirLimite(
    c.env.LIMITE_OTP_TELEFONO,
    await sha256Texto(`otp:${cliente.telefono}`),
    'Ya pediste varios códigos. Espera un minuto antes de pedir otro.',
  );

  const { codigo, expiraEn } = await emitirCodigo(supabaseDe(c.env), cliente.telefono);

  return responder(c, ClienteVerificadoSchema, {
    encontrado: true,
    telefonoEnmascarado: enmascararTelefono(cliente.telefono),
    expiraEn,
    ...(isDemoMode(c.env) ? { codigo } : {}),
  });
});
