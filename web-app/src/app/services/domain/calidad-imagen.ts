import type { ResultadoCalidad, RevisionCalidad } from '../../state/identidad/identidad.model';

/**
 * Basic quality analysis of a photographed ID.
 *
 * Ported from `analizarCalidad` (onp_fer_etapa2_pf.html:4686): resolution,
 * exposure, sharpness and whether the image is in colour. The thresholds are
 * the source's and are kept — they are calibrated against photographs of
 * credenciales taken on phones, and inventing better-looking numbers would
 * mean re-calibrating against nothing.
 *
 * It is advice, not a gate. The prospect is told what looks wrong and offered
 * "Repetir"; nothing here refuses a photograph, because a rule that rejects a
 * usable picture on a dim evening costs an application.
 */
export function analizarCalidad(lienzo: HTMLCanvasElement): ResultadoCalidad {
  const revisiones: RevisionCalidad[] = [];
  const w = lienzo.width;
  const h = lienzo.height;

  const resolucionOk = (w >= 640 && h >= 400) || (h >= 640 && w >= 400);
  revisiones.push({ ok: resolucionOk, texto: `Resolución suficiente (${w}×${h})` });

  const ctx = lienzo.getContext('2d');
  if (!ctx) {
    return { aprobada: false, revisiones };
  }

  const datos = ctx.getImageData(0, 0, w, h).data;

  // Sample at most ~40,000 pixels: a full-resolution phone photo is 12M and
  // scanning all of it blocks the main thread for seconds.
  const paso = Math.max(1, Math.floor(datos.length / 4 / 40000)) * 4;

  let suma = 0;
  let n = 0;
  const grises: number[] = [];
  for (let i = 0; i < datos.length; i += paso) {
    const g = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2];
    grises.push(g);
    suma += g;
    n++;
  }

  const brillo = suma / n;
  const luzOk = brillo > 45 && brillo < 225;
  revisiones.push({
    ok: luzOk,
    texto: luzOk
      ? 'Iluminación adecuada'
      : brillo <= 45
        ? 'Imagen muy oscura'
        : 'Imagen sobreexpuesta',
  });

  // Sharpness as the mean squared difference between consecutive samples —
  // a blurred photograph has little local contrast.
  let varianza = 0;
  for (let i = 1; i < grises.length; i++) {
    varianza += Math.pow(grises[i] - grises[i - 1], 2);
  }
  varianza = varianza / (grises.length - 1);
  const nitidezOk = varianza > 25;
  revisiones.push({
    ok: nitidezOk,
    texto: nitidezOk ? 'Imagen nítida' : 'Imagen posiblemente borrosa',
  });

  // A photocopy of a credencial is grey; the regulation wants colour.
  let color = 0;
  for (let i = 0; i < datos.length; i += paso) {
    color += Math.abs(datos[i] - datos[i + 1]) + Math.abs(datos[i + 1] - datos[i + 2]);
  }
  const colorOk = color / n > 6;
  revisiones.push({
    ok: colorOk,
    texto: colorOk ? 'Imagen a color' : 'La imagen parece en blanco y negro',
  });

  return { aprobada: revisiones.every((r) => r.ok), revisiones };
}
