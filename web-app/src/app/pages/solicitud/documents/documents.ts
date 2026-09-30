import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class Documents {}
