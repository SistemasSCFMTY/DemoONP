/**
 * The expediente, sliced one object per wizard step.
 *
 * Each step owns a typed `FormGroup` shaped exactly like its slice, so
 * rehydrating on back-navigation is `patchValue(slice)` and dispatching on
 * submit is `new GuardarX(form.getRawValue())`. That symmetry is the whole
 * reason the slices mirror the screens rather than the API payload — the flat
 * snake_case shape `POST /solicitudes` wants is assembled once, in
 * `expediente-armador`, and nowhere else.
 *
 * Dates live as day/month/year trios here, as the prospect typed them, and are
 * converted to ISO only when the payload is built (02-api-contract.md).
 *
 * PII: everything below. Never logged, never in a URL, never persisted.
 */

export interface FechaTrio {
  dia: string;
  mes: string;
  anio: string;
}

export const FECHA_VACIA: FechaTrio = { dia: '', mes: '', anio: '' };

export interface DatosGenerales {
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  genero: string;
  nacimiento: FechaTrio;
  entidadNacimiento: string;
  paisNacimiento: string;
  nacionalidad: string;
  curp: string;
  rfc: string;
  serieFea: string;
}

export interface DatosDomicilio {
  tipoVialidad: string;
  nombreVialidad: string;
  numeroExterior: string;
  numeroInterior: string;
  entre1: string;
  entre2: string;
  codigoPostal: string;
  colonia: string;
  municipio: string;
  ciudad: string;
  entidadFederativa: string;
  pais: string;
}

export interface DatosContacto {
  telefonoCelular: string;
  telefonoFijo: string;
  correo: string;
}

export interface DatosLaborales {
  empleo: string;
  puesto: string;
  empresa: string;
  giroEmpresa: string;
  antiguedad: string;
  ingresoMensual: string;
  otrosIngresos: string;
}

export interface DatosPep {
  /** The radio answer. Drives `setValidators` on everything below it. */
  aplica: boolean;
  ambito: string;
  institucion: string;
  puesto: string;
  /** Only on the familia screen. */
  parentesco: string;
  inicio: FechaTrio;
  vigente: boolean;
  fin: FechaTrio;
}

export type ActuaPorCuenta = 'propio' | 'tercero';

/** The propietario real. Same shape as the solicitante, gathered on one screen. */
export interface PropietarioReal {
  generales: DatosGenerales;
  domicilio: DatosDomicilio;
  contacto: DatosContacto;
  laborales: DatosLaborales;
}

export interface Autorizaciones {
  /** envio-formulario (:1074). */
  grabacion: boolean;
  /** auth-location (:718). */
  geolocalizacion: boolean;
  /** auth-buro (:1567). */
  buro: boolean;
  buroNip: string;
}

export const GENERALES_VACIOS: DatosGenerales = {
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombres: '',
  genero: '',
  nacimiento: { ...FECHA_VACIA },
  entidadNacimiento: '',
  paisNacimiento: 'México',
  nacionalidad: 'Mexicana',
  curp: '',
  rfc: '',
  serieFea: '',
};

export const DOMICILIO_VACIO: DatosDomicilio = {
  tipoVialidad: '',
  nombreVialidad: '',
  numeroExterior: '',
  numeroInterior: '',
  entre1: '',
  entre2: '',
  codigoPostal: '',
  colonia: '',
  municipio: '',
  ciudad: '',
  entidadFederativa: '',
  pais: 'México',
};

export const CONTACTO_VACIO: DatosContacto = {
  telefonoCelular: '',
  telefonoFijo: '',
  correo: '',
};

export const LABORALES_VACIOS: DatosLaborales = {
  empleo: '',
  puesto: '',
  empresa: '',
  giroEmpresa: '',
  antiguedad: '',
  ingresoMensual: '',
  otrosIngresos: '',
};

export const PEP_VACIO: DatosPep = {
  aplica: false,
  ambito: '',
  institucion: '',
  puesto: '',
  parentesco: '',
  inicio: { ...FECHA_VACIA },
  vigente: false,
  fin: { ...FECHA_VACIA },
};

export const PROPIETARIO_VACIO: PropietarioReal = {
  generales: { ...GENERALES_VACIOS },
  domicilio: { ...DOMICILIO_VACIO },
  contacto: { ...CONTACTO_VACIO },
  laborales: { ...LABORALES_VACIOS },
};

export const AUTORIZACIONES_VACIAS: Autorizaciones = {
  grabacion: false,
  geolocalizacion: false,
  buro: false,
  buroNip: '',
};
