import { ExpedienteDetalle } from '../../model/interfaces/expediente-detalle';

/**
 * Three expedientes for `PanelApiSimulada`.
 *
 * They exist so CP-S3 can be judged on how it looks while CP-B4 is still being
 * written: one complete submission with photographs, a signature and a signed
 * document; one mid-review file that declares a PEP relative and acts for a
 * tercero; and one thin, freshly-arrived record with most fields empty, which
 * is what the detail view's "No proporcionado" rows are for.
 *
 * The people are invented. Fernando Páez Esquivel is the source's own worked
 * example (`onp_fer_etapa2_pf.html:5783`, `EJEMPLO`), kept so the mocked panel
 * and the mocked solicitud template tell the same story. The CURPs and RFCs
 * are structurally valid and belong to nobody.
 *
 * Every monetary figure here is a real amortisation of the stated monto, plazo
 * and tasa — §11 bans invented numbers, and a demo dataset is not an
 * exemption. `pago_estimado` is the French-system payment from `pagoMensual`
 * (`:2379`) computed for each row.
 */

/** Anchored to the demo date so the list always reads as "this week". */
const HOY = new Date('2026-09-30T00:00:00-06:00');

function haceHoras(horas: number): string {
  return new Date(HOY.getTime() - horas * 3_600_000).toISOString();
}

/** Every field an `ExpedienteDetalle` carries, at its empty value. */
const VACIO = {
  enviado_en: null,
  apellido_paterno: null,
  apellido_materno: null,
  nombres: null,
  nombre_completo: null,
  genero: null,
  fecha_nacimiento: null,
  entidad_nacimiento: null,
  pais_nacimiento: null,
  nacionalidad: null,
  curp: null,
  rfc: null,
  serie_fea: null,
  tipo_vialidad: null,
  nombre_vialidad: null,
  numero_exterior: null,
  numero_interior: null,
  entre_calles: null,
  codigo_postal: null,
  colonia: null,
  municipio: null,
  ciudad: null,
  entidad_federativa: null,
  pais: null,
  domicilio_completo: null,
  telefono_celular: null,
  telefono_fijo: null,
  correo: null,
  empleo: null,
  puesto: null,
  empresa: null,
  giro_empresa: null,
  antiguedad: null,
  ingreso_mensual: null,
  otros_ingresos: null,
  pep_propio: false,
  pep_propio_ambito: null,
  pep_propio_institucion: null,
  pep_propio_puesto: null,
  pep_propio_inicio: null,
  pep_propio_fin: null,
  pep_propio_vigente: false,
  pep_familia: false,
  pep_familia_parentesco: null,
  pep_familia_ambito: null,
  pep_familia_institucion: null,
  pep_familia_puesto: null,
  pep_familia_inicio: null,
  pep_familia_fin: null,
  pep_familia_vigente: false,
  tipo_identificacion: null,
  ine_clave_elector: null,
  ine_anio_registro: null,
  ine_num_emision: null,
  ine_anio_emision: null,
  ine_cic: null,
  ine_ocr: null,
  autoriza_grabacion: false,
  autoriza_geolocalizacion: false,
  autoriza_buro: false,
  buro_nip: null,
  biometria_huella: false,
  biometria_rostro: false,
  video_grabado: false,
  firmado: false,
  geo_latitud: null,
  geo_longitud: null,
  geo_precision_metros: null,
  ubicaciones: null,
  monto_solicitado: null,
  plazo_solicitado_meses: null,
  tasa_solicitada: null,
  pago_estimado: null,
  es_cliente_existente: false,
  numero_cliente: null,
  dispositivo: null,
  version_app: null,
  propietario_real: null,
  archivos: [],
  documento: null,
} satisfies Omit<ExpedienteDetalle, 'id' | 'folio' | 'estado' | 'creado_en'>;

