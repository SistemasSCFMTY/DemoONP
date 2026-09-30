import { EstadoExpediente } from '../../interfaces/estado-expediente';

/** The Lucide icons an estado chip can carry. */
export type IconoEstado =
  | 'PencilLine'
  | 'Clock'
  | 'Search'
  | 'Check'
  | 'X'
  | 'Ban'
  | 'CircleHelp';

/**
 * One estado, everything the UI needs to paint it.
 *
 * `valor` is the Postgres enum value and goes on the wire untouched.
 * `etiqueta` and `etiquetaLarga` are Spanish for a human to read — the short
 * form in the table badge, the long form in the detail selector — and they do
 * **not** have to match the slug. "En revisión" reads better than "Revisión"
 * and transmits as `revision`.
 *
 * The four the source defines keep its wording verbatim
 * (`onp_fer_etapa2_pf.html:5443` and `:5482`). `borrador` and `cancelado` are
 * in the database but in neither the source nor the original contract, so
 * their labels are new.
 *
 * §9: colour never carries meaning alone, so every estado also names an icon.
 * The source's badge palette used five hexes that are not in the §3 table;
 * rather than widen a palette that must stay in step with `web-app/`, each
 * estado uses the §3 tinted grounds. `revision` therefore reads navy where the
 * source read blue, and the icon carries the distinction.
 *
 * The grounds are the `surface-*` tokens, not an alpha wash of the foreground:
 * `bg-warning/10` renders differently over a white card than over the cream
 * ground, and these chips sit on both. `rechazado` is the exception — §3 has
 * no `surface-error`, so it keeps `bg-error/10` until one is registered.
 * Raised in PR #3.
 */
export interface DefinicionEstado {
  readonly valor: EstadoExpediente;
  readonly etiqueta: string;
  readonly etiquetaLarga: string;
  readonly icono: IconoEstado;
  /** Tailwind classes built from §3 tokens. No hex in a template. */
  readonly clases: string;
}

export const ESTADOS_EXPEDIENTE: readonly DefinicionEstado[] = [
  {
    valor: 'borrador',
    etiqueta: 'Borrador',
    etiquetaLarga: 'Borrador sin enviar',
    icono: 'PencilLine',
    clases: 'bg-surface-muted text-text-soft',
  },
  {
    valor: 'pendiente',
    etiqueta: 'Pendiente',
    etiquetaLarga: 'Pendiente de revisión',
    icono: 'Clock',
    clases: 'bg-surface-warning text-warning',
  },
  {
    valor: 'revision',
    etiqueta: 'En revisión',
    etiquetaLarga: 'En revisión',
    icono: 'Search',
    clases: 'bg-surface-info text-navy',
  },
  {
    valor: 'aprobado',
    etiqueta: 'Aprobado',
    etiquetaLarga: 'Aprobado',
    icono: 'Check',
    clases: 'bg-surface-success text-success',
  },
  {
    valor: 'rechazado',
    etiqueta: 'Rechazado',
    etiquetaLarga: 'Rechazado',
    icono: 'X',
    clases: 'bg-error/10 text-error',
  },
  {
    valor: 'cancelado',
    etiqueta: 'Cancelado',
    etiquetaLarga: 'Cancelado',
    icono: 'Ban',
    clases: 'bg-surface-muted text-text-soft',
  },
];

/**
 * The estados an operator may set from the detail view.
 *
 * The four the source's selector offers (`:5482`), and no more. `borrador` is
 * the prospect's own unsent draft and is not the panel's to assign;
 * `cancelado` may well belong here, but **what an estado transition allows is
 * the owner's call** (`01-conventions.md` §12) and the source does not answer
 * it. Widening this list is a one-line change once they rule.
 */
export const ESTADOS_ASIGNABLES: readonly DefinicionEstado[] = ESTADOS_EXPEDIENTE.filter(
  (e) => e.valor !== 'borrador' && e.valor !== 'cancelado',
);

const POR_VALOR = new Map<EstadoExpediente, DefinicionEstado>(
  ESTADOS_EXPEDIENTE.map((e) => [e.valor, e]),
);

/**
 * A chip for a value the database produced but this build does not know.
 *
 * The source falls back to `pendiente` for an unrecognised estado (`:5444`),
 * which is worse than showing nothing: it labels a record with a state it is
 * not in. This shows the raw value in a neutral chip instead — legible, and
 * obviously unhandled to whoever has to fix it.
 *
 * That is not hypothetical. The enum gained two values between the contract
 * being written and the database being read, and this is what stops the next
 * one from quietly mislabelling a KYC file.
 */
function desconocido(valor: string): DefinicionEstado {
  return {
    valor: valor as EstadoExpediente,
    etiqueta: valor,
    etiquetaLarga: valor,
    icono: 'CircleHelp',
    clases: 'bg-surface-muted text-text-soft',
  };
}

export function definicionEstado(valor: EstadoExpediente | null | undefined): DefinicionEstado {
  if (!valor) return desconocido('Sin estado');
  return POR_VALOR.get(valor) ?? desconocido(valor);
}
