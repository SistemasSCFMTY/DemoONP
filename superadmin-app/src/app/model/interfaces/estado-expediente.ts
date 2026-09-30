/**
 * The six states an expediente can be in.
 *
 * **These are the Postgres enum `public.estado_expediente`, verbatim.** They
 * are the values that go on the wire, and the Worker rejects anything else.
 *
 * The first version of `02-api-contract.md` listed four, and spelled the third
 * `en_revision` — the panel followed it, and the deployed Worker refused every
 * estado change. The contract has since been corrected against the live
 * database (PR #4). The lesson worth keeping: the contract is the referee
 * between the three projects, but the database is the referee over the
 * contract.
 *
 * `borrador` and `cancelado` were in neither document. An expediente can
 * legitimately arrive in either, so the panel has to render both.
 */
export type EstadoExpediente =
  | 'borrador'
  | 'pendiente'
  | 'revision'
  | 'aprobado'
  | 'rechazado'
  | 'cancelado';
