import type { Paso, PasoId } from '../../interfaces/paso';

/**
 * The 28 screens, in order.
 *
 * `titulo` is the source's `TITULOS` map (onp_fer_etapa2_pf.html:4383) and
 * `progreso` its `progress` map (:2156) — both verbatim, so the bar advances
 * exactly as the original did.
 *
 * The order in this array IS the wizard order: `NavegacionState` and the
 * step-order guard read it, and nothing else defines "the next step".
 */
export const PASOS: readonly Paso[] = [
  { id: 'bienvenida', ruta: '', titulo: '', progreso: 0, informativa: false },
  { id: 'catalogo', ruta: 'catalogo', titulo: 'Nuestros créditos', progreso: 0, informativa: true },
  { id: 'privacidad', ruta: 'privacidad', titulo: 'Aviso de Privacidad', progreso: 0, informativa: true },
  { id: 'terminos', ruta: 'terminos', titulo: 'Términos y Condiciones', progreso: 0, informativa: true },
  { id: 'ayuda', ruta: 'ayuda', titulo: 'Ayuda y contacto', progreso: 0, informativa: true },

  { id: 'es-cliente', ruta: 'solicitud/es-cliente', titulo: 'Etapa 1: Bienvenida', progreso: 2, informativa: false },
  { id: 'simulador', ruta: 'solicitud/simulador', titulo: 'Etapa 1: Tu crédito', progreso: 4, informativa: false },
  { id: 'requisitos', ruta: 'solicitud/requisitos', titulo: 'Etapa 1: Preparación', progreso: 5, informativa: false },
  { id: 'registro', ruta: 'solicitud/registro', titulo: 'Etapa 1: Tu cuenta', progreso: 6, informativa: false },
  { id: 'verificar-cliente', ruta: 'solicitud/verificar-cliente', titulo: 'Etapa 1: Verificación', progreso: 6, informativa: false },
  { id: 'otp', ruta: 'solicitud/otp', titulo: 'Etapa 1: Verificación', progreso: 7, informativa: false },

  { id: 'auth-location', ruta: 'solicitud/auth-location', titulo: 'Etapa 2: Autorizaciones', progreso: 10, informativa: false },
  { id: 'form-generales', ruta: 'solicitud/form-generales', titulo: 'Etapa 2: Identificación', progreso: 14, informativa: false },
  { id: 'form-domicilio', ruta: 'solicitud/form-domicilio', titulo: 'Etapa 2: Identificación', progreso: 19, informativa: false },
  { id: 'form-contacto', ruta: 'solicitud/form-contacto', titulo: 'Etapa 2: Identificación', progreso: 24, informativa: false },
  { id: 'form-laborales', ruta: 'solicitud/form-laborales', titulo: 'Etapa 2: Identificación', progreso: 29, informativa: false },
  { id: 'envio-formulario', ruta: 'solicitud/envio-formulario', titulo: 'Etapa 2: Envío del formulario', progreso: 32, informativa: false },

  { id: 'pep-propio', ruta: 'solicitud/pep-propio', titulo: 'Etapa 2: Declaratorias', progreso: 36, informativa: false },
  { id: 'pep-familia', ruta: 'solicitud/pep-familia', titulo: 'Etapa 2: Declaratorias', progreso: 39, informativa: false },
  { id: 'declaratoria', ruta: 'solicitud/declaratoria', titulo: 'Etapa 2: Declaratorias', progreso: 44, informativa: false },

  { id: 'auth-buro', ruta: 'solicitud/auth-buro', titulo: 'Etapa 2: Autorizaciones', progreso: 50, informativa: false },
  { id: 'id-photos', ruta: 'solicitud/id-photos', titulo: 'Etapa 2: Identificación', progreso: 60, informativa: false },
  { id: 'documents', ruta: 'solicitud/documents', titulo: 'Etapa 2: Documentos', progreso: 68, informativa: false },
  { id: 'biometrics', ruta: 'solicitud/biometrics', titulo: 'Etapa 2: Biometría', progreso: 75, informativa: false },
  { id: 'video', ruta: 'solicitud/video', titulo: 'Etapa 2: Videograbación', progreso: 82, informativa: false },
  { id: 'solicitud', ruta: 'solicitud/solicitud', titulo: 'Etapa 2: Tu solicitud', progreso: 90, informativa: false },
  { id: 'signature', ruta: 'solicitud/signature', titulo: 'Etapa 2: Firma', progreso: 96, informativa: false },
  { id: 'complete', ruta: 'solicitud/complete', titulo: 'Solicitud enviada', progreso: 100, informativa: false },
];

const PORi = new Map<PasoId, Paso>(PASOS.map((p) => [p.id, p]));
const POR_RUTA = new Map<string, Paso>(PASOS.map((p) => [p.ruta, p]));

export function pasoPorId(id: PasoId): Paso {
  const p = PORi.get(id);
  if (!p) throw new Error(`Paso desconocido: ${id}`);
  return p;
}

export function pasoPorRuta(ruta: string): Paso | undefined {
  return POR_RUTA.get(ruta.replace(/^\/+/, ''));
}

/** Position in the wizard order. -1 when the id is not a step. */
export function indicePaso(id: PasoId): number {
  return PASOS.findIndex((p) => p.id === id);
}