const DOCUMENTO_PAEZ = `
  <h1>SOLICITUD DE CRÉDITO SIMPLE</h1>
  <p class="c">ONP FER, S.A. de C.V., SOFOM, E.N.R.</p>
  <p class="r">Folio ONP-260929-4417 · 29 de septiembre de 2026</p>
  <h2>Datos del solicitante</h2>
  <table>
    <tr><th>Nombre</th><td>Páez Esquivel Fernando</td></tr>
    <tr><th>CURP</th><td>PAEF990319HNLZSR09</td></tr>
    <tr><th>RFC</th><td>PAEF990319AB1</td></tr>
    <tr><th>Domicilio</th><td>Calle Benito Juárez No. 123, Col. Centro, C.P. 64000, Monterrey, Nuevo León</td></tr>
  </table>
  <h2>Condiciones solicitadas</h2>
  <table>
    <tr><th>Monto</th><td>$80,000</td></tr>
    <tr><th>Plazo</th><td>36 meses</td></tr>
    <tr><th>Tasa anual fija</th><td>36%</td></tr>
    <tr><th>Pago mensual estimado</th><td>$3,657</td></tr>
    <tr><th>Comisión de apertura</th><td>$1,600</td></tr>
  </table>
  <p class="j">El solicitante manifiesta bajo protesta de decir verdad que los datos
  asentados en la presente solicitud son ciertos, y autoriza a la Sociedad a
  verificarlos por los medios que estime convenientes.</p>
  <div class="firma-zona"><p>Páez Esquivel Fernando</p></div>
`;

