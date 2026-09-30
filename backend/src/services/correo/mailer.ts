/**
 * ============================================================
 *  EL REMITENTE ES `onboarding@resend.dev`, EL SANDBOX DE RESEND,
 *  Y SOLO ENTREGA A LA DIRECCIÓN DUEÑA DE LA CUENTA DE RESEND.
 *
 *  Cualquier otro destinatario recibe un 403 de la API. Nada se
 *  rompe visiblemente: el correo simplemente no llega nunca.
 *
 *  No es un descuido. No hay dominio verificado antes de la demo
 *  y el dueño lo decidió así (01-conventions.md, desviación D8).
 *  **En el paso de registro, en el escenario, hay que escribir esa
 *  dirección**, no un correo de prospecto inventado.
 *
 *  Está escrito aquí arriba para que nadie pase la mañana de
 *  mañana depurando un 403 silencioso.
 *
 *  Cuando haya dominio verificado, se cambia REMITENTE y ya.
 * ============================================================
 */

import { log } from '../../lib/log';

export const REMITENTE = 'ONP FER <onboarding@resend.dev>';

const URL_RESEND = 'https://api.resend.com/emails';

export interface Correo {
  readonly para: string;
  readonly asunto: string;
  readonly html: string;
}

/**
 * Manda un correo. **Nunca lanza.**
 *
 * El correo no puede tumbar una petición (01-conventions.md §10): se
 * llama después de que la escritura ya salió bien, y un fallo se
 * registra y se traga. Un prospecto cuya solicitud quedó aceptada no
 * debe ver un error porque una API de correo tardó.
 *
 * Devuelve si se envió, para el log de quien llama. Nadie decide nada
 * con ese booleano.
 */
export async function enviarCorreo(apiKey: string, correo: Correo): Promise<boolean> {
  if (!apiKey) {
    log.warn('sin RESEND_API_KEY; no se envía correo');
    return false;
  }

  try {
    const r = await fetch(URL_RESEND, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [correo.para],
        subject: correo.asunto,
        html: correo.html,
      }),
    });

    if (!r.ok) {
      // El cuerpo del error de Resend se lee y se registra, pero no se
      // devuelve: el 403 del sandbox nombra la dirección permitida, y
      // esa es de la cuenta, no del prospecto.
      const cuerpo = await r.text();
      log.warn('Resend rechazó el envío', {
        estado: r.status,
        detalle: cuerpo.slice(0, 300),
        pista:
          r.status === 403
            ? 'el sandbox onboarding@resend.dev solo entrega al dueño de la cuenta'
            : null,
      });
      return false;
    }

    // El destinatario no se registra: es dato personal (§1).
    log.info('correo enviado', { asunto: correo.asunto });
    return true;
  } catch (error) {
    log.warn('fallo de red al enviar correo', {
      causa: error instanceof Error ? error.message : 'desconocida',
    });
    return false;
  }
}
