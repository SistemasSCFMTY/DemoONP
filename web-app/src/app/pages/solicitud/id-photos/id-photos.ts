import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-id-photos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class IdPhotos {}
