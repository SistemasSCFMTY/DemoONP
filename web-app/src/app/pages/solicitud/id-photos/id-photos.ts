import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { NavegacionService } from '../../../core/navegacion-service';
import { TIPOS_IDENTIFICACION } from '../../../model/constants/catalogos/tipos-identificacion';
import { Camara } from '../../../services/domain/camara';
import { Geolocalizacion } from '../../../services/domain/geolocalizacion';
import { Ocr } from '../../../services/domain/ocr';
import {
  DescartarFoto,
  ElegirTipoIdentificacion,
  GuardarDatosIne,
  GuardarFoto,
} from '../../../state/identidad/identidad.actions';
import { IdentidadState } from '../../../state/identidad/identidad.state';
import type { LadoFoto } from '../../../state/identidad/identidad.model';
import { OnpAlert } from '../../../ui/onp-alert/onp-alert';
import { OnpButton } from '../../../ui/onp-button/onp-button';
import { OnpField } from '../../../ui/onp-field/onp-field';
import { OnpFila } from '../../../ui/onp-fila/onp-fila';
import { OnpSelect } from '../../../ui/onp-select/onp-select';
import { OnpStatus } from '../../../ui/onp-status/onp-status';
import { OnpTitulo } from '../../../ui/onp-titulo/onp-titulo';
import { CapturaLado, type FotoLista } from './captura-lado';

/** The INE fields the source insists on, with their exact lengths (`:4956`). */
const CAMPOS_INE = [
  { control: 'claveElector', nombre: 'Clave de elector', largo: 18 },
  { control: 'anioRegistro', nombre: 'Año de registro', largo: 4 },
  { control: 'numEmision', nombre: 'Número de emisión', largo: 2 },
  { control: 'cic', nombre: 'CIC', largo: 9 },
  { control: 'ocr', nombre: 'OCR', largo: 13 },
] as const;

/**
 * Fotografía de identificación. Screen 22 (onp_fer_etapa2_pf.html:1589).
 *
 * Both sides, camera or upload, quality feedback, and — when the document is
 * an INE — OCR into editable fields.
 *
 * **The data boxes appear as soon as there is a photograph, empty and
 * editable**, rather than when the OCR finishes. The source changed to this
 * for a good reason it wrote down at `:4658`: the first read downloads the
 * language model and takes most of a minute, and a screen that shows nothing
 * meanwhile reads as an app that did not do anything.
 *
 * Geolocation is captured here, the second of the four evidentiary moments.
 */
