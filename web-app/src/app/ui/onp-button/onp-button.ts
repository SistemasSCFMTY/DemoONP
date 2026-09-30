import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

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
 */
@Component({
  selector: 'onp-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="tipo()"
      [disabled]="deshabilitado()"
      [class]="clases()"
      (click)="pulsar.emit()"
    >
      <ng-content />
    </button>
  `,
})
export class OnpButton {
  readonly variante = input<VarianteBoton>('primary');
  readonly tipo = input<'button' | 'submit'>('button');
  readonly deshabilitado = input(false);
  readonly pulsar = output<void>();

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
