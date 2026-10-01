import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';

export type VarianteBoton = 'primary' | 'secondary' | 'enlace';

/**
 * The full-width action button.
 *
 * Rounded rectangle at `control` radius, never a pill (01-conventions.md §4).
 * Minimum height 44px so it clears the tap-target floor (§5) — the source's
 * 12px padding on a 14px line lands at about 42.
 *
 * A disabled primary button is grey with no hover: the source's own
 * behaviour, and it matters because half the screens gate "Continuar" behind
 * a checkbox and the prospect must see that the gate is the reason.
 *
 * **`cargando` is for a request in flight, `deshabilitado` for a gate the
 * prospect has not met.** They look the same and mean opposite things: one
 * says "wait", the other says "do something first". Keep them apart at the
 * call site — `[deshabilitado]="!hayTrazo()" [cargando]="enviando()"`, not
 * the two OR-ed into one input — or the screen loses the ability to say
 * which it is. `cargando` disables on its own, so the OR is never needed.
 */
@Component({
  selector: 'onp-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideLoaderCircle],
  templateUrl: './onp-button.html',
})
export class OnpButton {
  readonly variante = input<VarianteBoton>('primary');
  readonly tipo = input<'button' | 'submit'>('button');
  readonly deshabilitado = input(false);
  /** A request is in flight: spinner, `aria-busy`, and no second click. */
  readonly cargando = input(false);
  readonly pulsar = output<void>();

  /**
   * A button that is busy must not be clickable again. Submitting the
   * expediente twice is not a cosmetic problem — it is two folios for one
   * person, which is the same hazard CP-V4 refuses to create by retrying.
   */
  protected readonly inhabilitado = computed(() => this.deshabilitado() || this.cargando());

  private static readonly COMUNES =
    'mt-3 min-h-11 w-full cursor-pointer rounded-control px-4 py-3 text-h3 font-semibold transition-colors disabled:cursor-not-allowed';

  protected readonly clases = computed(() => {
    switch (this.variante()) {
      case 'secondary':
        return `${OnpButton.COMUNES} border-2 border-navy bg-surface text-navy hover:bg-bg disabled:border-border disabled:text-text-soft`;
      case 'enlace':
        return 'min-h-11 cursor-pointer bg-transparent px-2 text-body font-semibold text-navy underline underline-offset-2 disabled:cursor-not-allowed disabled:text-text-soft disabled:no-underline';
      default:
        return `${OnpButton.COMUNES} border border-transparent bg-navy text-white hover:bg-navy-deep disabled:bg-border disabled:text-text-soft`;
    }
  });
}
