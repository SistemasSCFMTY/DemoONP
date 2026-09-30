import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The block that poses a PEP question.
 *
 * A warning-coloured left rule, because a politically-exposed-person
 * declaration is the part of the form with legal weight attached to the
 * answer. Ported from `.pep-section` (onp_fer_etapa2_pf.html:78).
 */
@Component({
  selector: 'onp-pep-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onp-pep-section.html',
  host: {
    class:
      'my-3 block rounded-control border-l-4 border-warning bg-surface-muted p-3.5 text-label leading-relaxed text-text',
  },
})
export class OnpPepSection {}
