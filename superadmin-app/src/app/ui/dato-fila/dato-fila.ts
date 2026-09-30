import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * One label/value row of the expediente.
 *
 * Ported from `fila()` (`onp_fer_etapa2_pf.html:5464`), including its empty
 * state: a missing value reads **"No proporcionado"**, set apart in italic and
 * a lighter colour, rather than leaving a blank an operator has to interpret.
 *
 * A `<dl>` row rather than the source's two divs, so the pairing is in the
 * markup and not only in the visual alignment. The parent supplies the `<dl>`.
 */
@Component({
  selector: 'panel-dato-fila',
  templateUrl: './dato-fila.html',
  host: { class: 'block text-sm' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatoFila {
  readonly clave = input.required<string>();
  readonly valor = input<string | number | null | undefined>(null);

  protected readonly vacio = computed(() => {
    const v = this.valor();
    return v === null || v === undefined || v === '';
  });
}
