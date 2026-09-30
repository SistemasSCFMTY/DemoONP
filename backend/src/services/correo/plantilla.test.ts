import { describe, expect, it } from 'vitest';
import { correoBienvenida } from './bienvenida';
import { correoConfirmacion } from './confirmacion';
import { REMITENTE } from './mailer';
import { MARCA } from './marca';
import { armarCorreo } from './plantilla';

describe('armarCorreo', () => {
  it('lleva la razón social completa en el pie', () => {
    // §1: la razón social es lo que identifica legalmente a la SOFOM.
    // El nombre comercial no basta en un correo que habla de crédito.
    const html = armarCorreo({ titulo: 'Hola', parrafos: ['Cuerpo.'] });
    expect(html).toContain(MARCA.razonSocial);
    expect(html).toContain(MARCA.domicilio);
  });

  it('escapa lo que se interpola', () => {
    const html = armarCorreo({
      titulo: 'Hola <script>alert(1)</script>',
      parrafos: ['Cuerpo.'],
      destacado: { etiqueta: 'Folio', valor: 'ONP-261001-0042 & "x"' },
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('ONP-261001-0042 &amp; &quot;x&quot;');
  });

  it('cada pila de fuentes termina en un genérico', () => {
    // La mayoría de los clientes de correo descarta las fuentes web.
    // Sin genérico al final, el correo cae en la fuente por defecto del
    // cliente y la jerarquía se pierde.
    const html = armarCorreo({ titulo: 'Hola', parrafos: ['Cuerpo.'] });
    expect(html).toMatch(/font-family:'Charis SIL'[^;]*serif/);
    expect(html).toMatch(/font-family:Archivo[^;]*sans-serif/);
  });

  it('omite el bloque destacado cuando no hay nada que destacar', () => {
    expect(armarCorreo({ titulo: 'Hola', parrafos: ['Cuerpo.'] })).not.toContain('border-left');
  });
});

describe('correoBienvenida', () => {
  it('saluda por el primer nombre', () => {
    expect(correoBienvenida('Laura Fernanda').html).toContain('Laura');
  });

  it('no deja un saludo colgando cuando no hay nombre', () => {
    const html = correoBienvenida('   ').html;
    expect(html).toContain('Tu cuenta está lista');
    expect(html).not.toContain('Bienvenida, bienvenido <');
  });
});

describe('el remitente', () => {
  it('es el sandbox de Resend', () => {
    // Desviación D8. Solo entrega a la dirección dueña de la cuenta.
    // Si esto cambia, es porque hay dominio verificado — y entonces el
    // comentario de mailer.ts y el runbook también cambian.
    expect(REMITENTE).toContain('onboarding@resend.dev');
  });
});

describe('correoConfirmacion', () => {
  const folio = 'ONP-261001-0042';

  it('pone el folio en el asunto y destacado en el cuerpo', () => {
    // Es lo que la persona va a leer por teléfono si llama.
    const { asunto, html } = correoConfirmacion(folio);
    expect(asunto).toContain(folio);
    expect(html).toContain(folio);
    expect(html).toContain('Folio de tu solicitud');
  });

  it('no lleva nada del expediente', () => {
    // El correo viaja sin cifrar por servidores que no son nuestros y
    // se queda en bandejas que no controlamos. El folio no identifica a
    // nadie por sí solo; CURP, RFC, domicilio del solicitante e
    // ingresos sí (01-conventions.md §1).
    //
    // Se mira solo el cuerpo: el pie lleva el domicilio de LA SOFOM,
    // que es información pública de la institución y tiene que estar.
    const html = correoConfirmacion(folio).html;
    const cuerpo = html.slice(0, html.indexOf('border-top')).toLowerCase();

    for (const prohibido of ['curp', 'rfc', 'domicilio', 'ingreso', 'monto', 'colonia']) {
      expect(cuerpo).not.toContain(prohibido);
    }
  });

  it('el pie sí lleva el domicilio de la SOFOM', () => {
    expect(correoConfirmacion(folio).html).toContain(MARCA.domicilio);
  });
});
