import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One card of the expediente detail.
 *
 * Ported from the source's `.seccion` (`:118`–`:119`): a white card on the
 * cream ground, hairline border, and a heading underlined in `gold-light`.
 * That gold rule is the only ornament in the whole screen and it is worth
 * keeping — it is what makes a long column of fields read as sections.
 *
 * §4: `rounded-card` and `shadow-ring`. The detail view is a page of in-flow
 * cards, so nothing here is raised.
 */
@Component({
  selector: 'panel-seccion',
  templateUrl: './seccion.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Seccion {
  readonly titulo = input.required<string>();
}
