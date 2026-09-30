/**
 * The solicitud document the prospect reads and signs.
 *
 * Ported verbatim from `PLANTILLA_BASE` (onp_fer_etapa2_pf.html:3861). The
 * `{{clave}}` placeholders and the `{{#bloque}}…{{/bloque}}` conditionals are
 * the source's own mini-template language, filled by `llenarPlantilla`
 * (`:3716`) — kept because CP-B11 would have let a SOFOM upload its own
 * .docx using exactly these keys, and that P2 checkpoint is expected to be
 * cut rather than redesigned.
 *
 * This is legal text. It renders exactly as authored: no `text-transform`,
 * no rewording (01-conventions.md §2, §11).
 */
export const PLANTILLA_BASE = `
<h1>SOLICITUD DE CRÉDITO</h1>
<p class="c">{{sofom_razon_social}}</p>
<p class="c" style="font-size:10px;">Folio {{folio}} &nbsp;·&nbsp; {{fecha_solicitud}}, {{hora_solicitud}}</p>

<h2>I. Crédito solicitado</h2>
<table>
<tr><td style="width:38%"><b>Producto</b></td><td>{{producto}}</td></tr>
<tr><td><b>Monto solicitado</b></td><td>{{monto_solicitado}}</td></tr>
<tr><td><b>Plazo</b></td><td>{{plazo_solicitado}}</td></tr>
<tr><td><b>Pago mensual estimado</b></td><td>{{pago_estimado}}</td></tr>
<tr><td><b>Tasa anual fija</b></td><td>{{tasa_anual}}</td></tr>
<tr><td><b>Comisión de apertura</b></td><td>{{comision_apertura}}</td></tr>
<tr><td><b>Total a pagar estimado</b></td><td>{{total_estimado}}</td></tr>
<tr><td><b>CAT estimado</b></td><td>{{cat_estimado}}</td></tr>
</table>
<p class="j" style="font-size:10px; color:#666;">Las cantidades anteriores son estimaciones sujetas al resultado de la evaluación de la solicitud y no constituyen una oferta en firme.</p>

<h2>II. Datos del solicitante</h2>
<table>
<tr><td style="width:38%"><b>Nombre completo</b></td><td>{{nombre_invertido}}</td></tr>
<tr><td><b>Fecha de nacimiento</b></td><td>{{fecha_nacimiento}}</td></tr>
<tr><td><b>Género</b></td><td>{{genero}}</td></tr>
<tr><td><b>Entidad de nacimiento</b></td><td>{{entidad_nacimiento}}</td></tr>
<tr><td><b>Nacionalidad</b></td><td>{{nacionalidad}}</td></tr>
<tr><td><b>CURP</b></td><td>{{curp}}</td></tr>
<tr><td><b>RFC</b></td><td>{{rfc}}</td></tr>
</table>

<h2>III. Domicilio</h2>
<table>
<tr><td style="width:38%"><b>Domicilio</b></td><td>{{domicilio_completo}}</td></tr>
<tr><td><b>Entre calles</b></td><td>{{entre_calles}}</td></tr>
</table>

<h2>IV. Contacto</h2>
<table>
<tr><td style="width:38%"><b>Teléfono celular</b></td><td>{{telefono_celular}}</td></tr>
<tr><td><b>Teléfono fijo</b></td><td>{{telefono_fijo}}</td></tr>
<tr><td><b>Correo electrónico</b></td><td>{{correo}}</td></tr>
</table>

<h2>V. Actividad económica</h2>
<table>
<tr><td style="width:38%"><b>Empleo</b></td><td>{{empleo}}</td></tr>
<tr><td><b>Puesto</b></td><td>{{puesto}}</td></tr>
<tr><td><b>Empresa</b></td><td>{{empresa}}</td></tr>
<tr><td><b>Giro</b></td><td>{{giro_empresa}}</td></tr>
<tr><td><b>Antigüedad</b></td><td>{{antiguedad}}</td></tr>
<tr><td><b>Ingreso mensual</b></td><td>{{ingreso_mensual}}</td></tr>
<tr><td><b>Otros ingresos</b></td><td>{{otros_ingresos}}</td></tr>
</table>

<h2>VI. Identificación presentada</h2>
<table>
<tr><td style="width:38%"><b>Tipo de identificación</b></td><td>{{tipo_identificacion}}</td></tr>
</table>
{{#si_ine}}
<table>
<tr><td style="width:38%"><b>Clave de elector</b></td><td>{{ine_clave_elector}}</td></tr>
<tr><td><b>Año de registro</b></td><td>{{ine_anio_registro}}</td></tr>
<tr><td><b>Número de emisión</b></td><td>{{ine_num_emision}}</td></tr>
<tr><td><b>CIC</b></td><td>{{ine_cic}}</td></tr>
<tr><td><b>OCR</b></td><td>{{ine_ocr}}</td></tr>
</table>
{{/si_ine}}

<h2>VII. Declaratoria de funciones públicas</h2>
<p class="j">¿El solicitante desempeña o ha desempeñado funciones públicas destacadas? <b>{{pep_propio}}</b></p>
{{#si_pep_propio}}
<table>
<tr><td style="width:38%"><b>Ámbito</b></td><td>{{pep_propio_ambito}}</td></tr>
<tr><td><b>Institución</b></td><td>{{pep_propio_institucion}}</td></tr>
<tr><td><b>Puesto</b></td><td>{{pep_propio_puesto}}</td></tr>
<tr><td><b>Del</b></td><td>{{pep_propio_inicio}} &nbsp;&nbsp;<b>al</b>&nbsp;&nbsp; {{pep_propio_fin}}</td></tr>
</table>
{{/si_pep_propio}}
<p class="j">¿Algún familiar hasta segundo grado se encuentra en ese supuesto? <b>{{pep_familia}}</b></p>
{{#si_pep_familia}}
<table>
<tr><td style="width:38%"><b>Parentesco</b></td><td>{{pep_familia_parentesco}}</td></tr>
<tr><td><b>Ámbito</b></td><td>{{pep_familia_ambito}}</td></tr>
<tr><td><b>Institución</b></td><td>{{pep_familia_institucion}}</td></tr>
<tr><td><b>Puesto</b></td><td>{{pep_familia_puesto}}</td></tr>
<tr><td><b>Del</b></td><td>{{pep_familia_inicio}} &nbsp;&nbsp;<b>al</b>&nbsp;&nbsp; {{pep_familia_fin}}</td></tr>
</table>
{{/si_pep_familia}}

<h2>VIII. Declaratoria de propietario real</h2>
<p class="j">El solicitante manifiesta actuar por cuenta: <b>{{actua_por_cuenta}}</b></p>
{{#si_tercero}}
<table>
<tr><td style="width:38%"><b>Nombre del propietario real</b></td><td>{{pr_nombre_completo}}</td></tr>
<tr><td><b>Fecha de nacimiento</b></td><td>{{pr_fecha_nacimiento}}</td></tr>
<tr><td><b>Nacionalidad</b></td><td>{{pr_nacionalidad}}</td></tr>
<tr><td><b>CURP</b></td><td>{{pr_curp}}</td></tr>
<tr><td><b>RFC</b></td><td>{{pr_rfc}}</td></tr>
<tr><td><b>Domicilio</b></td><td>{{pr_domicilio_completo}}</td></tr>
<tr><td><b>Teléfono</b></td><td>{{pr_telefono}}</td></tr>
<tr><td><b>Correo</b></td><td>{{pr_correo}}</td></tr>
<tr><td><b>Empleo y puesto</b></td><td>{{pr_empleo}} — {{pr_puesto}}</td></tr>
</table>
{{/si_tercero}}

<h2>IX. Autorizaciones otorgadas</h2>
<table>
<tr><td style="width:60%">Consulta al Buró de Crédito (Art. 28 LRSIC)</td><td>{{autoriza_buro}}</td></tr>
<tr><td>Grabación de imagen y voz</td><td>{{autoriza_grabacion}}</td></tr>
<tr><td>Acceso a geolocalización</td><td>{{autoriza_geolocalizacion}}</td></tr>
</table>

<h2>X. Declaración bajo protesta de decir verdad</h2>
<p class="j">El suscrito manifiesta bajo protesta de decir verdad que la información y documentación proporcionada a {{sofom_razon_social}} es auténtica, completa, vigente y verídica, y reconoce que cualquier falsedad, omisión o alteración podrá dar lugar a las responsabilidades legales correspondientes.</p>
<p class="j">Asimismo, reconoce y acepta que la firma plasmada por medios electrónicos, incluyendo aquella realizada mediante dispositivo táctil, tendrá los mismos efectos jurídicos que una firma autógrafa, de conformidad con la legislación aplicable, y que los registros electrónicos, videograbaciones, mecanismos de autenticación, biométricos, sellos digitales y demás evidencias generadas durante el proceso formarán parte integrante del expediente electrónico correspondiente.</p>

<div class="firma-zona">
{{firma}}
<div class="linea">{{nombre_invertido}}</div>
</div>
<p class="c" style="font-size:10px; margin-top:14px;">Documento generado electrónicamente el {{fecha_solicitud}} a las {{hora_solicitud}} · Folio {{folio}}</p>
`;
