import { PRODUCTO_PREDETERMINADO } from '../../model/constants/producto/producto-predeterminado';
import type { Producto } from '../../model/interfaces/producto';
import { comisionDe, pagoMensual, pesos, pesosCent } from './amortizacion';

/**
 * These assertions are the contract with the person on stage who will do the
 * arithmetic on their phone. Expected values are independently derivable from
 * the French amortisation formula, not copied out of the implementation.
 */
describe('pagoMensual', () => {
  it('amortiza $50,000 a 36% en 24 meses en pagos de $2,952.37', () => {
    // i = 0.03 monthly; 50000 · (0.03 · 1.03^24) / (1.03^24 − 1)
    expect(pagoMensual(50000, 36, 24)).toBeCloseTo(2952.3707974485, 6);
  });

  it('escala linealmente con el capital', () => {
    expect(pagoMensual(100000, 36, 24)).toBeCloseTo(2 * pagoMensual(50000, 36, 24), 6);
  });

  it('con tasa cero reparte el capital en partes iguales', () => {
    expect(pagoMensual(12000, 0, 12)).toBe(1000);
  });

  it('calcula el mínimo del producto: $5,000 a 6 meses', () => {
    expect(pagoMensual(5000, 36, 6)).toBeCloseTo(922.9875022509, 6);
  });

  it('calcula el máximo del producto: $200,000 a 72 meses', () => {
    expect(pagoMensual(200000, 36, 72)).toBeCloseTo(6810.8089189339, 6);
  });

  it('la suma de los pagos excede el capital cuando hay tasa', () => {
    const pago = pagoMensual(50000, 36, 24);
    expect(pago * 24).toBeGreaterThan(50000);
  });
});

describe('comisionDe', () => {
  const producto = PRODUCTO_PREDETERMINADO;

  it('cobra 2% sobre el monto', () => {
    expect(comisionDe(50000, producto)).toBe(1000);
  });

  it('no cobra por debajo del umbral', () => {
    expect(comisionDe(9999, producto)).toBe(0);
  });

  it('cobra exactamente en el umbral', () => {
    expect(comisionDe(10000, producto)).toBe(200);
  });

  it('no cobra nada cuando el producto no tiene comisión de apertura', () => {
    const sinComision: Producto = { ...producto, comision_apertura: false };
    expect(comisionDe(200000, sinComision)).toBe(0);
  });
});

describe('pesos', () => {
  it('formatea en pesos sin centavos, con separador es-MX', () => {
    expect(pesos(50000)).toBe('$50,000');
  });

  it('redondea', () => {
    expect(pesos(2952.37)).toBe('$2,952');
  });

  it('formatea cero', () => {
    expect(pesos(0)).toBe('$0');
  });
});

describe('pesosCent', () => {
  it('siempre muestra dos decimales', () => {
    expect(pesosCent(2952.3707974485)).toBe('$2,952.37');
    expect(pesosCent(1000)).toBe('$1,000.00');
  });
});
