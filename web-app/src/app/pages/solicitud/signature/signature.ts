import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-signature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class Signature {}
