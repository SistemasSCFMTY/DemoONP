import { PRODUCTO_PREDETERMINADO } from '../../model/constants/producto/producto-predeterminado';
import type { IdentidadModel } from '../../state/identidad/identidad.state';
import { DATOS_INE_VACIOS } from '../../state/identidad/identidad.model';
import type { SesionModel } from '../../state/sesion/sesion.state';
import type { SimuladorModel } from '../../state/simulador/simulador.state';
import type { SolicitudModel } from '../../state/solicitud/solicitud.state';
import {
  AUTORIZACIONES_VACIAS,
  CONTACTO_VACIO,
  DOMICILIO_VACIO,
  GENERALES_VACIOS,
  LABORALES_VACIOS,
  PEP_VACIO,
  PROPIETARIO_VACIO,
} from '../../state/solicitud/solicitud.model';
import { aNumero, armarExpediente, fechaISO, nombreInvertido } from './expediente-armador';

const SOLICITUD: SolicitudModel = {
  generales: {
    ...GENERALES_VACIOS,
    apellidoPaterno: 'Páez',
    apellidoMaterno: 'Esquivel',
    nombres: 'Fernando',
    genero: 'H',
    nacimiento: { dia: '19', mes: '3', anio: '1999' },
    entidadNacimiento: 'DF',
    curp: 'paef990319hdfzsr09',
  },
  domicilio: {
    ...DOMICILIO_VACIO,
    tipoVialidad: 'avenida',
    nombreVialidad: 'Benito Juárez',
    numeroExterior: '123',
    entre1: 'Avenida Paseo',
    entre2: 'Calle Benito',
    codigoPostal: '64000',
    colonia: 'Centro',
    municipio: 'Monterrey',
    ciudad: 'Monterrey',
    entidadFederativa: 'NL',
  },
  contacto: { ...CONTACTO_VACIO, telefonoCelular: '81 1234 5678', correo: 'f@ejemplo.mx' },
  laborales: { ...LABORALES_VACIOS, empleo: 'Empleado', puesto: 'Gerente', ingresoMensual: '$15,000' },
  pepPropio: { ...PEP_VACIO },
  pepFamilia: { ...PEP_VACIO },
  actuaPorCuenta: 'propio',
  propietario: null,
  autorizaciones: { ...AUTORIZACIONES_VACIAS, buro: true },
};

const IDENTIDAD: IdentidadModel = {
  permisoUbicacion: true,
  ubicaciones: [
    {
      etiqueta: 'autorizacion',
      latitud: 25.6866,
      longitud: -100.3161,
      precision_metros: 12,
      capturado_en: '2026-09-30T12:00:00.000Z',
    },
  ],
  tipoIdentificacion: 'ine',
  frente: null,
  reverso: null,
  ine: { ...DATOS_INE_VACIOS },
  documentos: {},
  biometriaHuella: true,
  biometriaRostro: true,
  confianzaHuella: '98%',
  confianzaRostro: '95%',
  videoGrabado: true,
  firma: null,
};

const SIMULADOR: SimuladorModel = {
  producto: PRODUCTO_PREDETERMINADO,
  monto: 50000,
  plazo: 24,
  pagoMensual: 2952.3707974485,
  comision: 1000,
  total: 71856.899138764,
  cat: 45.7379251744,
  aceptada: true,
};

const SESION: SesionModel = {
  esCliente: null,
  numeroCliente: null,
  telefono: '8112345678',
  correo: 'f@ejemplo.mx',
  nombres: 'Fernando',
  apellidoPaterno: 'Páez',
  apellidoMaterno: 'Esquivel',
  prospectoId: 'exp-abc-123',
  telefonoEnmascarado: null,
  encontrado: null,
  codigoDemo: null,
  otpExpiraEn: null,
  otpValidado: true,
  paso: null,
  folio: null,
};

function fuentes(sesion: Partial<SesionModel> = {}, solicitud: Partial<SolicitudModel> = {}) {
  return {
    solicitud: { ...SOLICITUD, ...solicitud },
    identidad: IDENTIDAD,
    simulador: SIMULADOR,
    sesion: { ...SESION, ...sesion },
  };
}

