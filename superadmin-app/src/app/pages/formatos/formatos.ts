import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  SecurityContext,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import {
  LucideCircleAlert,
  LucideCircleCheck,
  LucideEye,
  LucideLoaderCircle,
  LucideRotateCcw,
  LucideSearch,
  LucideUpload,
} from '@lucide/angular';
import { Store, select } from '@ngxs/store';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { CLAVES_VALIDAS } from '../../model/constants/plantilla/catalogo-claves';
import {
  BANDERAS_EJEMPLO,
  DATOS_EJEMPLO,
} from '../../model/constants/plantilla/ejemplo-plantilla';
import { CLAVE_SOLICITUD } from '../../model/interfaces/plantilla';
import { ErrorDocx, clavesUsadas, leerDocx } from '../../services/domain/lector-docx';
import { llenarPlantilla } from '../../services/domain/plantilla-motor';
import { FechaMxPipe } from '../../pipes/fecha-mx.pipe';
import { LlavesPipe } from '../../pipes/llaves.pipe';
import {
  CargarPlantillas,
  CargarVistaPrevia,
  CerrarVistaPrevia,
  LimpiarAvisoPlantilla,
  QuitarPlantilla,
  SubirPlantilla,
} from '../../state/plantillas/plantillas.actions';
import { PlantillasState } from '../../state/plantillas/plantillas.state';
import { SofomState } from '../../state/sofom/sofom.state';
import { CargarSofom } from '../../state/sofom/sofom.actions';
import { Seccion } from '../../ui/seccion/seccion';
import { ClavesCatalogo } from './claves-catalogo/claves-catalogo';

interface EstadoTexto {
  readonly ok: boolean;
  readonly texto: string;
  readonly clases: string;
}

/**
 * Formatos — the solicitud template and the catalogue of claves.
 *
 * Ported from the source's Formatos tab (`onp_fer_etapa2_pf.html:2005`),
 * `pintarCatalogo` (`:5673`) and `subirPlantilla` (`:5735`).
 *
 * **The `.docx` is parsed here, in the browser.** JSZip plus a DOM parser is
 * not what a 3 MB Worker bundle is for, and it is the same platform
 * constraint that keeps Tesseract client-side. The Worker is sent the
 * resulting HTML and never the file.
 *
 * **"Ver cómo queda" renders attacker-influenced HTML.** The template came
 * out of a file somebody uploaded and is filled with values that, in the real
 * render, a prospect typed. It goes through the same
 * `sanitize(SecurityContext.HTML, …)` as the expediente's stored document and
 * nowhere near `document.write` (`01-conventions.md` §12).
 */
