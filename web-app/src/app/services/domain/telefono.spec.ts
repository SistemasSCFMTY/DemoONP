import { formatearTelefono, soloDigitosTelefono } from './telefono';

describe('formatearTelefono', () => {
  it('agrupa diez dígitos en 2-4-4', () => {
    expect(formatearTelefono('8112345678')).toBe('81 1234 5678');
  });

  it('no inserta el espacio antes de que haya con qué agrupar', () => {
    expect(formatearTelefono('8')).toBe('8');
    expect(formatearTelefono('81')).toBe('81');
    expect(formatearTelefono('811')).toBe('81 1');
  });

  it('descarta lo que no sea dígito', () => {
    expect(formatearTelefono('+52 (81) 1234-5678')).toBe('52 8112 3456');
  });

  it('corta en diez dígitos', () => {
    expect(formatearTelefono('81123456789999')).toBe('81 1234 5678');
  });

  it('es idempotente sobre su propia salida', () => {
    const una = formatearTelefono('8112345678');
    expect(formatearTelefono(una)).toBe(una);
  });
});

describe('soloDigitosTelefono', () => {
  it('devuelve lo que la API espera', () => {
    expect(soloDigitosTelefono('81 1234 5678')).toBe('8112345678');
  });
});
