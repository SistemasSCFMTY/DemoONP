import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-declaratoria',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class Declaratoria {}
