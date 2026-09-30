import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-pep-propio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class PepPropio {}
