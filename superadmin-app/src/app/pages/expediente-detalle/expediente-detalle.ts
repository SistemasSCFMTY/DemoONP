import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  SecurityContext,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCircleAlert,
  LucideFileDown,
  LucideFileText,
  LucideLoaderCircle,
  LucidePaperclip,
} from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import {
  DefinicionEstado,
  ESTADOS_ASIGNABLES,
  definicionEstado,
} from '../../model/constants/expediente/estados-expediente';
import { NOMBRE_MOMENTO } from '../../model/constants/expediente/momentos-ubicacion';
import { NOMBRE_ARCHIVO } from '../../model/constants/expediente/tipos-archivo';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import { TipoArchivo } from '../../model/interfaces/expediente-detalle';
import { FechaMxPipe } from '../../pipes/fecha-mx.pipe';
import { PesosPipe } from '../../pipes/pesos.pipe';
import { SiNoPipe } from '../../pipes/si-no.pipe';
import { TamanoArchivoPipe } from '../../pipes/tamano-archivo.pipe';
import { ImpresionDocumento } from '../../services/domain/impresion-documento.service';
import {
  CambiarEstado,
  CargarExpediente,
  LimpiarExpediente,
} from '../../state/expedientes/expedientes.actions';
import { ExpedientesState } from '../../state/expedientes/expedientes.state';
import { ArchivoImagen } from '../../ui/archivo-imagen/archivo-imagen';
import { DatoFila } from '../../ui/dato-fila/dato-fila';
import { EstadoBadge } from '../../ui/estado-badge/estado-badge';
import { Seccion } from '../../ui/seccion/seccion';

/**
 * The expediente, field for field.
 *
 * Ported from `verExpediente` (`onp_fer_etapa2_pf.html:5471`) — the same
 * sections in the same order, the same labels, and the same
 * "No proporcionado" for an empty value.
 *
 * **It displays more PII than anything else in the product** (§12). The rules
 * that follow from that, and which this file keeps:
 *
 * - The route carries the opaque id. No folio, no CURP, no name in a URL.
 * - Nothing here is logged. Not on error, not in development.
 * - Image URLs are minted one at a time, expire in five minutes, and are
 *   never written to storage — there is no storage plugin in this app.
 * - `LimpiarExpediente` on destroy, so leaving the screen drops both the
 *   record and every URL minted for it.
 *
 * ### Two departures from the source, both noted in the PR
 *
 * 1. **No "Eliminar expediente".** The source offers one (`:5652`). There is
 *    no delete endpoint in `02-api-contract.md`, and what an operator may
 *    destroy on a regulated KYC file is the owner's call, not an inference.
 * 2. **Comisión, total and CAT are not shown.** The source printed them
 *    (`:5497`) from its flattened template data. The contract's expediente
 *    does not carry them, and they cannot be recomputed here without the live
 *    product parameters — §11 bans a figure with no source, and in a credit
 *    UI that is a compliance problem rather than a design one. They return
 *    with CP-S5, which brings the product parameters into this app.
 */
