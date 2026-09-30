import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { OnpButton } from '../onp-button/onp-button';

/**
 * A modal dialog over the flow.
 *
 * Implemented on the native `<dialog>` so the browser supplies the focus trap,
 * the inert background and the top-layer stacking — three things every
 * hand-rolled modal gets subtly wrong, and the a11y contract (§9) requires all
 * three. Escape closes it and focus returns to the trigger, which `<dialog>`
 * also handles.
 *
 * Replaces `showModal` (onp_fer_etapa2_pf.html:6041), which toggled a class on
 * a div and left the page behind it focusable.
 */
@Component({
  selector: 'onp-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OnpButton],
  template: `
    <dialog
      class="w-11/12 max-w-sm rounded-card border border-border bg-surface p-6 shadow-e3 backdrop:bg-navy-deep/50"
      [attr.aria-labelledby]="idModal() + '-titulo'"
      (close)="cerrar.emit()"
      (click)="clicEnFondo($event)"
    >
      <h2 [id]="idModal() + '-titulo'" class="mb-3 font-heading text-h2 font-bold text-navy-deep">
        {{ titulo() }}
      </h2>
      <div class="mb-4 text-body leading-relaxed whitespace-pre-line text-text">
        <ng-content />
      </div>
      <onp-button (pulsar)="cerrar.emit()">{{ textoCerrar() }}</onp-button>
    </dialog>
  `,
})
export class OnpModal {
  readonly idModal = input.required<string>();
  readonly titulo = input.required<string>();
  readonly abierto = input.required<boolean>();
  readonly textoCerrar = input('Entendido');
  readonly cerrar = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const dialogo = this.host.nativeElement.querySelector('dialog');
      if (!dialogo) return;
      if (this.abierto() && !dialogo.open) dialogo.showModal();
      if (!this.abierto() && dialogo.open) dialogo.close();
    });
  }

  /** A click on the backdrop lands on the dialog element itself, never on its
   *  children — that is how you tell the two apart without a wrapper div. */
  protected clicEnFondo(evento: MouseEvent): void {
    if (evento.target === this.host.nativeElement.querySelector('dialog')) {
      this.cerrar.emit();
    }
  }
}
