import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The captured photograph, shown back to the prospect.
 *
 * This is the frame that sells the capture on stage: the photograph they just
 * took of their own credential, at full width on a white card. `card` radius,
 * hairline border (01-conventions.md §4).
 *
 * The `alt` is required rather than defaulted — "Lado frontal de tu
 * identificación" and "Tu firma" are different things and a shared default
 * would describe neither.
 */
@Component({
  selector: 'onp-preview-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="my-2.5">
      <img
        [src]="fuente()"
        [alt]="descripcion()"
        class="block w-full rounded-card border border-border bg-surface"
      />
      @if (pie()) {
        <figcaption class="mt-1 text-status text-text-soft">{{ pie() }}</figcaption>
      }
    </figure>
  `,
})
export class OnpPreviewBox {
  readonly fuente = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly pie = input('');
}