@Component({
  selector: 'panel-formatos',
  imports: [
    ReactiveFormsModule,
    Seccion,
    ClavesCatalogo,
    LlavesPipe,
    LucideUpload,
    LucideEye,
    LucideRotateCcw,
    LucideSearch,
    LucideCircleCheck,
    LucideCircleAlert,
    LucideLoaderCircle,
  ],
  templateUrl: './formatos.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Formatos implements AfterViewInit {
  readonly #store = inject(Store);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #fecha = new FechaMxPipe();

  private readonly titulo = viewChild.required<ElementRef<HTMLElement>>('titulo');
  private readonly entradaArchivo =
    viewChild.required<ElementRef<HTMLInputElement>>('entradaArchivo');

  protected readonly activa = select(PlantillasState.activa);
  protected readonly cargandoVistaPrevia = select(PlantillasState.cargandoVistaPrevia);
  protected readonly clavesDesconocidas = select(PlantillasState.clavesDesconocidas);
  readonly #subiendo = select(PlantillasState.subiendo);
  readonly #cargando = select(PlantillasState.cargando);
  readonly #aviso = select(PlantillasState.aviso);
  readonly #errorServidor = select(PlantillasState.error);
  readonly #htmlPlantilla = select(PlantillasState.htmlVistaPrevia);
  readonly #sofom = select(SofomState.datos);

  /** A `.docx` that failed to convert, before anything was sent. */
  readonly #errorLocal = signal<string | null>(null);
  readonly #leyendo = signal(false);
  protected readonly busqueda = new FormControl('', { nonNullable: true });

  /**
   * The debounced search text, handed to the deferred catalogue as an input.
   * The field itself stays in this component: it is above the fold and must
   * keep working while the catalogue is still absent.
   */
  protected readonly consulta = signal('');

  /** Placeholder rows, sized to roughly the first group so nothing jumps. */
  protected readonly filasFantasma = [1, 2, 3, 4, 5, 6];

  protected readonly hayActivo = computed(() => this.activa() !== null);
  protected readonly ocupado = computed(
    () => this.#subiendo() || this.#leyendo() || this.#cargando(),
  );
  protected readonly vistaPreviaAbierta = computed(() => this.#htmlPlantilla() !== null);

  /**
   * "Ninguno — se usa el formato predeterminado" verbatim from the source
   * (`:2011`), and the uploaded name plus its date otherwise (`:5730`).
   */
  protected readonly descripcionActivo = computed(() => {
    const activa = this.activa();
    if (!activa) return 'Ninguno — se usa el formato predeterminado';

    const nombre = activa.archivo_original || activa.nombre;
    const fecha = this.#fecha.transform(activa.creado_en);
    return fecha ? `${nombre} — subido el ${fecha}` : nombre;
  });

  protected readonly estadoTexto = computed<EstadoTexto | null>(() => {
    const local = this.#errorLocal();
    if (local) return { ok: false, texto: local, clases: 'bg-error/10 text-error' };

    const servidor = this.#errorServidor();
    if (servidor) return { ok: false, texto: servidor, clases: 'bg-error/10 text-error' };

    const aviso = this.#aviso();
    return aviso
      ? { ok: true, texto: aviso, clases: 'bg-surface-success text-success' }
      : null;
  });

  /**
   * The uploaded template filled with the example applicant, then sanitised.
   *
   * Both halves are untrusted: the template came out of an uploaded file, and
   * the values stand in for a prospect's own typing.
   */
  protected readonly htmlVistaPrevia = computed<string | null>(() => {
    const plantilla = this.#htmlPlantilla();
    if (plantilla === null) return null;

    const sofom = this.#sofom();
    const datos = {
      ...DATOS_EJEMPLO,
      sofom_razon_social: sofom?.razon_social ?? '',
      sofom_rfc: sofom?.rfc ?? '',
      sofom_domicilio: sofom?.domicilio ?? '',
    };

    const lleno = llenarPlantilla(plantilla, datos, BANDERAS_EJEMPLO);
    return this.#sanitizer.sanitize(SecurityContext.HTML, lleno) ?? '';
  });

  constructor() {
    this.#store.dispatch(new CargarPlantillas());
    // The preview substitutes the SOFOM's real identity into the `sofom_*`
    // claves, so the operator sees their own name rather than a placeholder.
    this.#store.dispatch(new CargarSofom());

    this.busqueda.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.consulta.set(q));
  }

  ngAfterViewInit(): void {
    this.titulo().nativeElement.focus();
  }

  protected elegirArchivo(): void {
    this.#errorLocal.set(null);
    this.#store.dispatch(new LimpiarAvisoPlantilla());
    this.entradaArchivo().nativeElement.click();
  }

  protected async archivoElegido(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    // Cleared straight away so choosing the same file twice fires `change`.
    entrada.value = '';
    if (!archivo) return;

    this.#leyendo.set(true);
    this.#errorLocal.set(null);

    try {
      const contenidoHtml = await leerDocx(archivo);
      const usadas = clavesUsadas(contenidoHtml);
      const desconocidas = usadas.filter((c) => !CLAVES_VALIDAS.has(c));

      this.#store.dispatch(
        new SubirPlantilla(
          {
            clave: CLAVE_SOLICITUD,
            nombre: archivo.name.replace(/\.docx$/i, ''),
            contenido_html: contenidoHtml,
            archivo_original: archivo.name,
          },
          desconocidas,
        ),
      );
    } catch (fallo) {
      // A Spanish sentence for the operator. The file itself is never logged:
      // a solicitud template is the SOFOM's own document.
      this.#errorLocal.set(
        fallo instanceof ErrorDocx
          ? fallo.message
          : 'No se pudo leer el documento. Revisa que sea un archivo .docx válido.',
      );
    } finally {
      this.#leyendo.set(false);
    }
  }

  protected alternarVistaPrevia(): void {
    if (this.vistaPreviaAbierta()) {
      this.#store.dispatch(new CerrarVistaPrevia());
      return;
    }
    const activa = this.activa();
    if (activa) this.#store.dispatch(new CargarVistaPrevia(activa.id));
  }

  protected quitar(): void {
    const activa = this.activa();
    if (activa) this.#store.dispatch(new QuitarPlantilla(activa.id));
  }

  /** A clipboard failure from the catalogue, shown with the other messages. */
  protected avisarErrorCopia(mensaje: string): void {
    this.#errorLocal.set(mensaje);
  }
}
