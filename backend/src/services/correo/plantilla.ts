import { COLOR, escapar, FUENTE_CUERPO, FUENTE_TITULO, MARCA } from './marca';

/**
 * El armazón de los correos.
 *
 * Tablas y estilos en línea, no flexbox ni hojas de estilo: Outlook
 * sigue componiendo con el motor de Word y descarta casi todo el CSS
 * moderno. Es feo de escribir y es lo que llega bien.
 *
 * Un solo armazón para todas las plantillas, para que el correo de
 * bienvenida y el de confirmación no se separen visualmente cuando
 * alguien toque uno solo.
 */
export interface Bloque {
  readonly titulo: string;
  readonly parrafos: readonly string[];
  /** Un dato destacado, como el folio. */
  readonly destacado?: { readonly etiqueta: string; readonly valor: string } | undefined;
  readonly cierre?: string | undefined;
}

export function armarCorreo(bloque: Bloque): string {
  const parrafos = bloque.parrafos
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:${COLOR.text};">${p}</p>`,
    )
    .join('');

  const destacado = bloque.destacado
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
              style="margin:8px 0 20px 0;border-left:3px solid ${COLOR.gold};background:${COLOR.bg};">
         <tr><td style="padding:14px 16px;">
           <div style="font-size:12px;letter-spacing:.02em;color:${COLOR.textSoft};margin-bottom:4px;">
             ${escapar(bloque.destacado.etiqueta)}
           </div>
           <div style="font-family:${FUENTE_CUERPO};font-size:22px;font-weight:600;color:${COLOR.navyDeep};">
             ${escapar(bloque.destacado.valor)}
           </div>
         </td></tr>
       </table>`
    : '';

  const cierre = bloque.cierre
    ? `<p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:${COLOR.textSoft};">${bloque.cierre}</p>`
    : '';

  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(bloque.titulo)}</title>
<!--
  Gmail quita este @import y Outlook nunca lo soportó. Las pilas de
  fuentes terminan en un genérico para que el correo se vea bien sin
  ellas; con ellas, mejor.
-->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Charis+SIL:wght@400;700&display=swap">
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${COLOR.bg};padding:28px 16px;">
    <tr><td align="center">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:520px;background:${COLOR.surface};border:1px solid ${COLOR.border};">

        <!-- Cabecera. Sin logo: brand.config.ts trae logo en null, así
             que el wordmark hace de marca, igual que en la app. -->
        <tr><td style="background:${COLOR.navy};padding:18px 24px;">
          <span style="font-family:${FUENTE_TITULO};font-size:19px;font-weight:700;color:#ffffff;letter-spacing:.01em;">
            ${escapar(MARCA.nombreComercial)}
          </span>
        </td></tr>

        <tr><td style="padding:26px 24px 24px 24px;font-family:${FUENTE_CUERPO};">
          <h1 style="margin:0 0 14px 0;font-family:${FUENTE_TITULO};font-size:23px;line-height:1.3;font-weight:700;color:${COLOR.navyDeep};">
            ${escapar(bloque.titulo)}
          </h1>
          ${parrafos}
          ${destacado}
          ${cierre}
        </td></tr>

        <!-- Pie: la razón social completa, como exige §1. -->
        <tr><td style="padding:16px 24px 20px 24px;border-top:1px solid ${COLOR.border};font-family:${FUENTE_CUERPO};">
          <p style="margin:0 0 4px 0;font-size:12px;line-height:1.5;color:${COLOR.textSoft};">
            ${escapar(MARCA.razonSocial)}
          </p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:${COLOR.textSoft};">
            ${escapar(MARCA.domicilio)}
          </p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}
