import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-complete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class Complete {}
