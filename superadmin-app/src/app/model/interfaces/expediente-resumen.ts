import { EstadoExpediente } from './estado-expediente';

/**
 * One row of the expedientes table.
 *
 * Shape from `02-api-contract.md` → `GET /expedientes`. Deliberately narrow:
 * the list view mints no signed URLs and carries no address, income or PEP
 * data, because a table that fetches more PII than it paints is a leak waiting
 * for a stray log line.
 */
export interface ExpedienteResumen {
  readonly id: string;
  readonly folio: string;
  readonly nombre_completo: string | null;
  readonly curp: string | null;
  readonly estado: EstadoExpediente;
  readonly monto_solicitado: number | null;
  /** ISO 8601. */
  readonly creado_en: string;
}

/** `GET /expedientes` response. */
export interface PaginaExpedientes {
  readonly items: readonly ExpedienteResumen[];
  readonly total: number;
}

/**
 * The query the list view sends, and the query string it writes into the URL.
 *
 * §12 requires filters and page to survive a reload, so these four live in
 * `queryParamMap` and that map is the single load path. `q` is an operator's
 * own search term — a folio, a name, a CURP they were handed — and it is the
 * one thing in this app that is allowed into a URL. No expediente FIELD value
 * ever is: the detail route addresses a row by its opaque id.
 */
export interface FiltrosExpedientes {
  readonly q: string;
  readonly estado: EstadoExpediente | null;
  readonly limit: number;
  readonly offset: number;
}
