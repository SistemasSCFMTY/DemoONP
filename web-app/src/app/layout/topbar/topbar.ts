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
  template: `
    <header class="w-full bg-navy">
      <div class="mx-auto flex w-full max-w-app items-center gap-2 px-3 py-2">
        <button
          type="button"
          class="grid size-11 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-navy-deep disabled:opacity-35"
          [disabled]="!puedeRegresar()"
          (click)="regresar.emit()"
        >
          <svg lucideArrowLeft class="size-5" aria-hidden="true"></svg>
          <span class="sr-only">Regresar al paso anterior</span>
        </button>
        <p class="min-w-0 truncate font-heading text-topbar font-semibold text-white">
          {{ titulo() }}
        </p>
      </div>
    </header>
  `,
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
