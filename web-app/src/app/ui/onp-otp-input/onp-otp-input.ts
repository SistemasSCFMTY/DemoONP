import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
} from '@angular/core';

/**
 * Six boxes for a one-time code.
 *
 * Ported from `prepararCamposOTP` (onp_fer_etapa2_pf.html:2753), which the
 * plan singles out as something the source already does well: typing advances,
 * Backspace on an empty box retreats, and a pasted six-digit code fills all
 * six at once. That last one matters more than it looks — the code arrives in
 * a notification the prospect copies, and six boxes that reject a paste make
 * people retype digits they are already holding.
 *
 * One accessible group label over six controls (§9), each box labelled by
 * position so a screen reader says "Dígito 3 de 6" rather than "edit text".
 */
@Component({
  selector: 'onp-otp-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onp-otp-input.html',
})
export class OnpOtpInput {
  protected readonly indices = [0, 1, 2, 3, 4, 5];
  protected readonly digitos = signal<readonly string[]>(['', '', '', '', '', '']);

  /** Emits the concatenated code on every change; six characters means ready. */
  readonly codigo = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.enfocar(0));
  }

  protected claseCaja(valor: string): string {
    const base =
      'size-12 rounded-card border-2 text-center font-heading text-h2 font-bold text-navy-deep focus:border-navy focus:outline-none';
    return valor ? `${base} border-gold bg-surface-warning` : `${base} border-border bg-surface`;
  }

  protected escribir(evento: Event, indice: number): void {
    const campo = evento.target as HTMLInputElement;
    const limpio = campo.value.replace(/\D/g, '').slice(0, 1);
    campo.value = limpio;
    this.fijar(indice, limpio);
    if (limpio && indice < 5) this.enfocar(indice + 1);
  }

  protected teclear(evento: KeyboardEvent, indice: number): void {
    const campo = evento.target as HTMLInputElement;
    if (evento.key === 'Backspace' && !campo.value && indice > 0) {
      evento.preventDefault();
      this.fijar(indice - 1, '');
      this.enfocar(indice - 1);
    }
    if (evento.key === 'ArrowLeft' && indice > 0) {
      evento.preventDefault();
      this.enfocar(indice - 1);
    }
    if (evento.key === 'ArrowRight' && indice < 5) {
      evento.preventDefault();
      this.enfocar(indice + 1);
    }
  }

  protected pegar(evento: ClipboardEvent): void {
    evento.preventDefault();
    const pegado = (evento.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!pegado) return;
    const siguiente = ['', '', '', '', '', ''];
    pegado.split('').forEach((d, k) => (siguiente[k] = d));
    this.digitos.set(siguiente);
    this.pintar(siguiente);
    this.codigo.emit(siguiente.join(''));
    this.enfocar(Math.min(pegado.length, 5));
  }

  private fijar(indice: number, valor: string): void {
    const siguiente = [...this.digitos()];
    siguiente[indice] = valor;
    this.digitos.set(siguiente);
    this.pintar(siguiente);
    this.codigo.emit(siguiente.join(''));
  }

  private cajas(): HTMLInputElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLInputElement>('input'));
  }

  /** The `value` binding alone does not repaint a box the user just typed
   *  into, because Angular sees no change; write it back by hand. */
  private pintar(valores: readonly string[]): void {
    this.cajas().forEach((caja, i) => {
      if (caja.value !== valores[i]) caja.value = valores[i];
    });
  }

  private enfocar(indice: number): void {
    this.cajas()[indice]?.focus();
  }
}
