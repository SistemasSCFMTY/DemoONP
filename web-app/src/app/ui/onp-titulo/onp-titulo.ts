import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

/**
 * The screen title, and the lede under it.
 *
 * This is the route's one `<h1>`, and it takes focus after render so a screen
 * reader announces the new step instead of leaving the user somewhere in the
 * middle of the previous one (01-conventions.md §9). `tabindex="-1"` makes it
 * focusable programmatically without putting it in the tab order.
 *
 * At 18px it is the `h2` size token — §2 names the tokens by role, and the
 * screen title's role is "h2" even though the element is `h1`.
 *
 * No kicker above it. Ever (§2).
 */
@Component({
  selector: 'onp-titulo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1
      #encabezado
      tabindex="-1"
      class="mb-2 font-heading text-h2 font-bold text-navy-deep outline-none"
    >
      {{ texto() }}
    </h1>
    @if (lede()) {
      <p class="mb-4 text-body leading-relaxed text-text-soft">{{ lede() }}</p>
    }
  `,
})
export class OnpTitulo {
  readonly texto = input.required<string>();
  readonly lede = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    });
  }
}
