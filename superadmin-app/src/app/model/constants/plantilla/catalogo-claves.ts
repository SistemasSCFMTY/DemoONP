/**
 * What the SOFOM may paste into its Word document.
 *
 * Ported verbatim from `CATALOGO` (`onp_fer_etapa2_pf.html:3588`) and
 * `CONDICIONALES` (`:3704`) — same keys, same groups, same order, same
 * Spanish descriptions.
 *
 * This is the catalogue the Formatos tab makes searchable, and it is the
 * thing that explains the templating story: a stakeholder reads it and
 * understands that the document is theirs to write.
 *
 * The keys are a contract with the Worker's rendering. Do not rename one here
 * without renaming it there.
 */

export interface ClaveCatalogo {
  /** What goes inside the braces. */
  readonly clave: string;
  readonly descripcion: string;
}

export interface GrupoClaves {
  readonly grupo: string;
  readonly claves: readonly ClaveCatalogo[];
}

function g(grupo: string, claves: readonly (readonly [string, string])[]): GrupoClaves {
  return { grupo, claves: claves.map(([clave, descripcion]) => ({ clave, descripcion })) };
}

export const CATALOGO_CLAVES: readonly GrupoClaves[] = [
  g('Del trámite', [
    ['folio', 'Número de folio'],
    ['fecha_solicitud', 'Fecha de la solicitud'],
    ['hora_solicitud', 'Hora de la solicitud'],
  ]),
  g('Crédito solicitado', [
    ['producto', 'Nombre del producto'],
    ['monto_solicitado', 'Monto que solicitó'],
    ['plazo_solicitado', 'Plazo en meses'],
    ['pago_estimado', 'Pago mensual estimado'],
    ['tasa_anual', 'Tasa anual'],
    ['comision_apertura', 'Comisión de apertura'],
    ['total_estimado', 'Total a pagar estimado'],
    ['cat_estimado', 'CAT estimado'],
    ['tipo_solicitante', 'Prospecto o cliente'],
    ['numero_cliente', 'Número de cliente, si aplica'],
  ]),
  g('Datos del solicitante', [
    ['nombre_completo', 'Nombre, apellido paterno y materno'],
    ['nombre_invertido', 'Apellidos primero, luego nombre'],
    ['apellido_paterno', 'Apellido paterno'],
    ['apellido_materno', 'Apellido materno'],
    ['nombres', 'Nombre(s) de pila'],
    ['genero', 'Género'],
    ['fecha_nacimiento', 'Fecha de nacimiento'],
    ['entidad_nacimiento', 'Entidad de nacimiento'],
    ['pais_nacimiento', 'País de nacimiento'],
    ['nacionalidad', 'Nacionalidad'],
    ['curp', 'CURP'],
    ['rfc', 'RFC'],
    ['fea', 'Serie de firma electrónica'],
  ]),
  g('Domicilio', [
    ['domicilio_completo', 'Domicilio en una sola línea'],
    ['tipo_vialidad', 'Tipo de vialidad'],
    ['nombre_vialidad', 'Nombre de la vialidad'],
    ['numero_exterior', 'Número exterior'],
    ['numero_interior', 'Número interior'],
    ['entre_calles', 'Entre qué calles'],
    ['codigo_postal', 'Código postal'],
    ['colonia', 'Colonia'],
    ['municipio', 'Municipio o alcaldía'],
    ['ciudad', 'Ciudad'],
    ['entidad_federativa', 'Entidad federativa'],
    ['pais', 'País'],
  ]),
  g('Contacto', [
    ['telefono_celular', 'Teléfono celular'],
    ['telefono_fijo', 'Teléfono fijo'],
    ['correo', 'Correo electrónico'],
  ]),
  g('Datos laborales', [
    ['empleo', 'Empleo'],
    ['puesto', 'Puesto'],
    ['empresa', 'Nombre de la empresa'],
    ['giro_empresa', 'Giro de la empresa'],
    ['antiguedad', 'Antigüedad laboral'],
    ['ingreso_mensual', 'Ingreso mensual'],
    ['otros_ingresos', 'Otros ingresos'],
  ]),
  g('Funciones públicas del solicitante', [
    ['pep_propio', 'Declaró funciones públicas (Sí/No)'],
    ['pep_propio_ambito', 'Ámbito'],
    ['pep_propio_institucion', 'Institución'],
    ['pep_propio_puesto', 'Puesto desempeñado'],
    ['pep_propio_inicio', 'Fecha de inicio'],
    ['pep_propio_fin', 'Fecha de terminación o "Vigente"'],
    ['pep_propio_vigente', 'Sigue vigente (Sí/No)'],
  ]),
  g('Funciones públicas de familiares', [
    ['pep_familia', 'Declaró familiar con funciones públicas'],
    ['pep_familia_parentesco', 'Parentesco'],
    ['pep_familia_ambito', 'Ámbito'],
    ['pep_familia_institucion', 'Institución'],
    ['pep_familia_puesto', 'Puesto del familiar'],
    ['pep_familia_inicio', 'Fecha de inicio'],
    ['pep_familia_fin', 'Fecha de terminación o "Vigente"'],
  ]),
  g('Propietario real', [
    ['actua_por_cuenta', 'Actúa por cuenta propia o de tercero'],
    ['pr_nombre_completo', 'Nombre del propietario real'],
    ['pr_curp', 'CURP del propietario real'],
    ['pr_rfc', 'RFC del propietario real'],
    ['pr_fecha_nacimiento', 'Fecha de nacimiento'],
    ['pr_nacionalidad', 'Nacionalidad'],
    ['pr_domicilio_completo', 'Domicilio del propietario real'],
    ['pr_telefono', 'Teléfono'],
    ['pr_correo', 'Correo'],
    ['pr_empleo', 'Empleo'],
    ['pr_puesto', 'Puesto'],
  ]),
  g('Identificación presentada', [
    ['tipo_identificacion', 'Tipo de identificación'],
    ['ine_clave_elector', 'Clave de elector'],
    ['ine_anio_registro', 'Año de registro'],
    ['ine_num_emision', 'Número de emisión'],
    ['ine_cic', 'CIC'],
    ['ine_ocr', 'OCR'],
  ]),
  g('Autorizaciones', [
    ['autoriza_buro', 'Autorizó consulta a buró'],
    ['autoriza_geolocalizacion', 'Autorizó geolocalización'],
    ['autoriza_grabacion', 'Autorizó grabación'],
    ['ubicacion', 'Coordenadas al autorizar'],
  ]),
  g('Datos de la SOFOM', [
    ['sofom_razon_social', 'Razón social'],
    ['sofom_rfc', 'RFC'],
    ['sofom_domicilio', 'Domicilio'],
  ]),
];

