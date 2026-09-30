import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'onp-video',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<p>Pendiente</p>',
})
export class Video {}
