import { FormBuilder } from '@angular/forms';
import { PEP_VACIO } from '../../state/solicitud/solicitud.model';
import { aplicarReglasPep, grupoPep, limpiarPep } from './formulario-pep';

/**
 * The rule these tests protect: required-ness comes from the answers, not
 * from whether a div is displayed. That is departure 10, and it is the kind
 * of thing that silently regresses.
 */
describe('aplicarReglasPep', () => {
  const fb = new FormBuilder();

  it('con "No" no exige nada debajo', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: false }, 'propio');
    expect(grupo.valid).toBe(true);
  });

  it('con "Sí" exige ámbito, institución, puesto y fecha de inicio', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'propio');
    expect(grupo.valid).toBe(false);
    expect(grupo.get('ambito')?.hasError('required')).toBe(true);
    expect(grupo.get('institucion')?.hasError('required')).toBe(true);
    expect(grupo.get('puesto')?.hasError('required')).toBe(true);
    expect(grupo.get('inicio.dia')?.hasError('required')).toBe(true);
  });

  it('exige parentesco solo en la declaración de familiares', () => {
    const propio = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'propio');
    const familia = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'familia');
    expect(propio.get('parentesco')?.hasError('required')).toBe(false);
    expect(familia.get('parentesco')?.hasError('required')).toBe(true);
  });

  it('con "Aún vigente" deja de exigir la fecha de terminación', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'propio');
    expect(grupo.get('fin.dia')?.hasError('required')).toBe(true);

    grupo.get('vigente')?.setValue(true);
    aplicarReglasPep(grupo, 'propio');
    expect(grupo.get('fin.dia')?.hasError('required')).toBe(false);
  });

  it('vuelve a exigirla si se desmarca', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: true, vigente: true }, 'propio');
    expect(grupo.get('fin.dia')?.hasError('required')).toBe(false);

    grupo.get('vigente')?.setValue(false);
    aplicarReglasPep(grupo, 'propio');
    expect(grupo.get('fin.dia')?.hasError('required')).toBe(true);
  });

  it('es idempotente: aplicarla dos veces no apila validadores', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'familia');
    aplicarReglasPep(grupo, 'familia');
    aplicarReglasPep(grupo, 'familia');
    grupo.patchValue({
      ambito: 'federal',
      institucion: 'poder_ejecutivo',
      puesto: 'Director',
      parentesco: 'conyuge',
      inicio: { dia: '01', mes: '02', anio: '2015' },
      vigente: true,
    });
    aplicarReglasPep(grupo, 'familia');
    expect(grupo.valid).toBe(true);
  });

  it('un formulario completo con cargo terminado es válido', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'propio');
    grupo.patchValue({
      ambito: 'estatal',
      institucion: 'poder_judicial',
      puesto: 'Juez',
      inicio: { dia: '01', mes: '03', anio: '2010' },
      fin: { dia: '31', mes: '12', anio: '2018' },
    });
    expect(grupo.valid).toBe(true);
  });
});

describe('limpiarPep', () => {
  const fb = new FormBuilder();

  it('borra lo capturado, para que no viaje en el expediente', () => {
    const grupo = grupoPep(fb, { ...PEP_VACIO, aplica: true }, 'familia');
    grupo.patchValue({
      ambito: 'federal',
      puesto: 'Diputado Federal',
      parentesco: 'conyuge',
      inicio: { dia: '01', mes: '09', anio: '2018' },
      vigente: true,
    });

    limpiarPep(grupo);

    expect(grupo.get('puesto')?.value).toBe('');
    expect(grupo.get('parentesco')?.value).toBe('');
    expect(grupo.get('vigente')?.value).toBe(false);
    expect(grupo.get('inicio')?.value).toEqual({ dia: '', mes: '', anio: '' });
  });
});
