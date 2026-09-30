import { z } from 'zod';
import { telefono } from './comunes';

/** `POST /otp/enviar` */
export const EnviarOtpSchema = z.object({ telefono });

export const OtpEnviadoSchema = z.object({
  enviado: z.literal(true),
  expiraEn: z.string(),
  /**
   * Solo cuando `DEMO_MODE=true`.
   *
   * La fuente generaba el código en el navegador y lo pintaba en
   * pantalla (onp_fer_etapa2_pf.html:2650). Se conserva lo visible —la
   * etiqueta «Modo demostración» que el público va a leer— y se corrige
   * lo que estaba mal: el código ahora lo genera el servidor, y solo
   * viaja de vuelta si la bandera está encendida. Apagarla es un
   * `wrangler secret put`, no un cambio de código.
   */
  codigo: z.string().optional(),
});

/** `POST /otp/validar` */
export const ValidarOtpSchema = z.object({
  telefono,
  codigo: z.string().regex(/^\d{6}$/, 'El código son 6 dígitos.'),
});

export const OtpValidoSchema = z.object({ valido: z.literal(true) });