@Component({
  selector: 'onp-id-photos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    OnpTitulo,
    OnpAlert,
    OnpSelect,
    OnpField,
    OnpFila,
    OnpButton,
    OnpStatus,
    CapturaLado,
  ],
  template: `
    <onp-titulo
      texto="Fotografía de identificación"
      lede="Captura ambos lados de tu identificación. Válidos: INE, Pasaporte mexicano o Matrícula consular."
    />

    <onp-alert tono="info">
      <strong>Requisitos:</strong> La foto debe ser nítida, a color, bien iluminada, completa y
      legible. Evita reflejos, sombras y dedos sobre el documento.
    </onp-alert>

    <onp-select
      idCampo="tipo-identificacion"
      etiqueta="Tipo de identificación"
      [opciones]="tipos"
      [obligatorio]="true"
      [control]="tipo"
    />

    @if (!tipo.value) {
      <onp-status tono="pendiente">
        Selecciona el tipo de identificación para poder capturar las fotografías.
      </onp-status>
    }

    <onp-captura-lado
      lado="front"
      titulo="Lado A — Frente"
      pista="Lado con tu fotografía y datos personales."
      [habilitado]="!!tipo.value"
      [progresoOcr]="progresoFrente()"
      (capturada)="fotoLista($event)"
      (descartada)="fotoDescartada($event)"
    />

    @if (esIne() && hayFrente()) {
      <section class="mb-4 rounded-card border border-border bg-surface p-4">
        <h3 class="mb-1 font-heading text-h3 font-bold text-navy-deep">
          Datos de la credencial — Frente
        </h3>
        <p class="mb-3 text-status leading-relaxed text-text-soft">
          La app intentará leerlos de la fotografía. Si alguno no aparece o no coincide, escríbelo
          tú. <b>La primera lectura puede tardar hasta medio minuto.</b>
        </p>
        <div (input)="mayusculasClave()">
          <onp-field
            idCampo="ine-clave-elector"
            etiqueta="Clave de elector"
            marcador="18 caracteres"
            [maxlength]="18"
            [detectado]="detectado('claveElector')"
            [control]="formulario.controls.claveElector"
          />
        </div>
        <onp-fila>
          <onp-field
            idCampo="ine-anio-registro"
            etiqueta="Año de registro"
            marcador="AAAA"
            modoEntrada="numeric"
            [maxlength]="4"
            [detectado]="detectado('anioRegistro')"
            [control]="formulario.controls.anioRegistro"
          />
          <onp-field
            idCampo="ine-num-emision"
            etiqueta="Número de emisión"
            marcador="00"
            modoEntrada="numeric"
            [maxlength]="2"
            [detectado]="detectado('numEmision')"
            [control]="formulario.controls.numEmision"
          />
        </onp-fila>
        <onp-fila>
          <onp-field
            idCampo="ine-anio-emision"
            etiqueta="Año de emisión"
            marcador="AAAA"
            modoEntrada="numeric"
            [maxlength]="4"
            [detectado]="detectado('anioEmision')"
            [control]="formulario.controls.anioEmision"
          />
        </onp-fila>
      </section>
    }

    <onp-captura-lado
      lado="back"
      titulo="Lado B — Reverso"
      pista="Lado con el código de barras / banda magnética."
      [habilitado]="!!tipo.value"
      [progresoOcr]="progresoReverso()"
      (capturada)="fotoLista($event)"
      (descartada)="fotoDescartada($event)"
    />

    @if (esIne() && hayReverso()) {
      <section class="mb-4 rounded-card border border-border bg-surface p-4">
        <h3 class="mb-1 font-heading text-h3 font-bold text-navy-deep">
          Datos de la credencial — Reverso
        </h3>
        <p class="mb-3 text-status leading-relaxed text-text-soft">
          La app intentará leerlos de la fotografía. Si alguno no aparece o no coincide, escríbelo
          tú. <b>La primera lectura puede tardar hasta medio minuto.</b>
        </p>
        <onp-field
          idCampo="ine-cic"
          etiqueta="CIC (Código Identificador de Credencial)"
          marcador="9 dígitos"
          modoEntrada="numeric"
          [maxlength]="9"
          [detectado]="detectado('cic')"
          [control]="formulario.controls.cic"
        />
        <onp-field
          idCampo="ine-ocr"
          etiqueta="OCR (Reconocimiento Óptico de Caracteres)"
          marcador="13 dígitos"
          modoEntrada="numeric"
          [maxlength]="13"
          [detectado]="detectado('ocr')"
          [control]="formulario.controls.ocr"
        />
      </section>
    }

    @if (error()) {
      <onp-status tono="error">{{ error() }}</onp-status>
    }

    <onp-button [deshabilitado]="!hayFrente() || !hayReverso()" (pulsar)="continuar()">
      Continuar
    </onp-button>
  `,
})
export class IdPhotos {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly navegacion = inject(NavegacionService);
  private readonly ocr = inject(Ocr);
  private readonly camara = inject(Camara);
  private readonly geo = inject(Geolocalizacion);

  protected readonly tipos = TIPOS_IDENTIFICACION;

  protected readonly tipo = this.fb.nonNullable.control(
    this.store.selectSnapshot(IdentidadState.tipoIdentificacion),
    [Validators.required],
  );

