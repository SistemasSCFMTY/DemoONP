import { z } from 'zod';

/**
 * `POST /clientes/verificar` — la pantalla «Verifica tu identidad»
 * (onp_fer_etapa2_pf.html:1600).
 *
 * Los tres campos son obligatorios en la pantalla, así que se exigen
 * aquí también, aunque la búsqueda sea por CURP: pedirlos y no
 * validarlos sería mentirle al formulario.
 */
export const VerificarClienteSchema = z.object({
  numeroCliente: z.string().trim().min(1).max(60),
  nombreCompleto: z.string().trim().min(1).max(300),
  curp: z
    .string()
    .trim()
    .toUpperCase()
    .length(18, 'La CURP debe tener 18 caracteres.'),
});

/**
 * La respuesta no distingue «no existe» de «existe sin teléfono».
 *
 * `encontrado: false` con el mismo mensaje que la fuente
 * (`:2615`). Detallar cuál de los dos fue convertiría esto en un
 * oráculo de CURPs con más resolución de la que ya tiene.
 */
export const ClienteVerificadoSchema = z.object({
  encontrado: z.boolean(),
  /** `•• •••• 5678`. Sólo cuando se encontró. */
  telefonoEnmascarado: z.string().optional(),
  /**
   * Cuándo vence el código, ISO 8601.
   *
   * **String, no segundos.** Es el mismo valor que devuelve
   * `/otp/enviar` (`OtpEnviadoSchema`), porque sale del mismo
   * `emitirCodigo`, que regresa `expira.toISOString()`. Cuando esto
   * decía `z.number()`, `responder` rechazaba la respuesta y el
   * endpoint daba 500 **justo en el caso bueno** — el de la CURP que sí
   * existe—, que es el único que las pruebas con CURP inventada nunca
   * tocan.
   */
  expiraEn: z.string().optional(),
  /** Sólo bajo DEMO_MODE, igual que en `/otp/enviar`. */
  codigo: z.string().optional(),
});

export type VerificarCliente = z.infer<typeof VerificarClienteSchema>;

/**
 * `PATCH /solicitudes/paso`.
 *
 * El paso se valida como slug y **no** contra la lista de pantallas.
 * Esa lista vive en `web-app/src/app/model/interfaces/paso.ts` y cambia
 * cuando cambian las pantallas; duplicarla aquí la condena a
 * desincronizarse, y el precio de un valor desconocido es que el front
 * degrade al primer paso, no que se caiga una solicitud.
 */
export const GuardarPasoSchema = z.object({
  paso: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Paso no reconocido.'),
});

export const PasoActualSchema = z.object({
  expedienteId: z.string().uuid(),
  paso: z.string().nullable(),
});