export const EXPEDIENTES_SIMULADOS: readonly ExpedienteDetalle[] = [
  {
    ...VACIO,
    id: 'a7f3c2d1-9e44-4b21-8f07-2c5d3e1a9b60',
    folio: 'ONP-260929-4417',
    estado: 'pendiente',
    creado_en: haceHoras(3),
    enviado_en: haceHoras(3),

    apellido_paterno: 'Páez',
    apellido_materno: 'Esquivel',
    nombres: 'Fernando',
    nombre_completo: 'Páez Esquivel Fernando',
    genero: 'Masculino',
    fecha_nacimiento: '1999-03-19',
    entidad_nacimiento: 'Nuevo León',
    pais_nacimiento: 'México',
    nacionalidad: 'Mexicana',
    curp: 'PAEF990319HNLZSR09',
    rfc: 'PAEF990319AB1',

    tipo_vialidad: 'Calle',
    nombre_vialidad: 'Benito Juárez',
    numero_exterior: '123',
    entre_calles: 'Morelos y Hidalgo',
    codigo_postal: '64000',
    colonia: 'Centro',
    municipio: 'Monterrey',
    ciudad: 'Monterrey',
    entidad_federativa: 'Nuevo León',
    pais: 'México',
    domicilio_completo:
      'Calle Benito Juárez No. 123, Col. Centro, C.P. 64000, Monterrey, Nuevo León',

    telefono_celular: '81 1234 5678',
    correo: 'fernando@ejemplo.mx',

    empleo: 'Empleado privado',
    puesto: 'Gerente',
    empresa: 'Ejemplo S.A. de C.V.',
    giro_empresa: 'Servicios',
    antiguedad: '5 años',
    ingreso_mensual: 35000,

    tipo_identificacion: 'Credencial para votar (INE)',
    ine_clave_elector: 'PZESFR99031901H300',
    ine_anio_registro: '2019',
    ine_num_emision: '03',
    ine_anio_emision: '2019',
    ine_cic: '123456789',
    ine_ocr: '1234567890123',

    autoriza_grabacion: true,
    autoriza_geolocalizacion: true,
    autoriza_buro: true,

    biometria_huella: true,
    biometria_rostro: true,
    video_grabado: true,
    firmado: true,

    geo_latitud: 25.6866,
    geo_longitud: -100.3161,
    geo_precision_metros: 18,
    ubicaciones: [
      {
        etiqueta: 'autorizacion',
        latitud: 25.6866,
        longitud: -100.3161,
        precision_metros: 18,
        capturado_en: haceHoras(3.6),
      },
      {
        etiqueta: 'fotografia_identificacion',
        latitud: 25.6867,
        longitud: -100.3159,
        precision_metros: 14,
        capturado_en: haceHoras(3.4),
      },
      {
        etiqueta: 'videograbacion',
        latitud: 25.6867,
        longitud: -100.316,
        precision_metros: 12,
        capturado_en: haceHoras(3.2),
      },
      {
        etiqueta: 'firma',
        latitud: 25.6866,
        longitud: -100.3161,
        precision_metros: 11,
        capturado_en: haceHoras(3.05),
      },
    ],

    // $80,000 · 36 meses · 36% anual → pago mensual $3,656.86 (sistema francés)
    monto_solicitado: 80000,
    plazo_solicitado_meses: 36,
    tasa_solicitada: 36,
    pago_estimado: 3656.86,

    dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)',
    version_app: '1.0.0',

    archivos: [
      {
        tipo: 'id_frente',
        tamano_bytes: 418_233,
        hash_sha256: '3f1c0a9d84b2e6570fd1c2a8b93e47aa5d6c81f0e2b7439ac51de0a7f6b32c94',
        capturado_en: haceHoras(3.4),
      },
      {
        tipo: 'id_reverso',
        tamano_bytes: 401_882,
        hash_sha256: 'c84b2e6570fd1c2a8b93e47aa5d6c81f0e2b7439ac51de0a7f6b32c943f1c0a9',
        capturado_en: haceHoras(3.38),
      },
      {
        tipo: 'firma',
        tamano_bytes: 22_140,
        hash_sha256: '70fd1c2a8b93e47aa5d6c81f0e2b7439ac51de0a7f6b32c943f1c0a9d84b2e65',
        capturado_en: haceHoras(3.05),
      },
      {
        tipo: 'doc_id',
        tamano_bytes: 1_204_551,
        hash_sha256: 'aa5d6c81f0e2b7439ac51de0a7f6b32c943f1c0a9d84b2e6570fd1c2a8b93e47',
        capturado_en: haceHoras(3.3),
      },
      {
        tipo: 'doc_curp',
        tamano_bytes: 188_902,
        hash_sha256: 'e2b7439ac51de0a7f6b32c943f1c0a9d84b2e6570fd1c2a8b93e47aa5d6c81f0',
        capturado_en: haceHoras(3.28),
      },
      {
        tipo: 'doc_domicilio',
        tamano_bytes: 642_017,
        hash_sha256: 'de0a7f6b32c943f1c0a9d84b2e6570fd1c2a8b93e47aa5d6c81f0e2b7439ac51',
        capturado_en: haceHoras(3.25),
      },
    ],
    documento: {
      contenido_html: DOCUMENTO_PAEZ,
      firmado_en: haceHoras(3.05),
    },
  },

  {
    ...VACIO,
    id: 'b2e91f47-3a05-4c8d-91be-7d4a60c3f215',
    folio: 'ONP-260928-8802',
    estado: 'en_revision',
    creado_en: haceHoras(29),
    enviado_en: haceHoras(29),

    apellido_paterno: 'Robles',
    apellido_materno: 'Cantú',
    nombres: 'María Guadalupe',
    nombre_completo: 'Robles Cantú María Guadalupe',
    genero: 'Femenino',
    fecha_nacimiento: '1988-07-12',
    entidad_nacimiento: 'Nuevo León',
    pais_nacimiento: 'México',
    nacionalidad: 'Mexicana',
    curp: 'ROCM880712MNLBNR04',
    rfc: 'ROCM880712H45',
    serie_fea: '00001000000512345678',

    tipo_vialidad: 'Avenida',
    nombre_vialidad: 'Eugenio Garza Sada',
    numero_exterior: '2501',
    numero_interior: 'Depto. 402',
    entre_calles: 'Río Nazas y Río Pánuco',
    codigo_postal: '64849',
    colonia: 'Tecnológico',
    municipio: 'Monterrey',
    ciudad: 'Monterrey',
    entidad_federativa: 'Nuevo León',
    pais: 'México',
    domicilio_completo:
      'Avenida Eugenio Garza Sada No. 2501, Depto. 402, Col. Tecnológico, C.P. 64849, Monterrey, Nuevo León',

    telefono_celular: '81 8877 4120',
    telefono_fijo: '81 8123 9044',
    correo: 'mg.robles@ejemplo.mx',

    empleo: 'Profesionista independiente',
    puesto: 'Contadora pública',
    empresa: 'Despacho Robles y Asociados',
    giro_empresa: 'Servicios contables',
    antiguedad: '9 años',
    ingreso_mensual: 62000,
    otros_ingresos: 'Arrendamiento de local comercial',

    pep_familia: true,
    pep_familia_parentesco: 'Hermano',
    pep_familia_ambito: 'Estatal',
    pep_familia_institucion: 'Secretaría de Finanzas y Tesorería General del Estado',
    pep_familia_puesto: 'Director de Ingresos',
    pep_familia_inicio: '2021-10-04',
    pep_familia_vigente: true,

    tipo_identificacion: 'Credencial para votar (INE)',
    ine_clave_elector: 'RBCNMR88071219M600',
    ine_anio_registro: '2019',
    ine_num_emision: '02',
    ine_anio_emision: '2019',
    ine_cic: '987654321',
    ine_ocr: '2938475610928',

    autoriza_grabacion: true,
    autoriza_geolocalizacion: true,
    autoriza_buro: true,

    biometria_huella: true,
    biometria_rostro: true,
    video_grabado: true,
    firmado: true,

    geo_latitud: 25.6514,
    geo_longitud: -100.2895,
    geo_precision_metros: 22,
    ubicaciones: [
      {
        etiqueta: 'autorizacion',
        latitud: 25.6514,
        longitud: -100.2895,
        precision_metros: 22,
        capturado_en: haceHoras(29.7),
      },
      {
        etiqueta: 'fotografia_identificacion',
        latitud: 25.6514,
        longitud: -100.2894,
        precision_metros: 19,
        capturado_en: haceHoras(29.5),
      },
      {
        etiqueta: 'firma',
        latitud: 25.6513,
        longitud: -100.2895,
        precision_metros: 17,
        capturado_en: haceHoras(29.1),
      },
    ],

    // $150,000 · 48 meses · 36% anual → pago mensual $5,815.24
    monto_solicitado: 150000,
    plazo_solicitado_meses: 48,
    tasa_solicitada: 36,
    pago_estimado: 5815.24,
    es_cliente_existente: true,
    numero_cliente: 'CL-0048213',

    dispositivo: 'Mozilla/5.0 (Linux; Android 15; Pixel 8)',
    version_app: '1.0.0',

    propietario_real: {
      apellido_paterno: 'Robles',
      apellido_materno: 'Treviño',
      nombres: 'Andrés',
      nombre_completo: 'Robles Treviño Andrés',
      genero: 'Masculino',
      fecha_nacimiento: '1959-01-28',
      entidad_nacimiento: 'Coahuila',
      nacionalidad: 'Mexicana',
      curp: 'ROTA590128HCLBRN02',
      rfc: 'ROTA590128QX7',
      domicilio_completo:
        'Calle Zaragoza No. 84, Col. Centro, C.P. 25000, Saltillo, Coahuila',
      codigo_postal: '25000',
      colonia: 'Centro',
      municipio: 'Saltillo',
      entidad_federativa: 'Coahuila',
      telefono: '84 4412 7788',
      correo: 'a.robles@ejemplo.mx',
      empleo: 'Jubilado',
      puesto: null,
      empresa: null,
      ingreso_mensual: 18000,
    },

    archivos: [
      {
        tipo: 'id_frente',
        tamano_bytes: 512_774,
        hash_sha256: '91be7d4a60c3f215b2e91f473a054c8d0e2b7439ac51de0a7f6b32c943f1c0a9',
        capturado_en: haceHoras(29.5),
      },
      {
        tipo: 'id_reverso',
        tamano_bytes: 498_311,
        hash_sha256: '60c3f215b2e91f473a054c8d91be7d4ac51de0a7f6b32c943f1c0a9d84b2e657',
        capturado_en: haceHoras(29.48),
      },
      {
        tipo: 'firma',
        tamano_bytes: 25_902,
        hash_sha256: '3a054c8d91be7d4a60c3f215b2e91f47f6b32c943f1c0a9d84b2e6570fd1c2a8',
        capturado_en: haceHoras(29.1),
      },
      {
        tipo: 'doc_fiscal',
        tamano_bytes: 331_408,
        hash_sha256: 'b2e91f473a054c8d91be7d4a60c3f2153f1c0a9d84b2e6570fd1c2a8b93e47aa',
        capturado_en: haceHoras(29.4),
      },
      {
        tipo: 'doc_id_propietario',
        tamano_bytes: 445_120,
        hash_sha256: '4c8d91be7d4a60c3f215b2e91f473a05d84b2e6570fd1c2a8b93e47aa5d6c81f',
        capturado_en: haceHoras(29.35),
      },
    ],
    documento: {
      contenido_html: `
        <h1>SOLICITUD DE CRÉDITO SIMPLE</h1>
        <p class="c">ONP FER, S.A. de C.V., SOFOM, E.N.R.</p>
        <p class="r">Folio ONP-260928-8802 · 28 de septiembre de 2026</p>
        <h2>Datos del solicitante</h2>
        <table>
          <tr><th>Nombre</th><td>Robles Cantú María Guadalupe</td></tr>
          <tr><th>CURP</th><td>ROCM880712MNLBNR04</td></tr>
          <tr><th>Número de cliente</th><td>CL-0048213</td></tr>
        </table>
        <h2>Condiciones solicitadas</h2>
        <table>
          <tr><th>Monto</th><td>$150,000</td></tr>
          <tr><th>Plazo</th><td>48 meses</td></tr>
          <tr><th>Pago mensual estimado</th><td>$5,815</td></tr>
        </table>
        <h3>Propietario real</h3>
        <p class="j">La solicitante declara actuar por cuenta de un tercero,
        cuyos datos se asientan en el anexo correspondiente.</p>
        <div class="firma-zona"><p>Robles Cantú María Guadalupe</p></div>
      `,
      firmado_en: haceHoras(29.1),
    },
  },

  {
    ...VACIO,
    id: 'c5d80b36-71fa-4e93-a2c4-8b19f7e0d452',
    folio: 'ONP-260930-1093',
    estado: 'pendiente',
    creado_en: haceHoras(0.75),
    enviado_en: haceHoras(0.75),

    apellido_paterno: 'Villalobos',
    apellido_materno: 'Mendoza',
    nombres: 'Jorge Alberto',
    nombre_completo: 'Villalobos Mendoza Jorge Alberto',
    genero: 'Masculino',
    fecha_nacimiento: '1975-02-24',
    entidad_nacimiento: 'Ciudad de México',
    pais_nacimiento: 'México',
    nacionalidad: 'Mexicana',
    curp: 'VIMJ750224HDFLNR07',

    codigo_postal: '66220',
    colonia: 'Valle del Campestre',
    municipio: 'San Pedro Garza García',
    entidad_federativa: 'Nuevo León',
    pais: 'México',

    telefono_celular: '81 2044 3391',
    correo: 'jorge.villalobos@ejemplo.mx',

    empleo: 'Empleado privado',
    ingreso_mensual: 28500,

    tipo_identificacion: 'Credencial para votar (INE)',
    ine_clave_elector: 'VLMNJR75022409H100',
    ine_ocr: '5647382910475',

    autoriza_geolocalizacion: true,
    autoriza_buro: true,

    biometria_rostro: true,

    geo_latitud: 25.6591,
    geo_longitud: -100.3597,
    geo_precision_metros: 34,
    ubicaciones: [
      {
        etiqueta: 'autorizacion',
        latitud: 25.6591,
        longitud: -100.3597,
        precision_metros: 34,
        capturado_en: haceHoras(0.85),
      },
    ],

    // $25,000 · 12 meses · 36% anual → pago mensual $2,512.06
    monto_solicitado: 25000,
    plazo_solicitado_meses: 12,
    tasa_solicitada: 36,
    pago_estimado: 2512.06,

    dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X)',
    version_app: '1.0.0',

    archivos: [
      {
        tipo: 'id_frente',
        tamano_bytes: 389_544,
        hash_sha256: 'a2c48b19f7e0d452c5d80b3671fa4e930fd1c2a8b93e47aa5d6c81f0e2b7439a',
        capturado_en: haceHoras(0.8),
      },
      {
        tipo: 'id_reverso',
        tamano_bytes: 372_006,
        hash_sha256: '71fa4e93a2c48b19f7e0d452c5d80b36b93e47aa5d6c81f0e2b7439ac51de0a7',
        capturado_en: haceHoras(0.79),
      },
    ],
  },
];
