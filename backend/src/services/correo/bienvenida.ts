import { escapar } from './marca';
import { armarCorreo } from './plantilla';

/**
 * El correo de bienvenida, al registrarse (CP-B6).
 *
 * Recuerda: sale de `onboarding@resend.dev` y **solo llega a la
 * dirección dueña de la cuenta de Resend**. Ver el encabezado de
 * `mailer.ts`.
 */
export function correoBienvenida(nombres: string): { asunto: string; html: string } {
  const nombre = nombres.trim().split(/\s+/)[0] ?? '';

  return {
    asunto: 'Tu cuenta está lista — ONP FER',
    html: armarCorreo({
      titulo: nombre ? `Bienvenida, bienvenido ${escapar(nombre)}` : 'Tu cuenta está lista',
      parrafos: [
        'Creamos tu cuenta. Con ella puedes retomar tu solicitud de crédito si algo se interrumpe: cierras la aplicación, se te acaba la batería o prefieres continuar mañana.',
        'El siguiente paso es el código de verificación que te enviamos a tu teléfono. Tiene una vigencia de dos minutos; si vence, puedes pedir uno nuevo.',
        'Si no fuiste tú quien creó esta cuenta, ignora este mensaje y no continúes con el proceso.',
      ],
      cierre:
        'Este mensaje se generó automáticamente. No respondas a esta dirección.',
    }),
  };
}