describe('fechaISO', () => {
  it('rellena día y mes de un solo dígito', () => {
    expect(fechaISO({ dia: '5', mes: '3', anio: '1999' })).toBe('1999-03-05');
  });

  it('devuelve null mientras la fecha esté incompleta', () => {
    expect(fechaISO({ dia: '', mes: '3', anio: '1999' })).toBeNull();
    expect(fechaISO({ dia: '5', mes: '3', anio: '99' })).toBeNull();
  });
});

describe('aNumero', () => {
  it('lee una cantidad escrita con signo y separadores', () => {
    expect(aNumero('$15,000')).toBe(15000);
  });

  it('distingue un ingreso ausente de un ingreso de cero', () => {
    expect(aNumero('')).toBeNull();
    expect(aNumero('0')).toBe(0);
  });
});

describe('nombreInvertido', () => {
  it('pone los apellidos primero, como los asienta el documento', () => {
    expect(nombreInvertido(SOLICITUD.generales)).toBe('Páez Esquivel Fernando');
  });
});

describe('armarExpediente', () => {
  it('manda el id del borrador que reservó el registro', () => {
    // Without this the Worker inserts a second expediente and every
    // applicant leaves an orphan draft behind.
    expect(armarExpediente(fuentes()).expedienteId).toBe('exp-abc-123');
  });

  it('manda null cuando nunca hubo registro — un cliente que ya existía', () => {
    const e = armarExpediente(fuentes({ prospectoId: null, esCliente: true }));
    expect(e.expedienteId).toBeNull();
    expect(e.es_cliente_existente).toBe(true);
  });

  it('normaliza a null las cadenas vacías', () => {
    const e = armarExpediente(fuentes());
    expect(e.rfc).toBeNull();
    expect(e.numero_interior).toBeNull();
  });

  it('sube la CURP a mayúsculas', () => {
    expect(armarExpediente(fuentes()).curp).toBe('PAEF990319HDFZSR09');
  });

  it('convierte la fecha de nacimiento a ISO', () => {
    expect(armarExpediente(fuentes()).fecha_nacimiento).toBe('1999-03-19');
  });

  it('arma el domicilio en una línea legible', () => {
    expect(armarExpediente(fuentes()).domicilio_completo).toBe(
      'Avenida Benito Juárez 123, Centro, C.P. 64000, Monterrey, Nuevo León, México',
    );
  });

  it('une las entre-calles con una "y"', () => {
    expect(armarExpediente(fuentes()).entre_calles).toBe('Avenida Paseo y Calle Benito');
  });

  it('copia la primera ubicación a las columnas principales', () => {
    const e = armarExpediente(fuentes());
    expect(e.geo_latitud).toBe(25.6866);
    expect(e.ubicaciones).toHaveLength(1);
  });

  it('no manda campos pr_ cuando se actúa a nombre propio', () => {
    expect(armarExpediente(fuentes()).pr_curp).toBeUndefined();
  });

  it('manda los campos pr_ cuando se declaró un tercero', () => {
    const e = armarExpediente(
      fuentes(
        {},
        {
          actuaPorCuenta: 'tercero',
          propietario: {
            ...PROPIETARIO_VACIO,
            generales: {
              ...PROPIETARIO_VACIO.generales,
              nombres: 'Ana',
              apellidoPaterno: 'Hernández',
              apellidoMaterno: 'Gómez',
              curp: 'HEGA851105MJCRMN02',
            },
          },
        },
      ),
    );
    expect(e.pr_curp).toBe('HEGA851105MJCRMN02');
    expect(e.pr_nombre_completo).toBe('Ana Hernández Gómez');
  });

  it('no deja pasar una fecha de PEP cuando el cargo sigue vigente', () => {
    const e = armarExpediente(
      fuentes(
        {},
        {
          pepPropio: {
            ...PEP_VACIO,
            aplica: true,
            vigente: true,
            fin: { dia: '31', mes: '12', anio: '2020' },
          },
        },
      ),
    );
    expect(e.pep_propio_vigente).toBe(true);
    expect(e.pep_propio_fin).toBeNull();
  });
});
