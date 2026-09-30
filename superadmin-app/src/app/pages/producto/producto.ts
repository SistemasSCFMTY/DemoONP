import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LucideCircleAlert, LucideCircleCheck, LucideLoaderCircle } from '@lucide/angular';
import { Store, select } from '@ngxs/store';

import { Producto } from '../../model/interfaces/producto';
import { ejemplosDe } from '../../services/domain/credito';
import {
  CargarProducto,
  GuardarProducto,
  LimpiarAvisoProducto,
} from '../../state/producto/producto.actions';
import { ProductoState } from '../../state/producto/producto.state';
import { DatoFila } from '../../ui/dato-fila/dato-fila';
import { Seccion } from '../../ui/seccion/seccion';

interface Aviso {
  readonly ok: boolean;
  readonly titulo: string;
  readonly texto: string;
  readonly clases: string;
}

function pesos(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

/**
 * The product parameters the prospect's simulator runs on.
 *
 * Ported from the source's Producto tab (`:1922`–`:1994`) and
 * `guardarProducto` (`:5385`) — same fields, same copy, same three validation
 * messages.
 *
 * **The preview is computed, not illustrated.** "Cómo queda" amortises three
 * worked examples from whatever is currently in the form, through the same
 * functions the prospect's simulator uses (`services/domain/credito.ts`).
 * §11 bans a figure with no source; a preview that re-derives itself as you
 * type is also the only version of this card worth having.
 *
 * Two fields the source's screen edits are absent: "Incremento de la barra"
 * (`monto_paso`) and "Incremento (meses)" (`plazo_paso`). They are in
 * `PRODUCTO` (`:2340`) but not in `02-api-contract.md`, so the panel does not
 * invent them — raised for `onp-backend` and the owner in the PR.
 */
@Component({
  selector: 'panel-producto',
  imports: [
    ReactiveFormsModule,
    Seccion,
    DatoFila,
    LucideLoaderCircle,
    LucideCircleCheck,
    LucideCircleAlert,
  ],
  templateUrl: './producto.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoVista implements AfterViewInit {
  readonly #store = inject(Store);
  readonly #fb = inject(FormBuilder);

  private readonly titulo = viewChild.required<ElementRef<HTMLElement>>('titulo');

  protected readonly cargando = select(ProductoState.cargando);
  protected readonly guardando = select(ProductoState.guardando);
  readonly #guardado = select(ProductoState.guardado);
  readonly #errorServidor = select(ProductoState.error);
  readonly #producto = select(ProductoState.producto);

  protected readonly formulario = this.#fb.nonNullable.group({
    monto_min: [0],
    monto_max: [0],
    plazo_min: [0],
    plazo_max: [0],
    tasa_anual: [0],
    comision_apertura: [false],
    comision_pct: [0],
    comision_desde: [0],
  });

  /**
   * The form's live value, so the preview re-derives as the operator types.
   *
   * A signal fed from two places rather than `toSignal(valueChanges)`: the
   * arriving parameters are patched in with `emitEvent: false` (patching must
   * not read as an edit), and `valueChanges` therefore never fires for them.
   * Deriving the preview from the stream alone left "Cómo queda" showing the
   * empty-form state after a successful load — caught by producto.spec.ts.
   */
  readonly #valor = signal(this.formulario.getRawValue());

  readonly #errorLocal = signal<Aviso | null>(null);

  protected readonly cobraComision = computed(() => this.#valor().comision_apertura);

  protected readonly textoBoton = computed(() =>
    this.guardando() ? 'Guardando…' : 'Guardar parámetros',
  );

  protected readonly aviso = computed<Aviso | null>(() => {
    const local = this.#errorLocal();
    if (local) return local;

    const servidor = this.#errorServidor();
    if (servidor) {
      // A failure with nothing loaded is a read that did not land, not a
      // rejected save. `GET /producto` currently 500s against the live
      // Worker — migration 0001 has not been run and the `producto` table
      // does not exist yet — so this is the state the panel shows today, and
      // it should not claim the operator's edit was refused.
      return {
        ok: false,
        titulo: this.#producto() ? 'No se pudo guardar' : 'No se pudieron cargar los parámetros',
        texto: servidor,
        clases: 'bg-error/10 text-error',
      };
    }

    return this.#guardado()
      ? {
          ok: true,
          titulo: 'Guardado',
          texto: 'Los parámetros del producto quedaron registrados. El simulador ya los usa.',
          clases: 'bg-surface-success text-success',
        }
      : null;
  });

  /**
   * The three worked examples from `vistaProducto` (`:5370`), recomputed from
   * the form on every keystroke.
   *
   * Empty until the inputs describe a product that can be amortised, rather
   * than printing `$NaN/mes` while someone is mid-type.
   */
  protected readonly ejemplos = computed(() => {
    const p = this.#comoProducto();
    if (p.monto_min <= 0 || p.monto_max < p.monto_min) return [];
    if (p.plazo_min <= 0 || p.plazo_max < p.plazo_min) return [];
    if (p.tasa_anual <= 0) return [];

    return ejemplosDe(p).map((e) => ({
      monto: e.monto,
      encabezado: `${pesos(e.monto)} a ${e.meses} meses`,
      detalle: `${pesos(e.pago)}/mes · CAT ${e.cat.toFixed(1)}%`,
    }));
  });

  constructor() {
    this.#store.dispatch(new CargarProducto());

    // Rehydrate the form when the parameters arrive, without echoing the
    // patch back out as an edit.
    effect(() => {
      const p = this.#producto();
      if (!p) return;
      this.formulario.patchValue(p, { emitEvent: false });
      this.#valor.set(this.formulario.getRawValue());
    });

    this.formulario.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.#valor.set(this.formulario.getRawValue());
      this.#limpiarAviso();
    });
  }

  ngAfterViewInit(): void {
    this.titulo().nativeElement.focus();
  }

  protected guardar(): void {
    const p = this.#comoProducto();

    // The source's three checks and its three messages, verbatim (`:5398`).
    if (p.monto_min <= 0 || p.monto_max <= p.monto_min) {
      this.#fallar(
        'Montos inválidos',
        'El monto máximo debe ser mayor al mínimo, y ambos mayores a cero.',
      );
      return;
    }
    if (p.plazo_min <= 0 || p.plazo_max < p.plazo_min) {
      this.#fallar('Plazos inválidos', 'El plazo máximo debe ser mayor o igual al mínimo.');
      return;
    }
    if (p.tasa_anual <= 0) {
      this.#fallar('Tasa inválida', 'La tasa anual debe ser mayor a cero.');
      return;
    }

    this.#errorLocal.set(null);
    this.#store.dispatch(new GuardarProducto(p));
  }

  /**
   * The form as the contract's eight fields.
   *
   * A cleared number input reads back as `null` through the value accessor
   * even on a `nonNullable` group, so every numeric field is coerced — the
   * preview must never print `$NaN` while somebody is mid-edit.
   */
  #comoProducto(): Producto {
    const v = this.#valor();
    const n = (x: number): number => (Number.isFinite(x) ? Number(x) : 0);

    return {
      monto_min: n(v.monto_min),
      monto_max: n(v.monto_max),
      plazo_min: n(v.plazo_min),
      plazo_max: n(v.plazo_max),
      tasa_anual: n(v.tasa_anual),
      comision_apertura: v.comision_apertura,
      comision_pct: n(v.comision_pct),
      comision_desde: n(v.comision_desde),
    };
  }

  #fallar(titulo: string, texto: string): void {
    this.#errorLocal.set({ ok: false, titulo, texto, clases: 'bg-error/10 text-error' });
  }

  #limpiarAviso(): void {
    this.#errorLocal.set(null);
    this.#store.dispatch(new LimpiarAvisoProducto());
  }
}