@Component({
  selector: 'panel-expediente-detalle',
  imports: [
    RouterLink,
    Seccion,
    DatoFila,
    EstadoBadge,
    ArchivoImagen,
    PesosPipe,
    FechaMxPipe,
    SiNoPipe,
    TamanoArchivoPipe,
    LucideArrowLeft,
    LucideCircleAlert,
    LucideFileDown,
    LucideFileText,
    LucideLoaderCircle,
    LucidePaperclip,
  ],
  templateUrl: './expediente-detalle.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpedienteDetalleVista implements AfterViewInit {
  /** Bound from the route by `withComponentInputBinding`. An opaque id. */
  readonly id = input.required<string>();

  readonly #store = inject(Store);
  readonly #impresion = inject(ImpresionDocumento);
  readonly #sanitizer = inject(DomSanitizer);

  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  protected readonly expediente = select(ExpedientesState.abierto);
  protected readonly cargando = select(ExpedientesState.cargandoDetalle);
  protected readonly errorDetalle = select(ExpedientesState.errorDetalle);
  protected readonly guardandoEstado = select(ExpedientesState.guardandoEstado);
  readonly #filtros = select(ExpedientesState.filtros);

  /**
   * What the estado selector offers.
   *
   * The four assignable estados, plus — when the expediente arrived in one an
   * operator may not set, such as `borrador` or `cancelado` — its own estado,
   * first and disabled. Without that the browser would fall back to selecting
   * the first option, and the control would quietly claim the record is in a
   * state it is not in.
   */
  protected readonly opcionesEstado = computed<readonly DefinicionEstado[]>(() => {
    const actual = this.expediente()?.estado;
    if (!actual) return ESTADOS_ASIGNABLES;
    if (ESTADOS_ASIGNABLES.some((o) => o.valor === actual)) return ESTADOS_ASIGNABLES;
    return [definicionEstado(actual), ...ESTADOS_ASIGNABLES];
  });

  /**
   * The estado on file when the panel may not assign it — the one option in
   * the selector that is shown but cannot be chosen. Null otherwise.
   */
  protected readonly estadoBloqueado = computed(() => {
    const actual = this.expediente()?.estado;
    if (!actual || ESTADOS_ASIGNABLES.some((o) => o.valor === actual)) return null;
    return actual;
  });

  /** True when the estado on file is not one the panel may assign. */
  protected readonly estadoNoAsignable = computed(() => this.estadoBloqueado() !== null);
  protected readonly nombreArchivo = NOMBRE_ARCHIVO;

  /**
   * The stored solicitud, sanitised.
   *
   * **Stored HTML is untrusted on display**, whatever wrote it. The source's
   * `llenarPlantilla` (`onp_fer_etapa2_pf.html:3716`) interpolates form values
   * into the template without escaping, so a surname containing a `<script>`
   * tag is stored in `documentos.contenido_html` verbatim. `web-app/` escapes
   * at generation now, but the database already holds rows written by the
   * original single-file app and those were never escaped — and this view
   * renders them inside an authenticated staff session that can read every
   * expediente. A stored XSS with a payload typed by an anonymous prospect.
   *
   * One sanitisation point feeds both sinks: the inline `[innerHTML]` and the
   * print window, which writes into a document that inherits this origin.
   * `sanitize(SecurityContext.HTML, …)`, and **never**
   * `bypassSecurityTrustHtml` — the plantilla styles itself with classes the
   * sheet defines, so nothing it legitimately needs is stripped.
   */
  protected readonly documentoHtml = computed<string | null>(() => {
    const html = this.expediente()?.documento?.contenido_html;
    if (!html) return null;
    return this.#sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  });

  protected readonly documentoVisible = signal(false);
  protected readonly avisoImpresion = signal<string | null>(null);

  /** Rebuilds the list's query string, so "Volver a la lista" goes back. */
  protected readonly filtrosPrevios = computed(() => {
    const f = this.#filtros();
    const params: Record<string, string> = {};
    if (f.q) params['q'] = f.q;
    if (f.estado) params['estado'] = f.estado;
    if (f.offset) params['desde'] = String(f.offset);
    return params;
  });

  readonly #tipos = computed(
    () => new Set<TipoArchivo>(this.expediente()?.archivos.map((a) => a.tipo) ?? []),
  );

  protected readonly tieneFrente = computed(() => this.#tipos().has('id_frente'));
  protected readonly tieneReverso = computed(() => this.#tipos().has('id_reverso'));
  protected readonly tieneFirma = computed(() => this.#tipos().has('firma'));
  protected readonly tieneFotos = computed(() => this.tieneFrente() || this.tieneReverso());

  protected readonly plazo = computed(() => {
    const meses = this.expediente()?.plazo_solicitado_meses;
    return meses ? `${meses} meses` : null;
  });

  protected readonly tasa = computed(() => {
    const t = this.expediente()?.tasa_solicitada;
    return t === null || t === undefined ? null : `${t}%`;
  });

  /** `tipo_solicitante` in the source's template data (`:5792`). */
  protected readonly tipoSolicitante = computed(() =>
    this.expediente()?.es_cliente_existente ? 'Cliente' : 'Prospecto',
  );

  /**
   * The source blanks the end date when the post is still held
   * (`mapearExpediente`, `:2900`), so a vigente PEP shows the word rather
   * than an empty row an operator would read as missing data.
   */
  protected readonly terminacionPropio = computed(() => {
    const e = this.expediente();
    if (!e) return null;
    return e.pep_propio_vigente ? 'Sigue vigente' : formatearFecha(e.pep_propio_fin);
  });

  protected readonly terminacionFamilia = computed(() => {
    const e = this.expediente();
    if (!e) return null;
    return e.pep_familia_vigente ? 'Sigue vigente' : formatearFecha(e.pep_familia_fin);
  });

  // Verbatim from `verExpediente` (`:5596`).
  protected readonly huella = computed(() =>
    this.expediente()?.biometria_huella ? 'Capturada' : 'No capturada',
  );
  protected readonly rostro = computed(() =>
    this.expediente()?.biometria_rostro ? 'Capturado' : 'No capturado',
  );
  protected readonly video = computed(() =>
    this.expediente()?.video_grabado ? 'Realizada' : 'No realizada',
  );

  protected readonly esIne = computed(() =>
    (this.expediente()?.tipo_identificacion ?? '').toUpperCase().includes('INE'),
  );

  protected readonly actuaPorCuenta = computed(() =>
    this.expediente()?.propietario_real ? 'De un tercero' : 'Propia',
  );

  /** One row per evidentiary capture, formatted as the source formats it (`:5612`). */
  protected readonly ubicaciones = computed(() => {
    const lista = this.expediente()?.ubicaciones ?? [];
    return lista.map((u) => ({
      clave: NOMBRE_MOMENTO[u.etiqueta] ?? u.etiqueta,
      valor:
        `${u.latitud.toFixed(6)}, ${u.longitud.toFixed(6)}` +
        ` · ±${Math.round(u.precision_metros)} m` +
        ` · ${new Date(u.capturado_en).toLocaleString('es-MX', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
    }));
  });

  protected readonly textoVerDocumento = computed(() =>
    this.documentoVisible() ? 'Ocultar documento' : 'Ver documento',
  );

  protected readonly mensajeEstado = computed(() => {
    if (this.guardandoEstado()) return 'Guardando…';
    if (this.estadoNoAsignable()) {
      return 'El estado actual no se asigna desde el panel. Elige otro para cambiarlo.';
    }
    return 'El cambio se guarda al seleccionarlo.';
  });

  constructor() {
    effect(() => {
      this.#store.dispatch(new CargarExpediente(this.id()));
    });

    // Leaving the screen drops the record and every signed URL minted for it.
    inject(DestroyRef).onDestroy(() => this.#store.dispatch(new LimpiarExpediente()));
  }

  ngAfterViewInit(): void {
    // §9: the title takes focus once it exists. It is behind an @if, so it
    // may not be in the DOM on the first pass.
    this.titulo()?.nativeElement.focus();
  }

  protected cambiarEstado(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as EstadoExpediente;
    this.#store.dispatch(new CambiarEstado(this.id(), valor));
  }

  protected alternarDocumento(): void {
    this.documentoVisible.update((v) => !v);
  }

  protected descargarPdf(): void {
    const e = this.expediente();
    const html = this.documentoHtml();
    if (!e || html === null) return;

    // The sanitised copy, never `documento.contenido_html`: the print window
    // is `about:blank`, which inherits this origin, so a script written into
    // it runs with the staff session's access.
    const abierta = this.#impresion.imprimir(e.folio, html);
    this.avisoImpresion.set(
      abierta
        ? null
        : 'Tu navegador bloqueó la ventana de impresión. Permite las ventanas emergentes de este sitio e inténtalo de nuevo.',
    );
  }
}

function formatearFecha(iso: string | null): string | null {
  if (!iso) return null;
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? null : f.toLocaleDateString('es-MX');
}
