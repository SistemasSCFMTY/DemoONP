import { describe, expect, it } from 'vitest';

import { GuardarPasoSchema, VerificarClienteSchema } from './cliente';
import { enmascararTelefono } from '../services/clientes';

describe('VerificarClienteSchema', () => {
  const base = {
    numeroCliente: 'C-001',
    nombreCompleto: 'Laura Ramírez Sandoval',
    curp: 'rasl910714mnlmlr04',
  };

  it('sube la CURP a mayúsculas, porque la pantalla lo hace', () => {
    // `verificarCliente` (:2581) hace `.toUpperCase()` antes de buscar.
    // Sin esto, quien teclea en minúsculas no encuentra su expediente.
    expect(VerificarClienteSchema.parse(base).curp).toBe('RASL910714MNLMLR04');
  });

  it('exige dieciocho caracteres con el mensaje de la fuente', () => {
    const r = VerificarClienteSchema.safeParse({ ...base, curp: 'RASL910714' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('La CURP debe tener 18 caracteres.');
  });

  it('pide los tres campos que la pantalla marca obligatorios', () => {
    for (const campo of ['numeroCliente', 'nombreCompleto'] as const) {
      expect(VerificarClienteSchema.safeParse({ ...base, [campo]: '  ' }).success).toBe(false);
    }
  });
});

describe('GuardarPasoSchema', () => {
  it('acepta un id de paso del front', () => {
    expect(GuardarPasoSchema.parse({ paso: 'form-domicilio' }).paso).toBe('form-domicilio');
  });

  it('rechaza cualquier cosa que no sea un slug', () => {
    // La columna es texto libre a propósito, pero eso no significa que
    // el endpoint acepte lo que sea: sin esto es un campo de texto
    // arbitrario escribible desde fuera.
    for (const malo of ['../../etc', '<script>', 'Form Domicilio', 'x'.repeat(41)]) {
      expect(GuardarPasoSchema.safeParse({ paso: malo }).success).toBe(false);
    }
  });
});

describe('enmascararTelefono', () => {
  it('deja ver los últimos cuatro y nada más', () => {
    expect(enmascararTelefono('81 1234 5678')).toBe('•• •••• 5678');
    expect(enmascararTelefono('+52 81 1234 5678')).toBe('•• •••• 5678');
  });
});
