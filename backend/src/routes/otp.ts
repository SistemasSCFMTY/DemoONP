import { Hono } from 'hono';
import { isDemoMode, type Env } from '../env';
import { sha256Texto } from '../lib/hash';
import { cuerpoJson, responder } from '../lib/respuesta';
import { supabaseDe } from '../lib/supabase';
import { consumirLimite, ipDe } from '../middleware/limite';
import { EnviarOtpSchema, OtpEnviadoSchema, OtpValidoSchema, ValidarOtpSchema } from '../schemas/otp';
import { emitirSesionProspecto } from '../lib/sesion-prospecto';
import { buscarBorradorPorTelefono } from '../services/clientes';
import { emitirCodigo, validarCodigo } from '../services/otp';

/**
 * El código de un solo uso.
 *
 * No hay proveedor de SMS: bajo `DEMO_MODE` el código vuelve en la
 * respuesta y la UI lo pinta con su etiqueta «Modo demostración», como
 * la fuente (onp_fer_etapa2_pf.html:2650). Lo que cambia es que lo
 * genera el servidor y que apagar el eco es un secreto, no un cambio
 * de código.
 */
export const otp = new Hono<{ Bindings: Env }>();

/**
 * La llave del limitador es el hash del teléfono, no el teléfono.
 *
 * El número es dato personal y la llave viaja al servicio de rate
 * limiting. Hashearlo no cambia en nada el comportamiento del tope y
 * saca el dato de donde no tiene que estar (01-conventions.md §1).
 */
const llaveTelefono = (telefono: string) => sha256Texto(`otp:${telefono}`);

otp.post('/enviar', async (c) => {
  const { telefono } = await cuerpoJson(c, EnviarOtpSchema);

  // Por teléfono y por IP. El primero impide martillear un número; el
  // segundo, recorrer muchos desde un mismo sitio.
  await consumirLimite(
    c.env.LIMITE_OTP_TELEFONO,
    await llaveTelefono(telefono),
    'Ya pediste varios códigos. Espera un minuto antes de pedir otro.',
  );
  await consumirLimite(
    c.env.LIMITE_OTP_IP,
    ipDe(c),
    'Demasiados intentos desde esta conexión. Espera un minuto.',
  );

  const { codigo, expiraEn } = await emitirCodigo(supabaseDe(c.env), telefono);

  return responder(c, OtpEnviadoSchema, {
    enviado: true,
    expiraEn,
    ...(isDemoMode(c.env) ? { codigo } : {}),
  });
});

otp.post('/validar', async (c) => {
  const { telefono, codigo } = await cuerpoJson(c, ValidarOtpSchema);

  // También se limita validar. Sin esto, seis dígitos son un millón de
  // intentos y 120 segundos alcanzan para muchos.
  await consumirLimite(
    c.env.LIMITE_OTP_IP,
    ipDe(c),
    'Demasiados intentos desde esta conexión. Espera un minuto.',
  );

  await validarCodigo(supabaseDe(c.env), telefono, codigo);

  // Validado el teléfono, se emite la sesión del prospecto y se dice
  // dónde retomar. Es aquí y no antes: probar el código es exactamente
  // lo que autoriza a tocar ese expediente.
  //
  // Si no hay borrador para este número, la respuesta es la de siempre.
  // El registro normal pasa por aquí igual y no debe cambiar de forma.
  const borrador = await buscarBorradorPorTelefono(supabaseDe(c.env), telefono);
  if (!borrador) return responder(c, OtpValidoSchema, { valido: true });

  await emitirSesionProspecto(c, borrador.expedienteId);
  return responder(c, OtpValidoSchema, {
    valido: true,
    expedienteId: borrador.expedienteId,
    paso: borrador.paso,
  });
});
