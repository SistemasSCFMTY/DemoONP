import { calcularCAT, comisionDe, pagoMensual } from '../../../services/domain/credito';
import { Producto } from '../../interfaces/producto';
import { BanderasPlantilla } from '../../../services/domain/plantilla-motor';

/**
 * The example applicant the Formatos preview fills a template with.
 *
 * Ported from `EJEMPLO` (`onp_fer_etapa2_pf.html:5783`) — same invented
 * person, Fernando Páez Esquivel, so the panel's preview and the source's
 * tell the same story.
 *
 * **The money is computed, not copied.** The source's EJEMPLO hardcodes
 * `pago_estimado: '$3,650'` and `cat_estimado: '45.8%'`, and neither is the
 * amortisation of the loan it describes — the real payment on $80,000 over
 * 36 months at 36% is $3,664.30 (`credito.spec.ts`). §11 bans a figure with
 * no source and does not carve out a preview: an operator laying out their
 * document will read these numbers as what the product does.
 */
function pesos(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

const MONTO = 80_000;
const MESES = 36;

/** The source's PRODUCTO defaults, for the worked example only. */
const PRODUCTO_EJEMPLO: Producto = {
  monto_min: 5000,
  monto_max: 200_000,
  plazo_min: 6,
  plazo_max: 72,
  tasa_anual: 36,
  comision_apertura: true,
  comision_pct: 2,
  comision_desde: 10_000,
};

const PAGO = pagoMensual(MONTO, PRODUCTO_EJEMPLO.tasa_anual, MESES);
const COMISION = comisionDe(MONTO, PRODUCTO_EJEMPLO);
const CAT = calcularCAT(MONTO - COMISION, PAGO, MESES);

export const BANDERAS_EJEMPLO: BanderasPlantilla = {
  si_pep_propio: false,
  si_pep_familia: false,
  si_tercero: false,
  si_ine: true,
};

export const DATOS_EJEMPLO: Readonly<Record<string, string>> = {
  folio: 'ONP-260924-1234',
  fecha_solicitud: '24 de septiembre de 2026',
  hora_solicitud: '10:30',

  producto: 'Crédito simple',
  monto_solicitado: pesos(MONTO),
  plazo_solicitado: `${MESES} meses`,
  pago_estimado: pesos(PAGO),
  tasa_anual: `${PRODUCTO_EJEMPLO.tasa_anual}%`,
  comision_apertura: pesos(COMISION),
  total_estimado: pesos(PAGO * MESES + COMISION),
  cat_estimado: `${CAT.toFixed(1)}%`,
  tipo_solicitante: 'Prospecto',
  numero_cliente: '',

  nombre_completo: 'Fernando Páez Esquivel',
  nombre_invertido: 'Páez Esquivel Fernando',
  apellido_paterno: 'Páez',
  apellido_materno: 'Esquivel',
  nombres: 'Fernando',
  genero: 'Masculino',
  fecha_nacimiento: '19/03/1999',
  entidad_nacimiento: 'Nuevo León',
  pais_nacimiento: 'México',
  nacionalidad: 'Mexicana',
  curp: 'PAEF990319HNLZSR09',
  rfc: 'PAEF990319AB1',
  fea: '',

  domicilio_completo:
    'Calle Benito Juárez No. 123, Col. Centro, C.P. 64000, Monterrey, Nuevo León',
  tipo_vialidad: 'Calle',
  nombre_vialidad: 'Benito Juárez',
  numero_exterior: '123',
  numero_interior: '',
  entre_calles: 'Morelos y Hidalgo',
  codigo_postal: '64000',
  colonia: 'Centro',
  municipio: 'Monterrey',
  ciudad: 'Monterrey',
  entidad_federativa: 'Nuevo León',
  pais: 'México',

  telefono_celular: '81 1234 5678',
  telefono_fijo: '',
  correo: 'fernando@ejemplo.mx',

  empleo: 'Empleado privado',
  puesto: 'Gerente',
  empresa: 'Ejemplo S.A. de C.V.',
  giro_empresa: 'Servicios',
  antiguedad: '5 años',
  ingreso_mensual: '$35,000',
  otros_ingresos: '',

  pep_propio: 'No',
  pep_propio_ambito: '',
  pep_propio_institucion: '',
  pep_propio_puesto: '',
  pep_propio_inicio: '',
  pep_propio_fin: '',
  pep_propio_vigente: 'No',

  pep_familia: 'No',
  pep_familia_parentesco: '',
  pep_familia_ambito: '',
  pep_familia_institucion: '',
  pep_familia_puesto: '',
  pep_familia_inicio: '',
  pep_familia_fin: '',

  actua_por_cuenta: 'Propia',
  pr_nombre_completo: '',
  pr_curp: '',
  pr_rfc: '',
  pr_fecha_nacimiento: '',
  pr_nacionalidad: '',
  pr_domicilio_completo: '',
  pr_telefono: '',
  pr_correo: '',
  pr_empleo: '',
  pr_puesto: '',

  tipo_identificacion: 'Credencial para votar (INE)',
  ine_clave_elector: 'PZESFR99031901H300',
  ine_anio_registro: '2019',
  ine_num_emision: '03',
  ine_cic: '123456789',
  ine_ocr: '1234567890123',

  autoriza_buro: 'Sí',
  autoriza_geolocalizacion: 'Sí',
  autoriza_grabacion: 'Sí',
  ubicacion: '25.686600, -100.316100',

  // Filled from the live Ajustes row before rendering, so the preview shows
  // the SOFOM's real identity rather than a placeholder.
  sofom_razon_social: '',
  sofom_rfc: '',
  sofom_domicilio: '',

  // The signature is an image in the real render; the preview says so.
  firma: '<span class="sin-valor">[aquí va la firma del cliente]</span>',
};
