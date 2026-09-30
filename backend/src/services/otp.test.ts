import { describe, expect, it } from 'vitest';
import { generarCodigo, VIGENCIA_SEGUNDOS } from './otp';

describe('generarCodigo', () => {
  it('son seis dígitos, con los ceros a la izquierda', () => {
    for (let i = 0; i < 200; i++) expect(generarCodigo()).toMatch(/^\d{6}$/);
  });

  it('cubre el rango completo, incluido el que empieza con cero', () => {
    // Truncar en vez de rellenar dejaría fuera 1 de cada 10 códigos y
    // haría los que empiezan con 0 imposibles de teclear.
    const muestra = Array.from({ length: 3000 }, () => generarCodigo());
    expect(muestra.some((c) => c.startsWith('0'))).toBe(true);
    expect(new Set(muestra).size).toBeGreaterThan(2800);
  });

  it('no está sesgado hacia los valores bajos', () => {
    // Tomar el módulo de un uint32 sin descartar el residuo cargaría el
    // reparto. Con 4000 tiros, las dos mitades deben quedar parejas.
    const muestra = Array.from({ length: 4000 }, () => Number(generarCodigo()));
    const bajos = muestra.filter((n) => n < 500_000).length;
    expect(bajos).toBeGreaterThan(1800);
    expect(bajos).toBeLessThan(2200);
  });
});

describe('vigencia', () => {
  it('son 120 segundos, como la fuente', () => {
    // onp_fer_etapa2_pf.html:2640 — `otpVence = Date.now() + 120000`.
    // La cuenta regresiva de la UI se pinta contra este mismo número.
    expect(VIGENCIA_SEGUNDOS).toBe(120);
  });
});
