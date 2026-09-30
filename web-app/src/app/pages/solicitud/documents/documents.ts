import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { GuardarDocumento } from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import { SolicitudState } from '../../../state/solicitud/solicitud.state';
import type { TipoArchivo } from '../../../services/http/solicitudes-http';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpArchivo } from '../../../ui/onp-archivo/onp-archivo';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';

/** Required for everyone. `doc_fiscal` and `doc_fea` are optional (`:1716`). */
const OBLIGATORIOS_PROPIOS: readonly TipoArchivo[] = ['doc_id', 'doc_curp', 'doc_domicilio'];

/** Required only when a tercero is declared. */
const OBLIGATORIOS_TERCERO: readonly TipoArchivo[] = [
  'doc_poder',
  'doc_id_propietario',
  'doc_domicilio_propietario',
];

/**
 * Carga de documentos. Screen 23 (onp_fer_etapa2_pf.html:1716).
 *
 * **These eight inputs are read by no JavaScript in the source** — they are
 * declared, they accept a file, and nothing ever looks at `.files`. A
 * prospect attaches their comprobante de domicilio and it goes nowhere.
 * Departure 1, and this is where it is fixed: each file lands in
 * `IdentidadState` and rides the multipart body of `POST /solicitudes`.
 *
 * Which three extra documents are required comes from the declaratoria
 * answer, declared rather than inferred: the tercero block is not rendered
 * at all when the prospect acts on their own behalf, so there is nothing to
 * require and nothing left behind to submit.
 */
@Component({
  selector: 'onp-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpTitulo, OnpAlert, OnpArchivo, OnpButton, OnpStatus],
  template: `
    <onp-titulo texto="Carga de documentos" lede="Carga los documentos de soporte requeridos." />

    @if (esTercero()) {
      <onp-alert tono="info">
        <strong>
          Manifestaste actuar por cuenta de un tercero por lo que deberás cargar la siguiente
          documentación:
        </strong>
      </onp-alert>
    } @else {
      <onp-alert tono="info">
        <strong>Deberás cargar la siguiente documentación:</strong>
      </onp-alert>
    }

    <onp-archivo
      idCampo="doc-id"
      etiqueta="Identificación personal"
      [obligatorio]="true"
      (cambio)="guardar('doc_id', $event)"
    />
    <onp-archivo
      idCampo="doc-curp"
      etiqueta="Constancia de CURP"
      [obligatorio]="true"
      (cambio)="guardar('doc_curp', $event)"
    />
    <onp-archivo
      idCampo="doc-fiscal"
      etiqueta="Constancia de situación fiscal (Opcional)"
      acepta=".pdf"
      (cambio)="guardar('doc_fiscal', $event)"
    />
    <onp-archivo
      idCampo="doc-fea"
      etiqueta="Constancia de firma electrónica avanzada (Opcional)"
      acepta=".pdf"
      (cambio)="guardar('doc_fea', $event)"
    />
    <onp-archivo
      idCampo="doc-domicilio"
      etiqueta="Comprobante de domicilio"
      [obligatorio]="true"
      (cambio)="guardar('doc_domicilio', $event)"
    />

    @if (esTercero()) {
      <h2 class="mt-5 mb-2 font-heading text-h3 font-bold text-navy-deep">
        Documentación del propietario real
      </h2>
      <onp-archivo
        idCampo="doc-poder"
        etiqueta="Carta poder o poder certificado"
        acepta=".pdf"
        [obligatorio]="true"
        (cambio)="guardar('doc_poder', $event)"
      />
      <onp-archivo
        idCampo="doc-id-propietario"
        etiqueta="Identificación oficial del propietario"
        [obligatorio]="true"
        (cambio)="guardar('doc_id_propietario', $event)"
      />
      <onp-archivo
        idCampo="doc-domicilio-propietario"
        etiqueta="Comprobante de domicilio del propietario"
        [obligatorio]="true"
        (cambio)="guardar('doc_domicilio_propietario', $event)"
      />
    }

    @if (error()) {
      <onp-status tono="error">{{ error() }}</onp-status>
    }

    <onp-button (pulsar)="continuar()">Continuar</onp-button>
  `,
})
export class Documents {
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);

  protected readonly esTercero = this.store.selectSignal(SolicitudState.esTercero);
  protected readonly error = signal('');

  private readonly documentos = this.store.selectSignal(IdentidadState.documentos);

  private readonly faltantes = computed(() => {
    const cargados = this.documentos();
    const requeridos = this.esTercero()
      ? [...OBLIGATORIOS_PROPIOS, ...OBLIGATORIOS_TERCERO]
      : OBLIGATORIOS_PROPIOS;
    return requeridos.filter((tipo) => !cargados[tipo]);
  });

  protected guardar(tipo: TipoArchivo, archivo: File | null): void {
    this.store.dispatch(new GuardarDocumento(tipo, archivo));
    if (this.error()) this.error.set('');
  }

  protected continuar(): void {
    if (this.faltantes().length) {
      this.error.set(
        `Faltan ${this.faltantes().length} documento(s) obligatorio(s). Revisa los campos marcados con *.`,
      );
      return;
    }
    this.error.set('');
    void this.navegacion.avanzar('biometrics', 'documents');
  }
}
