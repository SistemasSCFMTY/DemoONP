/**
 * The CURP the "Modo demostración" tip on `verificar-cliente` tells the
 * presenter to type (onp_fer_etapa2_pf.html:661).
 *
 * KNOWN DEFECT IN THE SOURCE, kept verbatim and flagged (00-master-plan.md
 * departure 15): this string fails its own check digit. `RASL910714MNLMLR0`
 * closes on `1`, not `4`. In the source's local mode `verificarCliente` runs
 * `validarCURPLocal`, so the CURP its own tip instructs you to type would be
 * rejected — the demo as documented does not work.
 *
 * The copy is the owner's call, so the string stays exactly as written and
 * `verificar-cliente` accepts it by identity as well as by validation. The
 * owner may want the digit corrected to `1`; that is a copy change and it is
 * raised in the PR rather than made here.
 */
export const CURP_DEMO_CLIENTE = 'RASL910714MNLMLR04';
