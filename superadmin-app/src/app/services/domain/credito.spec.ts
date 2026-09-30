import { describe, expect, it } from 'vitest';

import { Producto } from '../../model/interfaces/producto';
import { calcularCAT, comisionDe, ejemplosDe, pagoMensual } from './credito';

/**
 * The one place in this track where tests are not optional.
 *
 * The master plan names live CAT maths as the thing a credit person in the
 * room will poke at, and the Producto screen previews it from whatever is
 * typed into the form. A figure that is wrong here is wrong on stage.
 *
 * These also pin the panel's copy of the maths against `web-app/`'s: the two
 * are separate files by decision, and if they ever disagree the prospect's
 * simulator and the operator's preview stop telling the same story.
 */
describe('pagoMensual', () => {
  it('amortises on the French system', () => {
    // $80,000 over 36 months at 36% annual.
    //
    // The source's own catálogo illustrates this case as "$3,650" (`:5790`),
    // which is an approximation written into a template, not a computation.
    // The real payment is $3,664.30 — and this assertion is how the seeded
    // expediente in expedientes-simulados.ts got corrected to match.
    expect(pagoMensual(80_000, 36, 36)).toBeCloseTo(3664.3, 2);
  });

  it('divides evenly at a zero rate', () => {
    expect(pagoMensual(12_000, 0, 12)).toBe(1000);
  });

  it('is monotonic in the rate', () => {
    expect(pagoMensual(50_000, 40, 24)).toBeGreaterThan(pagoMensual(50_000, 36, 24));
  });
});

describe('comisionDe', () => {
  const base: Producto = {
    monto_min: 5000,
    monto_max: 200_000,
    plazo_min: 6,
    plazo_max: 72,
    tasa_anual: 36,
    comision_apertura: true,
    comision_pct: 2,
    comision_desde: 10_000,
  };

  it('charges the percentage above the threshold', () => {
    expect(comisionDe(80_000, base)).toBe(1600);
  });

  it('charges nothing below the threshold', () => {
    expect(comisionDe(9_999, base)).toBe(0);
  });

  it('charges nothing when the product does not charge one', () => {
    expect(comisionDe(80_000, { ...base, comision_apertura: false })).toBe(0);
  });
});

describe('calcularCAT', () => {
  it('equals the nominal rate when nothing is deducted up front', () => {
    // With no commission the CAT is the annual effective rate of the monthly
    // nominal: (1 + 0.36/12)^12 - 1 = 42.576…%
    const pago = pagoMensual(100_000, 36, 24);
    expect(calcularCAT(100_000, pago, 24)).toBeCloseTo(42.58, 1);
  });

  it('rises once a commission is withheld from what the client receives', () => {
    const pago = pagoMensual(80_000, 36, 36);
    const sinComision = calcularCAT(80_000, pago, 36);
    const conComision = calcularCAT(80_000 - 1600, pago, 36);
    expect(conComision).toBeGreaterThan(sinComision);
  });

  it('refuses to invent a figure from nonsense input', () => {
    expect(calcularCAT(0, 100, 12)).toBe(0);
    expect(calcularCAT(1000, 0, 12)).toBe(0);
    expect(calcularCAT(1000, 100, 0)).toBe(0);
  });
});

describe('ejemplosDe', () => {
  const producto: Producto = {
    monto_min: 5000,
    monto_max: 200_000,
    plazo_min: 6,
    plazo_max: 72,
    tasa_anual: 36,
    comision_apertura: true,
    comision_pct: 2,
    comision_desde: 10_000,
  };

  it('previews the floor, a round middle at 24 months, and the ceiling', () => {
    const [bajo, medio, alto] = ejemplosDe(producto);

    expect(bajo.monto).toBe(5000);
    expect(bajo.meses).toBe(6);
    expect(medio.monto).toBe(103_000);
    expect(medio.meses).toBe(24);
    expect(alto.monto).toBe(200_000);
    expect(alto.meses).toBe(72);
  });

  it('computes every figure rather than illustrating it', () => {
    for (const ejemplo of ejemplosDe(producto)) {
      expect(ejemplo.pago).toBeGreaterThan(0);
      expect(ejemplo.cat).toBeGreaterThan(producto.tasa_anual);
      expect(Number.isFinite(ejemplo.cat)).toBe(true);
    }
  });

  it('charges no commission on the smallest loan', () => {
    expect(ejemplosDe(producto)[0].comision).toBe(0);
  });
});
