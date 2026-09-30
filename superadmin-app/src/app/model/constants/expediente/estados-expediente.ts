import { EstadoExpediente } from '../../interfaces/estado-expediente';

/**
 * One estado, everything the UI needs to paint it.
 *
 * `etiqueta` is the short form the table badge shows; `etiquetaLarga` is the
 * long form the detail view's selector shows. Both are verbatim from the
 * source (`onp_fer_etapa2_pf.html:5443` and `:5482`).
 *
 * §9: colour never carries meaning alone, so every estado also names a Lucide
 * icon. The source's badge palette used four hexes that are not in the §3
 * table (`#1565c0`, `#fff4d6`, `#e3f2fd`, `#e3f5eb`, `#fbe6e6`); rather than
 * widen the shared palette for one badge, each estado maps to a §3 token and
 * the badge tints it. `en_revision` therefore reads navy where the source read
 * blue — closest thing in the palette, and the icon carries the meaning.
 */
export interface DefinicionEstado {
  readonly valor: EstadoExpediente;
  readonly etiqueta: string;
  readonly etiquetaLarga: string;
  /** A `@lucide/angular` icon name, resolved by the component that renders it. */
  readonly icono: 'Clock' | 'Search' | 'Check' | 'X';
  /** Tailwind classes built from §3 tokens. No hex in a template. */
  readonly clases: string;
}

export const ESTADOS_EXPEDIENTE: readonly DefinicionEstado[] = [
  {
    valor: 'pendiente',
    etiqueta: 'Pendiente',
    etiquetaLarga: 'Pendiente de revisión',
    icono: 'Clock',
    clases: 'bg-warning/10 text-warning',
  },
  {
    valor: 'en_revision',
    etiqueta: 'En revisión',
    etiquetaLarga: 'En revisión',
    icono: 'Search',
    clases: 'bg-navy/10 text-navy',
  },
  {
    valor: 'aprobado',
    etiqueta: 'Aprobado',
    etiquetaLarga: 'Aprobado',
    icono: 'Check',
    clases: 'bg-success/10 text-success',
  },
  {
    valor: 'rechazado',
    etiqueta: 'Rechazado',
    etiquetaLarga: 'Rechazado',
    icono: 'X',
    clases: 'bg-error/10 text-error',
  },
];

const POR_VALOR = new Map<EstadoExpediente, DefinicionEstado>(
  ESTADOS_EXPEDIENTE.map((e) => [e.valor, e]),
);

/**
 * The source falls back to `pendiente` for an unknown estado (`:5444`); so do
 * we, rather than painting an empty badge.
 */
export function definicionEstado(valor: EstadoExpediente | null | undefined): DefinicionEstado {
  return (valor && POR_VALOR.get(valor)) || ESTADOS_EXPEDIENTE[0];
}