  private readonly ine = this.store.selectSnapshot(IdentidadState.ine);
  protected readonly formulario = this.fb.nonNullable.group({
    claveElector: [this.ine.claveElector],
    anioRegistro: [this.ine.anioRegistro],
    numEmision: [this.ine.numEmision],
    anioEmision: [this.ine.anioEmision],
    cic: [this.ine.cic],
    ocr: [this.ine.ocr],
  });

  protected readonly hayFrente = signal(!!this.store.selectSnapshot(IdentidadState.frente));
  protected readonly hayReverso = signal(!!this.store.selectSnapshot(IdentidadState.reverso));
  protected readonly progresoFrente = signal<number | null>(null);
  protected readonly progresoReverso = signal<number | null>(null);
  protected readonly error = signal('');

  /** Which fields the OCR filled, so the prospect can see what was read for
   *  them and what they typed (`marcarDetectado`, `:4878`). */
  private readonly detectados = signal<ReadonlySet<string>>(new Set());

  protected readonly esIne = computed(() => this.tipo.value === 'ine');

  constructor() {
    this.tipo.valueChanges.subscribe((valor) =>
      this.store.dispatch(new ElegirTipoIdentificacion(valor)),
    );
    // The second of the four evidentiary moments.
    void this.geo.capturarSiHayPermiso('fotografia_identificacion');
    // A stream left running keeps the camera light on after the prospect
    // has navigated away.
    inject(DestroyRef).onDestroy(() => this.camara.cerrarTodas());
  }

  protected detectado(campo: string): boolean {
    return this.detectados().has(campo);
  }

  protected mayusculasClave(): void {
    const control = this.formulario.controls.claveElector;
    const arriba = control.value.toUpperCase();
    if (arriba !== control.value) control.setValue(arriba, { emitEvent: false });
  }

  protected async fotoLista(foto: FotoLista): Promise<void> {
    this.store.dispatch(
      new GuardarFoto(foto.lado, foto.imagen, foto.vistaPrevia, foto.calidad),
    );
    if (foto.lado === 'front') this.hayFrente.set(true);
    else this.hayReverso.set(true);
    this.error.set('');

    if (!this.esIne()) return;
    await this.leer(foto);
  }

  protected fotoDescartada(lado: LadoFoto): void {
    this.store.dispatch(new DescartarFoto(lado));
    if (lado === 'front') this.hayFrente.set(false);
    else this.hayReverso.set(false);
  }

  private async leer(foto: FotoLista): Promise<void> {
    const progreso = foto.lado === 'front' ? this.progresoFrente : this.progresoReverso;
    progreso.set(0);
    try {
      const leido = await this.ocr.leerCredencial(foto.lado, foto.lienzo, (p) => progreso.set(p));
      const encontrados = new Set(this.detectados());
      for (const [campo, valor] of Object.entries(leido)) {
        if (!valor) continue;
        this.formulario.patchValue({ [campo]: valor });
        encontrados.add(campo);
      }
      this.detectados.set(encontrados);
    } finally {
      progreso.set(null);
    }
  }

  protected continuar(): void {
    if (!this.tipo.value) {
      this.error.set('Selecciona el tipo de identificación.');
      return;
    }
    if (!this.hayFrente() || !this.hayReverso()) {
      this.error.set('Captura ambos lados de la identificación.');
      return;
    }

    // The INE numbers are checked whether the OCR read them or a person
    // typed them — the source's own rule (`:4956`).
    if (this.esIne()) {
      const valores = this.formulario.getRawValue();
      for (const campo of CAMPOS_INE) {
        const valor = valores[campo.control].trim();
        if (!valor) {
          this.error.set(
            `Falta capturar: ${campo.nombre}. Si la app no lo detectó, escríbelo manualmente.`,
          );
          return;
        }
        if (valor.length !== campo.largo) {
          this.error.set(
            `${campo.nombre} debe tener ${campo.largo} caracteres. Verifícalo contra tu credencial.`,
          );
          return;
        }
      }
    }

    this.error.set('');
    this.store.dispatch(new GuardarDatosIne(this.formulario.getRawValue()));
    void this.navegacion.avanzar('documents', 'id-photos');
  }
}