/**
 * Blocks that only print when the condition holds, written
 * `{{#si_tercero}} … {{/si_tercero}}` in the document.
 */
export const CONDICIONALES: readonly ClaveCatalogo[] = [
  { clave: 'si_pep_propio', descripcion: 'Solo si declaró funciones públicas' },
  { clave: 'si_pep_familia', descripcion: 'Solo si declaró familiar con funciones públicas' },
  { clave: 'si_tercero', descripcion: 'Solo si actúa por cuenta de un tercero' },
  { clave: 'si_ine', descripcion: 'Solo si presentó credencial INE' },
];

/**
 * Every clave the engine recognises, for checking an uploaded document.
 *
 * `firma` is in the set but in neither list: it is replaced with the drawn
 * signature image rather than a text value, so it has nothing to describe in
 * a catalogue the operator copies from.
 */
export const CLAVES_VALIDAS: ReadonlySet<string> = new Set<string>([
  'firma',
  ...CATALOGO_CLAVES.flatMap((grupo) => grupo.claves.map((c) => c.clave)),
  ...CONDICIONALES.map((c) => c.clave),
]);

/**
 * Filters the catalogue the way `pintarCatalogo` does (`:5673`): a clave
 * survives on its key, on its description, or on its group's name,
 * case-insensitively. A group with no surviving claves disappears rather than
 * leaving an empty heading behind.
 */
export function filtrarCatalogo(consulta: string): readonly GrupoClaves[] {
  const q = consulta.toLowerCase().trim();
  if (!q) return CATALOGO_CLAVES;

  const grupos: GrupoClaves[] = [];
  for (const grupo of CATALOGO_CLAVES) {
    const coincideGrupo = grupo.grupo.toLowerCase().includes(q);
    const claves = grupo.claves.filter(
      (c) => coincideGrupo || c.clave.includes(q) || c.descripcion.toLowerCase().includes(q),
    );
    if (claves.length) grupos.push({ grupo: grupo.grupo, claves });
  }
  return grupos;
}

/** The same match, over the conditional blocks. */
export function filtrarCondicionales(consulta: string): readonly ClaveCatalogo[] {
  const q = consulta.toLowerCase().trim();
  if (!q) return CONDICIONALES;
  return CONDICIONALES.filter(
    (c) => c.clave.includes(q) || c.descripcion.toLowerCase().includes(q),
  );
}
