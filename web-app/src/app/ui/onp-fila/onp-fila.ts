import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Two short fields side by side, one above the other when there is no room.
 *
 * A 28-screen form at 390px is a lot of scrolling, and pairing the fields
 * that are genuinely short — código postal, número exterior, teléfono — takes
 * a visible bite out of it. Fields whose content is long or variable do not
 * go in here: a domicilio, a CURP, a full name or a correo keeps the whole
 * row, because halving it only means the text scrolls out of sight while you
 * type it.
 *
 * **Below 360px it collapses to one column.** A two-column row that overflows
 * on a small phone is worse than the single column it replaced, and 320px is
 * still a device people hold. 390 (the design width) and 375 get two columns;
 * 320 gets one.
 *
 * ## Why the two fields align
 *
 * The pair rarely has labels of the same length — "Número exterior" next to
 * "Número interior (Opcional)" — so at a narrow width one wraps to two lines
 * and the other does not. Laid out as two independent columns that drops one
 * input below its neighbour and the row looks broken.
 *
 * Each field is made a subgrid of the row instead, spanning its three bands:
 * label, control, messages. The browser aligns those bands across both
 * columns, so the inputs sit on one line whatever the labels do, and an error
 * under one field pushes nothing out of place. That is why `onp-field` and
 * `onp-select` have exactly three top-level children — changing their
 * structure breaks this.
 *
 * Tab order is DOM order: left to right, then down. The grid reorders nothing.
 *
 * Takes one or two fields. With one it occupies the left column and leaves
 * the right empty, which is what a five-digit código postal wants.
 *
 * The layout itself is in `styles.css` under "Two-column form rows", so the
 * 360px threshold is written once and shared with the `xs:` utility variant.
 */
@Component({
  selector: 'onp-fila',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class OnpFila {}
