import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideArrowLeft } from '@lucide/angular';

/**
 * The sticky bar: back button plus the stage title.
 *
 * The title here is NOT the page's `<h1>` — that is the screen title inside
 * the body, which takes focus on navigation (01-conventions.md §9). This is
 * chrome, and a second `<h1>` in the chrome would announce the wrong thing.
 *
 * The source's back button is 32px square, below the 44px minimum
 * (departure 9). It is 44 here, with the glyph still visually small.
 *
 * The navy spans the viewport and the row inside it is capped at
 * `max-w-app`, so the bar stays a bar on a laptop instead of a 390px stub.
 */
@Component({
  selector: 'onp-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideArrowLeft],
  templateUrl: './topbar.html',
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 20;
      display: block;
    }
  `,
})
export class Topbar {
  readonly titulo = input.required<string>();
  readonly puedeRegresar = input.required<boolean>();
  readonly regresar = output<void>();
}
