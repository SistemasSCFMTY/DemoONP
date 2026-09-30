import { Validators, type FormBuilder, type FormGroup } from '@angular/forms';
import type { DatosPep } from '../../state/solicitud/solicitud.model';
import { fechaTrio } from './validadores';

/**
 * The PEP declaration form, and the two conditional rules on it.
 *
 * **This is the file 01-conventions.md §8 is about.** The source decides what
 * is required by asking the DOM what is visible — `validarCamposObligatorios`
 * walks up the tree checking `display` (`:3987`) and skips anything hidden.
 * That means the rule lives in a stylesheet: collapse the block with CSS and
 * the required fields quietly stop being required.
 *
 * Here the two rules are declared:
 *
 *  1. Answer "No" to the PEP question and nothing below it is required.
 *     Answer "Sí" and ámbito, institución, puesto, parentesco (familia only)
 *     and the start date all are.
 *  2. Tick "Aún vigente" and the end date stops being required, because
 *     there is no end date for a post someone still holds (`toggleVigencia`,
 *     `:4540`).
 *
 * Both are applied by `aplicarReglasPep`, called whenever either answer
 * changes, and the state of the DOM never enters into it.
 */
export type TipoPep = 'propio' | 'familia';

/** The return type is inferred on purpose, so callers get typed controls. */
export function grupoPep(fb: FormBuilder, valor: DatosPep, tipo: TipoPep) {
  const grupo = fb.nonNullable.group({
    aplica: [valor.aplica],
    ambito: [valor.ambito],
    institucion: [valor.institucion],
    puesto: [valor.puesto],
    parentesco: [valor.parentesco],
    inicio: fb.nonNullable.group(
      {
        dia: [valor.inicio.dia],
        mes: [valor.inicio.mes],
        anio: [valor.inicio.anio],
      },
      { validators: [fechaTrio('dia', 'mes', 'anio')] },
    ),
    vigente: [valor.vigente],
    fin: fb.nonNullable.group(
      {
        dia: [valor.fin.dia],
        mes: [valor.fin.mes],
        anio: [valor.fin.anio],
      },
      { validators: [fechaTrio('dia', 'mes', 'anio')] },
    ),
  });

  aplicarReglasPep(grupo, tipo);
  return grupo;
}

/**
 * Re-declare which controls are required, from the two answers alone.
 *
 * Call it after `aplica` or `vigente` changes. Idempotent: it always sets the
 * complete validator list rather than adding to it, so calling it twice does
 * not stack duplicates.
 */
export function aplicarReglasPep(grupo: FormGroup, tipo: TipoPep): void {
  const aplica = grupo.get('aplica')?.value === true;
  const vigente = grupo.get('vigente')?.value === true;

  const exigir = (nombre: string, requerido: boolean) => {
    const control = grupo.get(nombre);
    if (!control) return;
    control.setValidators(requerido ? [Validators.required] : []);
    control.updateValueAndValidity({ emitEvent: false });
  };

  exigir('ambito', aplica);
  exigir('institucion', aplica);
  exigir('puesto', aplica);
  exigir('parentesco', aplica && tipo === 'familia');

  // The date trios are groups, so the requirement lands on each part.
  for (const parte of ['dia', 'mes', 'anio']) {
    exigir(`inicio.${parte}`, aplica);
    exigir(`fin.${parte}`, aplica && !vigente);
  }

  grupo.get('inicio')?.updateValueAndValidity({ emitEvent: false });
  grupo.get('fin')?.updateValueAndValidity({ emitEvent: false });
}

/**
 * Answering "No" clears what was typed under "Sí".
 *
 * The source does this too (`limpiarBloque`, `:4514`) and it matters for more
 * than tidiness: a puesto left behind a collapsed block still reaches the
 * payload, and an expediente that records a public office for someone who
 * declared they hold none is a compliance problem, not a stale field.
 */
export function limpiarPep(grupo: FormGroup): void {
  grupo.patchValue(
    {
      ambito: '',
      institucion: '',
      puesto: '',
      parentesco: '',
      inicio: { dia: '', mes: '', anio: '' },
      vigente: false,
      fin: { dia: '', mes: '', anio: '' },
    },
    { emitEvent: false },
  );
}
