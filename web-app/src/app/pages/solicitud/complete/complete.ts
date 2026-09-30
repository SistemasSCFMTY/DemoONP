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
  templateUrl: './complete.html',
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
