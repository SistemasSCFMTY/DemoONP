import { describe, expect, it } from 'vitest';
import { ExpedientePayloadSchema } from './expediente';

/**
 * El payload es el contrato con `web-app/`. Lo que se prueba aquí es la
 * normalización — `oNulo` y `aNumero` de la fuente
 * (onp_fer_etapa2_pf.html:2840, :2846) — porque es justo donde un
 * cambio silencioso mete cadenas vacías en columnas que el panel lee
 * como «sí contestó».
 */
describe('ExpedientePayloadSchema', () => {
  const vacio = () => ExpedientePayloadSchema.parse({});

  it('acepta un payload vacío: el prospecto puede quedarse a medias', () => {
    expect(() => vacio()).not.toThrow();
  });

  it('convierte la cadena vacía en null, no en cadena vacía', () => {
    const d = ExpedientePayloadSchema.parse({ curp: '', nombres: '   ', rfc: 'RASL910714AB1' });
    expect(d.curp).toBeNull();
    expect(d.nombres).toBeNull();
    expect(d.rfc).toBe('RASL910714AB1');
  });

  it('recorta el texto que sí llegó', () => {
    expect(ExpedientePayloadSchema.parse({ colonia: '  Centro  ' }).colonia).toBe('Centro');
  });

  it('limpia el formato de pesos de los montos', () => {
    const d = ExpedientePayloadSchema.parse({
      ingreso_mensual: '$12,500.00',
      monto_solicitado: 50000,
      pago_estimado: '',
    });
    expect(d.ingreso_mensual).toBe(12500);
    expect(d.monto_solicitado).toBe(50000);
    expect(d.pago_estimado).toBeNull();
  });

  it('trunca el plazo a entero', () => {
    expect(ExpedientePayloadSchema.parse({ plazo_solicitado_meses: '24' }).plazo_solicitado_meses)
      .toBe(24);
  });

  it('entiende el "Sí" de los radios de la fuente', () => {
    const d = ExpedientePayloadSchema.parse({
      autoriza_buro: 'Sí',
      autoriza_geolocalizacion: 'No',
      pep_propio: true,
    });
    expect(d.autoriza_buro).toBe(true);
    expect(d.autoriza_geolocalizacion).toBe(false);
    expect(d.pep_propio).toBe(true);
  });

  it('un booleano ausente es false, no null: la columna es NOT NULL', () => {
    expect(vacio().firmado).toBe(false);
    expect(vacio().es_cliente_existente).toBe(false);
  });

  it('solo acepta fechas ISO — dd/mm/aaaa es ambiguo y se rechaza', () => {
    expect(ExpedientePayloadSchema.parse({ fecha_nacimiento: '1991-07-14' }).fecha_nacimiento)
      .toBe('1991-07-14');
    expect(ExpedientePayloadSchema.safeParse({ fecha_nacimiento: '14/07/1991' }).success)
      .toBe(false);
    expect(vacio().fecha_nacimiento).toBeNull();
  });

  it('guarda los cuatro momentos probatorios de la geolocalización', () => {
    const d = ExpedientePayloadSchema.parse({
      ubicaciones: [
        {
          etiqueta: 'autorizacion',
          latitud: 25.6866,
          longitud: -100.3161,
          precision_metros: 12,
          capturado_en: '2026-10-01T18:00:00.000Z',
        },
      ],
    });
    expect(d.ubicaciones).toHaveLength(1);
    expect(d.ubicaciones?.[0]?.etiqueta).toBe('autorizacion');
    expect(vacio().ubicaciones).toBeNull();
  });

  it('deja pasar el bloque pr_ completo cuando hay tercero', () => {
    const d = ExpedientePayloadSchema.parse({
      pr_nombres: 'Laura',
      pr_curp: 'RASL910714MNLMLR04',
      pr_ingreso_mensual: '$8,000',
    });
    expect(d.pr_nombres).toBe('Laura');
    expect(d.pr_ingreso_mensual).toBe(8000);
  });

  it('acepta el HTML de la solicitud firmada', () => {
    const d = ExpedientePayloadSchema.parse({ documento_html: '<h1>Solicitud</h1>' });
    expect(d.documento_html).toBe('<h1>Solicitud</h1>');
    expect(vacio().documento_html).toBeNull();
  });
});
