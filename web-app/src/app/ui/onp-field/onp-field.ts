import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { mensajeDeError } from '../../services/domain/validadores';

export type TipoCampo = 'text' | 'email' | 'tel' | 'password' | 'number';

/**
 * A labelled text input with inline validation.
 *
 * The accessibility contract, all in one place so no screen has to remember
 * it (01-conventions.md §8, §9):
 *
 *  - a real `<label for>`; a placeholder is never a label
 *  - the required marker is the label's asterisk in `error` PLUS
 *    `aria-required` — the asterisk alone is invisible to a screen reader
 *  - the error message sits under the field, names what is wrong in Spanish,
 *    and is wired with `aria-describedby` + `aria-invalid`
 *  - 16px computed font-size, or iOS zooms the viewport on focus and the
 *    prospect loses their place (§5). The 13px of the visual scale applies to
 *    the label, not to what you type into.
 *
 * The message comes from the validator itself (`mensajeDeError`), so adding a
 * rule does not mean editing a lookup table somewhere else.
 */
@Component({
  selector: 'onp-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './onp-field.html',
  // Exactly three children — label, control, messages — and the spacing on
  // the host rather than an inner wrapper. `onp-fila` relies on that shape:
  // it makes each field a subgrid of the row, so a label that wraps to two
  // lines in one column does not push its input out of line with the other.
  host: { class: 'mb-4 block' },
})
export class OnpField {
  readonly idCampo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly control = input.required<FormControl>();
  readonly tipo = input<TipoCampo>('text');
  readonly marcador = input('');
  readonly ayuda = input('');
  /** A success line under the field — "✓ CURP válida y coincide" becomes this. */
  readonly exito = input('');
  readonly maxlength = input<number | null>(null);
  readonly modoEntrada = input('');
  readonly autocompletar = input('');
  readonly obligatorio = input(false);
  readonly soloLectura = input(false);
  /** Set when the OCR filled it, so the prospect can see what was read for
   *  them and what they typed themselves (`.detectado`, :93). */
  readonly detectado = input(false);

  protected readonly muestraError = computed(() => {
    const c = this.control();
    return c.invalid && (c.touched || c.dirty);
  });

  protected readonly textoError = computed(() => mensajeDeError(this.control().errors));

  protected readonly descritoPor = computed(() => {
    const partes: string[] = [];
    if (this.ayuda()) partes.push(`${this.idCampo()}-ayuda`);
    if (this.muestraError()) partes.push(`${this.idCampo()}-error`);
    return partes.length ? partes.join(' ') : null;
  });

  protected readonly clasesInput = computed(() => {
    const base =
      'block min-h-11 w-full rounded-control border px-3 py-2.5 text-base focus:border-navy focus:outline-none';
    if (this.soloLectura()) return `${base} border-border bg-bg text-text-soft`;
    if (this.muestraError()) return `${base} border-error bg-surface`;
    if (this.detectado()) return `${base} border-success bg-surface-success`;
    return `${base} border-border bg-surface`;
  });
}
