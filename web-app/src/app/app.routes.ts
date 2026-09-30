import type { Routes } from '@angular/router';
import { pasoAlcanzadoGuard } from './guards/paso-alcanzado-guard';

/**
 * One lazy route per screen (01-conventions.md §6).
 *
 * `data.paso` is what `pasoAlcanzadoGuard` reads; the path and the step id
 * agree with `model/constants/pasos/pasos.ts`, which is the wizard order.
 *
 * The four informational screens open off the portada and carry no guard:
 * anybody may read the aviso de privacidad, including someone who has not
 * started an application. That is the point of them.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/bienvenida/bienvenida').then((m) => m.Bienvenida),
    data: { paso: 'bienvenida' },
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./pages/catalogo/catalogo').then((m) => m.Catalogo),
    data: { paso: 'catalogo' },
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./pages/privacidad/privacidad').then((m) => m.Privacidad),
    data: { paso: 'privacidad' },
  },
  {
    path: 'terminos',
    loadComponent: () => import('./pages/terminos/terminos').then((m) => m.Terminos),
    data: { paso: 'terminos' },
  },
  {
    path: 'ayuda',
    loadComponent: () => import('./pages/ayuda/ayuda').then((m) => m.Ayuda),
    data: { paso: 'ayuda' },
  },

  {
    path: 'solicitud',
    children: [
      {
        path: 'es-cliente',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/es-cliente/es-cliente').then((m) => m.EsCliente),
        data: { paso: 'es-cliente' },
      },
      {
        path: 'simulador',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/simulador/simulador').then((m) => m.Simulador),
        data: { paso: 'simulador' },
      },
      {
        path: 'requisitos',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/requisitos/requisitos').then((m) => m.Requisitos),
        data: { paso: 'requisitos' },
      },
      {
        path: 'registro',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/registro/registro').then((m) => m.Registro),
        data: { paso: 'registro' },
      },
      {
        path: 'verificar-cliente',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/verificar-cliente/verificar-cliente').then((m) => m.VerificarCliente),
        data: { paso: 'verificar-cliente' },
      },
      {
        path: 'otp',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/otp/otp').then((m) => m.Otp),
        data: { paso: 'otp' },
      },
      {
        path: 'auth-location',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/auth-location/auth-location').then((m) => m.AuthLocation),
        data: { paso: 'auth-location' },
      },
      {
        path: 'form-generales',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/form-generales/form-generales').then((m) => m.FormGenerales),
        data: { paso: 'form-generales' },
      },
      {
        path: 'form-domicilio',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/form-domicilio/form-domicilio').then((m) => m.FormDomicilio),
        data: { paso: 'form-domicilio' },
      },
      {
        path: 'form-contacto',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/form-contacto/form-contacto').then((m) => m.FormContacto),
        data: { paso: 'form-contacto' },
      },
      {
        path: 'form-laborales',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/form-laborales/form-laborales').then((m) => m.FormLaborales),
        data: { paso: 'form-laborales' },
      },
      {
        path: 'envio-formulario',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/envio-formulario/envio-formulario').then((m) => m.EnvioFormulario),
        data: { paso: 'envio-formulario' },
      },
      {
        path: 'pep-propio',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/pep-propio/pep-propio').then((m) => m.PepPropio),
        data: { paso: 'pep-propio' },
      },
      {
        path: 'pep-familia',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/pep-familia/pep-familia').then((m) => m.PepFamilia),
        data: { paso: 'pep-familia' },
      },
      {
        path: 'declaratoria',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/declaratoria/declaratoria').then((m) => m.Declaratoria),
        data: { paso: 'declaratoria' },
      },
      {
        path: 'auth-buro',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/auth-buro/auth-buro').then((m) => m.AuthBuro),
        data: { paso: 'auth-buro' },
      },
      {
        path: 'id-photos',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/id-photos/id-photos').then((m) => m.IdPhotos),
        data: { paso: 'id-photos' },
      },
      {
        path: 'documents',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/documents/documents').then((m) => m.Documents),
        data: { paso: 'documents' },
      },
      {
        path: 'biometrics',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/biometrics/biometrics').then((m) => m.Biometrics),
        data: { paso: 'biometrics' },
      },
      {
        path: 'video',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/video/video').then((m) => m.Video),
        data: { paso: 'video' },
      },
      {
        path: 'solicitud',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () =>
          import('./pages/solicitud/revision-solicitud/revision-solicitud').then((m) => m.RevisionSolicitud),
        data: { paso: 'solicitud' },
      },
      {
        path: 'signature',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/signature/signature').then((m) => m.Signature),
        data: { paso: 'signature' },
      },
      {
        path: 'complete',
        canActivate: [pasoAlcanzadoGuard],
        loadComponent: () => import('./pages/solicitud/complete/complete').then((m) => m.Complete),
        data: { paso: 'complete' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'es-cliente' },
    ],
  },

  { path: '**', redirectTo: '' },
];
