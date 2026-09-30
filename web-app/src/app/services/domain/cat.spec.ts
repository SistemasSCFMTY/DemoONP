import { pagoMensual } from './amortizacion';
import { calcularCAT } from './cat';

describe('calcularCAT', () => {
  it('sin comisión, el CAT es la tasa efectiva anual de la nominal', () => {
    // 36% nominal capitalizable mensualmente → (1.03^12 − 1) = 42.576%
    const pago = pagoMensual(50000, 36, 24);
    const esperado = (Math.pow(1.03, 12) - 1) * 100;
    expect(calcularCAT(50000, pago, 24)).toBeCloseTo(esperado, 6);
    expect(esperado).toBeCloseTo(42.5760886846, 6);
  });

  it('la comisión de apertura sube el CAT por encima de la tasa efectiva', () => {
    const pago = pagoMensual(50000, 36, 24);
    const conComision = calcularCAT(49000, pago, 24); // $1,000 de comisión
    const sinComision = calcularCAT(50000, pago, 24);
    expect(conComision).toBeGreaterThan(sinComision);
    expect(conComision).toBeCloseTo(45.7379251744, 6);
  });

  it('es invariante a la escala: el doble de todo da el mismo CAT', () => {
    const pago = pagoMensual(50000, 36, 24);
    expect(calcularCAT(98000, 2 * pago, 24)).toBeCloseTo(calcularCAT(49000, pago, 24), 6);
  });

  it('coincide con el 45.8% que el simulador del original muestra', () => {
    const pago = pagoMensual(50000, 36, 24);
    expect(calcularCAT(49000, pago, 24).toFixed(1)).toBe('45.7');
  });

  it('un plazo más largo con la misma comisión diluye su efecto en el CAT', () => {
    const corto = calcularCAT(49000, pagoMensual(50000, 36, 12), 12);
    const largo = calcularCAT(49000, pagoMensual(50000, 36, 60), 60);
    expect(corto).toBeGreaterThan(largo);
  });

  it('devuelve cero en lugar de NaN ante entradas sin sentido', () => {
    expect(calcularCAT(0, 100, 12)).toBe(0);
    expect(calcularCAT(-1000, 100, 12)).toBe(0);
    expect(calcularCAT(50000, 0, 12)).toBe(0);
    expect(calcularCAT(50000, 100, 0)).toBe(0);
  });

  it('un pago que apenas devuelve el capital da un CAT cercano a cero', () => {
    expect(calcularCAT(12000, 1000, 12)).toBeCloseTo(0, 6);
  });
});
