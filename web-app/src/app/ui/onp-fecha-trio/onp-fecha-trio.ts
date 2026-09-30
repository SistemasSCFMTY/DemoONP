import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { mensajeDeError } from '../../services/domain/validadores';

/**
 * A DD / MM / AAAA date, as three fields.
 *
 * Three inputs rather than `<input type="date">` on purpose: the source does
 * it this way, a native date picker on a phone is a different interaction on
 * every platform, and the CURP generator wants the parts separately anyway.
 *
 * Each box has its own visually-hidden label — "Día", "Mes", "Año" — because
 * three unlabelled boxes in a row are three unlabelled boxes in a row to a
 * screen reader. The `<fieldset>`'s `<legend>` gives them their subject.
 *
 * Validation lives on the group (`fechaTrio`, `mayorDeEdad`), not on the
 * individual boxes: "31" is only wrong once you know the month is February.
 */
@Component({
  selector: 'onp-fecha-trio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './onp-fecha-trio.html',
})
export class OnpFechaTrio {
  readonly idBase = input.required<string>();
  readonly etiqueta = input.required<string>();
  /** A `FormGroup` with `dia`, `mes` and `anio` controls. */
  readonly grupo = input.required<FormGroup>();
  readonly obligatorio = input(false);

  protected readonly muestraError = computed(() => {
    const g = this.grupo();
    return g.invalid && (g.touched || g.dirty);
  });

  protected readonly textoError = computed(() => mensajeDeError(this.grupo().errors));

  protected readonly clases = computed(() => {
    const base =
      'block min-h-11 w-full rounded-control border bg-surface px-3 py-2.5 text-center text-base tabular-nums focus:border-navy focus:outline-none';
    return this.muestraError() ? `${base} border-error` : `${base} border-border`;
  });
}
