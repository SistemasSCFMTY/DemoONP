import { armarCorreo } from './plantilla';

/**
 * El correo de confirmación, al enviar la solicitud (CP-B10).
 *
 * Mismo armazón que el de bienvenida, y el mismo remitente de sandbox:
 * `onboarding@resend.dev` solo entrega a la dirección dueña de la
 * cuenta de Resend. Ver el encabezado de `mailer.ts`.
 *
 * El folio es lo único que este correo tiene que hacer llegar. Es lo
 * que la persona va a leer por teléfono si llama a preguntar, así que
 * va destacado y no enterrado en un párrafo.
 *
 * Lo que **no** lleva: ni CURP, ni RFC, ni domicilio, ni monto, ni nada
 * del expediente. El correo viaja sin cifrar por servidores que no son
 * nuestros y se queda en bandejas que no controlamos; el folio no
 * identifica a nadie por sí solo y con eso basta (01-conventions.md §1).
 */
export function correoConfirmacion(folio: string): { asunto: string; html: string } {
  return {
    asunto: `Recibimos tu solicitud — folio ${folio}`,
    html: armarCorreo({
      titulo: 'Recibimos tu solicitud',
      parrafos: [
        'Tu solicitud de crédito quedó registrada con todos sus documentos. No necesitas hacer nada más por ahora.',
        'Guarda este folio: es con lo que podemos localizar tu expediente si necesitas preguntar por él.',
      ],
      destacado: { etiqueta: 'Folio de tu solicitud', valor: folio },
      cierre:
        'Un analista revisará tu expediente y te contactaremos con el resultado. Este mensaje se generó automáticamente; no respondas a esta dirección.',
    }),
  };
}
