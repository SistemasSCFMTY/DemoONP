/**
 * The four states an expediente can be in.
 *
 * From `02-api-contract.md` → `PATCH /expedientes/:id`. Note `en_revision`:
 * the source HTML spells this state `revision` (`onp_fer_etapa2_pf.html:5443`),
 * the contract spells it `en_revision`, and the contract is the referee (§12).
 */
export type EstadoExpediente = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
