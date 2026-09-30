import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NavegacionService } from '../../../core/navegacion-service';
import { DocumentoService } from '../../../services/domain/documento-service';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpCheckbox } from '../../../ui/onp-checkbox/onp-checkbox';
import { OnpHojaDocumento } from '../../../ui/onp-hoja-documento/onp-hoja-documento';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/**
 * Revisa tu solicitud. Screen 26 (onp_fer_etapa2_pf.html:1832).
 *
 * The document is rendered from `PLANTILLA_BASE` every time this screen is
 * entered, so it always reflects the latest edit. The confirmation checkbox
 * resets on entry too — the source does this (`:4462`), and it is right:
 * having confirmed you read one version of a document is not confirmation
 * that you read the next.
 *
 * The folio reads "por asignar" here, because it does not exist yet. The
 * Worker mints it on submission (departure 7); the signed copy carries the
 * real one.
 */
@Component({
  selector: 'onp-revision-solicitud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpAlert,
    OnpHojaDocumento,
    OnpCheckbox,
    OnpButton,
  ],
  templateUrl: './revision-solicitud.html',
})
export class RevisionSolicitud {
  private readonly fb = inject(FormBuilder);
  private readonly navegacion = inject(NavegacionService);
  private readonly documentos = inject(DocumentoService);

  /** Unticked on every entry: confirming one version is not confirming the next. */
  protected readonly confirma = this.fb.nonNullable.control(false);
  protected readonly documento = signal(this.documentos.generar());

  protected continuar(): void {
    if (!this.confirma.value) return;
    void this.navegacion.avanzar('signature', 'solicitud');
  }
}
