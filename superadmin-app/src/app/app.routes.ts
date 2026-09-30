import { Routes } from '@angular/router';

import { sesionGuard } from './guards/sesion.guard';

/**
 * Every route is lazy (§6).
 *
 * The detail route addresses a row by its opaque id — never by folio, CURP or
 * name. §12: no field value reaches a URL.
 */
export const routes: Routes = [
  {
    path: 'acceso',
    title: 'Acceso administrativo — ONP FER',
    loadComponent: () => import('./pages/acceso/acceso').then((m) => m.Acceso),
  },
  {
    path: '',
    canActivate: [sesionGuard],
    loadComponent: () => import('./layout/panel-shell/panel-shell').then((m) => m.PanelShell),
    children: [
      {
        path: 'expedientes',
        title: 'Expedientes — ONP FER',
        loadComponent: () =>
          import('./pages/expedientes/expedientes').then((m) => m.Expedientes),
      },
      {
        path: 'expedientes/:id',
        title: 'Expediente — ONP FER',
        loadComponent: () =>
          import('./pages/expediente-detalle/expediente-detalle').then(
            (m) => m.ExpedienteDetalleVista,
          ),
      },
      {
        path: 'producto',
        title: 'Producto — ONP FER',
        loadComponent: () => import('./pages/producto/producto').then((m) => m.ProductoVista),
      },
      {
        path: 'formatos',
        title: 'Formatos — ONP FER',
        loadComponent: () => import('./pages/formatos/formatos').then((m) => m.Formatos),
      },
      {
        path: 'ajustes',
        title: 'Ajustes — ONP FER',
        loadComponent: () => import('./pages/ajustes/ajustes').then((m) => m.Ajustes),
      },
      { path: '', pathMatch: 'full', redirectTo: 'expedientes' },
    ],
  },
  { path: '**', redirectTo: '' },
];
