import type { Opcion } from '../../interfaces/opcion';
import { ESTADOS_NACIMIENTO } from './estados-nacimiento';

/**
 * Entidad federativa de residencia. Ported from onp_fer_etapa2_pf.html:959 —
 * the same list as the birth entities minus `NE`, because you cannot live in
 * "nacido en el extranjero".
 */
export const ESTADOS: readonly Opcion[] = ESTADOS_NACIMIENTO.filter((e) => e.valor !== 'NE');
