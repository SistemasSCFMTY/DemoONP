import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { LucideCircleAlert, LucideInbox, LucideSearch } from '@lucide/angular';
import { Store, select } from '@ngxs/store';
import { TableModule, TablePageEvent } from 'primeng/table';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { ESTADOS_EXPEDIENTE } from '../../model/constants/expediente/estados-expediente';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import { FiltrosExpedientes } from '../../model/interfaces/expediente-resumen';
import { FechaMxPipe } from '../../pipes/fecha-mx.pipe';
import { PesosPipe } from '../../pipes/pesos.pipe';
import { CargarExpedientes } from '../../state/expedientes/expedientes.actions';
import { ExpedientesState } from '../../state/expedientes/expedientes.state';
import { EstadoBadge } from '../../ui/estado-badge/estado-badge';

interface OpcionEstado {
  readonly valor: EstadoExpediente | null;
  readonly etiqueta: string;
}

const POR_PAGINA = 25;

/** Every estado the filter row accepts, plus "Todos". */
const OPCIONES_ESTADO: readonly OpcionEstado[] = [
  { valor: null, etiqueta: 'Todos' },
  ...ESTADOS_EXPEDIENTE.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta })),
];

const VALORES_ESTADO = new Set<string>(ESTADOS_EXPEDIENTE.map((e) => e.valor));

const SIN_FILTROS: FiltrosExpedientes = { q: '', estado: null, limit: POR_PAGINA, offset: 0 };

/** The URL is the schema: this is how it is read, and the only way. */
function leerFiltros(mapa: ParamMap): FiltrosExpedientes {
  const estado = mapa.get('estado');
  const desde = Number.parseInt(mapa.get('desde') ?? '0', 10);

  return {
    q: (mapa.get('q') ?? '').trim(),
    estado: estado && VALORES_ESTADO.has(estado) ? (estado as EstadoExpediente) : null,
    limit: POR_PAGINA,
    offset: Number.isFinite(desde) && desde > 0 ? desde : 0,
  };
}

/**
 * The expedientes table.
 *
 * **`queryParamMap` is the single load path** (§12). Typing in the search box
 * fetches nothing — it writes `q` into the URL, and the URL change is what
 * dispatches `CargarExpedientes`. So a reload, the back button and a pasted
 * link all land on exactly the rows the operator was looking at.
 *
 * The search matches the three fields `pintarExpedientes` matches
 * (`onp_fer_etapa2_pf.html:5426`): nombre, CURP, folio. `q` is an operator's
 * own search term and is the only thing in this app allowed into a URL — no
 * expediente field value ever is.
 */
@Component({
  selector: 'panel-expedientes',
  imports: [
    ReactiveFormsModule,
    TableModule,
    EstadoBadge,
    PesosPipe,
    FechaMxPipe,
    LucideSearch,
    LucideInbox,
    LucideCircleAlert,
  ],
  templateUrl: './expedientes.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Expedientes implements AfterViewInit {
  readonly #store = inject(Store);
  readonly #router = inject(Router);
  readonly #ruta = inject(ActivatedRoute);

  /** §9: the page title takes focus on navigation. */
  private readonly titulo = viewChild.required<ElementRef<HTMLElement>>('titulo');

  readonly #items = select(ExpedientesState.items);

  /**
   * `p-table` declares `value` as a mutable array, and the state's is readonly
   * because §7 makes state immutable. One copy per load reconciles the two —
   * the table never writes to it, but its type says it could.
   */
  protected readonly filas = computed(() => [...this.#items()]);
  protected readonly total = select(ExpedientesState.total);
  protected readonly cargando = select(ExpedientesState.cargandoLista);
  protected readonly errorLista = select(ExpedientesState.errorLista);

  protected readonly opcionesEstado = OPCIONES_ESTADO;
  protected readonly porPagina = POR_PAGINA;

  protected readonly busqueda = new FormControl('', { nonNullable: true });

  /** Mirrors what is in the URL, so the controls can show it back. */
  readonly #filtros = signal<FiltrosExpedientes>(SIN_FILTROS);

  protected readonly estadoActivo = computed(() => this.#filtros().estado);
  protected readonly desde = computed(() => this.#filtros().offset);

  protected readonly resumen = computed(() => {
    if (this.cargando()) return 'Consultando expedientes…';
    const n = this.total();
    if (n === 0) return 'Sin resultados';
    return n === 1 ? '1 expediente' : `${n} expedientes`;
  });

  /** The source shows a different empty message when a search is active (`:5438`). */
  protected readonly mensajeVacio = computed(() =>
    this.#filtros().q
      ? 'Ningún expediente coincide con la búsqueda.'
      : 'Todavía no hay expedientes registrados.',
  );

  constructor() {
    // Seed the box from the URL without echoing the value straight back out.
    this.busqueda.setValue(this.#ruta.snapshot.queryParamMap.get('q') ?? '', {
      emitEvent: false,
    });

    this.busqueda.valueChanges
      .pipe(
        debounceTime(250),
        map((v) => v.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((q) => this.#irA({ q: q || null, desde: 0 }));

    // The single load path. Nothing else in this component dispatches.
    this.#ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((mapa) => {
      const filtros = leerFiltros(mapa);
      this.#filtros.set(filtros);
      this.#store.dispatch(new CargarExpedientes(filtros));
    });
  }

  ngAfterViewInit(): void {
    this.titulo().nativeElement.focus();
  }

  protected filtrarPorEstado(estado: EstadoExpediente | null): void {
    this.#irA({ estado, desde: 0 });
  }

  protected irAPagina(evento: TablePageEvent): void {
    this.#irA({ desde: evento.first });
  }

  protected abrir(id: string): void {
    void this.#router.navigate(['/expedientes', id]);
  }

  /**
   * Writes the change into the URL and stops there. The `queryParamMap`
   * subscription above is what loads.
   *
   * `replaceUrl` so that typing a search term leaves one history entry rather
   * than one per keystroke.
   */
  #irA(cambio: { q?: string | null; estado?: EstadoExpediente | null; desde?: number }): void {
    const queryParams: Record<string, string | null> = {};
    if ('q' in cambio) queryParams['q'] = cambio.q || null;
    if ('estado' in cambio) queryParams['estado'] = cambio.estado ?? null;
    if ('desde' in cambio) queryParams['desde'] = cambio.desde ? String(cambio.desde) : null;

    void this.#router.navigate([], {
      relativeTo: this.#ruta,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
