import { Injectable, inject, signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { PLANTILLA_BASE } from '../../model/constants/solicitud/plantilla-base';
import { pesos } from './amortizacion';
import { clavesDePlantilla, type FuentesExpediente } from './expediente-armador';
import { llenarPlantilla } from './plantilla';
import { IdentidadState } from '../../state/identidad/identidad.state';
import { SesionState } from '../../state/sesion/sesion.state';
import { SimuladorState } from '../../state/simulador/simulador.state';
import { SolicitudState } from '../../state/solicitud/solicitud.state';

/** Styled by `.pendiente` in `onp-hoja-documento`, not by an inline hex —
 *  this string is rendered markup, and §3 allows no hex in one. */
const PENDIENTE_DE_FIRMA = '<p class="pendiente">— pendiente de firma —</p>';

/**
 * Rendering the solicitud the prospect reads and signs.
 *
 * Held here rather than in a component because two screens need the same
 * document: `revision-solicitud` shows it unsigned, and `complete` puts the
 * signature into it for the PDF. Rendering it twice from two places is how
 * the reviewed document and the signed one drift apart.
 *
 * The folio is not known until the Worker answers, so the unsigned version
 * shows a placeholder and the signed one carries the real one.
 */
@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly store = inject(Store);

  /** The last rendered unsigned document, so `complete` can sign it. */
  readonly html = signal('');

  private fuentes(): FuentesExpediente {
    return {
      solicitud: this.store.selectSnapshot(SolicitudState.todo),
      identidad: this.store.selectSnapshot(IdentidadState.todo),
      simulador: this.store.selectSnapshot(SimuladorState.estado),
      sesion: this.store.selectSnapshot(SesionState.estado),
    };
  }

  /** The document as reviewed: everything filled, the signature a placeholder. */
  generar(folio = 'por asignar'): string {
    const claves = clavesDePlantilla(this.fuentes(), folio, pesos);
    claves['firma'] = PENDIENTE_DE_FIRMA;
    const html = llenarPlantilla(PLANTILLA_BASE, claves);
    this.html.set(html);
    return html;
  }

  /**
   * The same document with the drawn signature in place of the placeholder,
   * and the folio the Worker assigned.
   *
   * @param firmaDataUrl the signature canvas as a PNG data URL
   */
  firmado(firmaDataUrl: string, folio: string): string {
    const claves = clavesDePlantilla(this.fuentes(), folio, pesos);
    claves['firma'] = firmaDataUrl
      ? `<img src="${firmaDataUrl}" alt="Firma del solicitante">`
      : PENDIENTE_DE_FIRMA;
    return llenarPlantilla(PLANTILLA_BASE, claves);
  }
}
