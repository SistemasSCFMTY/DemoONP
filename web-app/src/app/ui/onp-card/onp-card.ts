import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A white card on the cream ground.
 *
 * That contrast is the whole visual system (the `onp-design` skill): the page
 * is warm cream, cards are white on it, and the separation is a 1px hairline
 * rather than a shadow. `card` radius, `ring` elevation (01-conventions.md §4).
 */
@Component({
  selector: 'onp-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'mb-3 block rounded-card border border-border bg-surface p-4',
  },
})
export class OnpCard {}
