import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { LucideCheck } from '@lucide/angular';
import { DocumentoService } from '../../../services/domain/documento-service';
import { Pdf } from '../../../services/domain/pdf';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { SesionState } from '../../../state/sesion/sesion.state';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCard } from '../../../ui/onp-card/onp-card';
import { OnpHojaDocumento } from '../../../ui/onp-hoja-documento/onp-hoja-documento';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * ¡Solicitud enviada! Screen 28 (onp_fer_etapa2_pf.html:1871).
 *
 * The folio shown is the one the Worker returned — never one this app made
 * up (departure 7). A folio prefixed `LOCAL-` means the submission never
 * left the phone, because the Worker was unreachable and the labelled
 * fallback answered.
 *
 * The signed document is rendered off-screen so `html2pdf` has something to
 * render at full width: the visible column is 390px, and rasterising that
 * gives a PDF nobody can read.
 */
@Component({
  selector: 'onp-complete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    OnpTitulo,
    OnpCard,
    OnpAlert,
    OnpButton,
    OnpStatus,
    OnpHojaDocumento,
    LucideCheck,
  ],
  template: `
    <onp-titulo
      texto="¡Solicitud enviada!"
      lede="Tu información fue recibida y quedó registrada. Está en revisión."
    />

    <onp-card>
      <p class="flex items-center gap-1.5 text-body font-semibold text-success">
        <svg lucideCheck class="size-4 shrink-0" aria-hidden="true"></svg>
        Expediente generado
      </p>
      <p class="mt-1.5 text-label text-text-soft">Número de folio:</p>
      <p class="mt-0.5 font-heading text-lg font-bold tracking-wider text-navy-deep">
        {{ folio() }}
      </p>
      @if (esLocal()) {
        <onp-status tono="aviso">
          Modo demostración: el servidor no respondió y este folio se generó en el dispositivo. La
          solicitud no quedó registrada en el sistema.
        </onp-status>
      }
    </onp-card>

    <onp-card>
      <p class="mb-2.5 text-label font-semibold text-text">Guarda tu comprobante</p>
      <p class="mb-2.5 text-status leading-relaxed text-text-soft">
        Descarga el PDF de la solicitud que firmaste. Contiene la información que proporcionaste y
        tu firma.
      </p>
      <onp-button variante="secondary" [deshabilitado]="descargando()" (pulsar)="descargar()">
        {{ descargando() ? 'Preparando el PDF…' : 'Descargar solicitud en PDF' }}
      </onp-button>
      @if (errorPdf()) {
        <onp-status tono="error">{{ errorPdf() }}</onp-status>
      }
    </onp-card>

    <onp-alert tono="info">
      <strong>¿Qué sigue?</strong> Revisaremos tu información y te avisaremos el resultado en esta
      misma aplicación. También te contactaremos al correo y teléfono que registraste.
    </onp-alert>

    <onp-button (pulsar)="finalizar()">Finalizar</onp-button>

    <!-- Rendered off-screen at document width for html2pdf: positioned away
         rather than hidden, because html2canvas cannot rasterise an element
         with no layout box. aria-hidden keeps it out of the accessibility
         tree — the prospect already read this document on the previous
         screen. -->
    <div class="hoja-pdf" aria-hidden="true">
      <onp-hoja-documento #hoja [contenido]="documentoFirmado()" />
    </div>
  `,
  styles: `
    .hoja-pdf {
      position: absolute;
      left: -9999px;
      top: 0;
      width: 700px;
    }
  `,
})
export class Complete {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly documentos = inject(DocumentoService);
  private readonly pdf = inject(Pdf);

  protected readonly descargando = signal(false);
  protected readonly errorPdf = signal('');

  private readonly folioCrudo = this.store.selectSignal(SesionState.folio);
  protected readonly folio = computed(() => this.folioCrudo() ?? '—');
  protected readonly esLocal = computed(() => (this.folioCrudo() ?? '').startsWith('LOCAL-'));

  private readonly firma = this.store.selectSignal(IdentidadState.firma);
  private readonly hoja = viewChild.required('hoja', { read: ElementRef });

  protected readonly documentoFirmado = computed(() =>
    this.documentos.firmado(this.firma()?.vistaPrevia ?? '', this.folio()),
  );

  protected async descargar(): Promise<void> {
    this.descargando.set(true);
    this.errorPdf.set('');
    try {
      const elemento = this.hoja().nativeElement as HTMLElement;
      const ok = await this.pdf.descargar(elemento, `solicitud-${this.folio()}`);
      if (!ok) {
        this.errorPdf.set('No pudimos generar el PDF. Inténtalo de nuevo desde otro navegador.');
      }
    } finally {
      this.descargando.set(false);
    }
  }

  /**
   * Back to the portada.
   *
   * A full reload, not a route change: it drops every Blob, every object URL
   * and the whole expediente out of memory. The next person to pick up the
   * phone starts from nothing, which is the only acceptable end state for a
   * screen that has just held someone's CURP and a photograph of their ID.
   */
  protected finalizar(): void {
    const firma = this.firma();
    if (firma) URL.revokeObjectURL(firma.vistaPrevia);
    void this.router.navigateByUrl('/').then(() => location.reload());
  }
}
