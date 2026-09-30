import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { environment } from '../../../environments/environment';
import { RestaurarSesion } from '../../state/panel/panel.actions';
import { PanelState } from '../../state/panel/panel.state';
import { PanelApi } from './panel-api';
import { PanelApiHttp } from './panel-api-http.service';

/**
 * A contract test against payloads **recorded from the running Worker** on
 * 2026-09-30, not invented for the test.
 *
 * It exists because the panel spent its whole life talking to a mock, and a
 * mock agrees with whatever the app believes. The two bugs this file pins
 * were both found the first time real responses arrived:
 *
 * - `POST /admin/login` answers `{ nombre_completo }` and nothing else. The
 *   mock also returned `correo`, so the shell's identity line would have
 *   rendered `undefined` after a real login.
 * - `GET /sofom` returns `null` for `telefono` and `correo_contacto`, which a
 *   text input renders as the string "null".
 *
 * Every assertion also checks `withCredentials`. The session is an httpOnly
 * cookie on a different origin from the panel; without it the login appears
 * to work and everything afterwards is a 401.
 */
describe('PanelApiHttp — contra las respuestas reales del Worker', () => {
  let api: PanelApi;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore([PanelState]),
        { provide: PanelApi, useClass: PanelApiHttp },
      ],
    });
    api = TestBed.inject(PanelApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the login response, which carries the name and no correo', async () => {
    const respuesta = api.iniciarSesion({
      correo: 'eduardo@testing.com',
      password: 'Password123#!',
    });
    const promesa = new Promise((listo) => respuesta.subscribe(listo));

    const peticion = http.expectOne(`${base}/admin/login`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.withCredentials).toBe(true);

    // Recorded verbatim from the Worker.
    peticion.flush({ nombre_completo: 'Eduardo Mata' });
    expect(await promesa).toEqual({ nombre_completo: 'Eduardo Mata' });
  });

  it('restores a session from the cookie, which is what a reload does', async () => {
    const store = TestBed.inject(Store);
    store.dispatch(new RestaurarSesion());

    const peticion = http.expectOne(`${base}/admin/me`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBe(true);

    peticion.flush({ correo: 'eduardo@testing.com', nombre_completo: 'Eduardo Mata' });

    expect(store.selectSnapshot(PanelState.autenticado)).toBe(true);
    expect(store.selectSnapshot(PanelState.sesion)?.correo).toBe('eduardo@testing.com');
  });

  it('treats a 401 from /admin/me as "no session yet", not as an error', async () => {
    const store = TestBed.inject(Store);
    store.dispatch(new RestaurarSesion());

    http
      .expectOne(`${base}/admin/me`)
      .flush(
        { error: { code: 'NO_AUTORIZADO', message: 'Inicia sesión para continuar.' } },
        { status: 401, statusText: 'Unauthorized' },
      );

    // The guard reads these two: resolved, and not authenticated.
    expect(store.selectSnapshot(PanelState.resuelta)).toBe(true);
    expect(store.selectSnapshot(PanelState.autenticado)).toBe(false);
    expect(store.selectSnapshot(PanelState.error)).toBeNull();
  });

  it('accepts the null telefono and correo the live sofom row has', async () => {
    const respuesta = api.obtenerSofom();
    const promesa = new Promise((listo) => respuesta.subscribe(listo));

    const peticion = http.expectOne(`${base}/sofom`);
    expect(peticion.request.withCredentials).toBe(true);

    peticion.flush({
      razon_social: 'ONP FER, S.A. de C.V., SOFOM E.N.R.',
      rfc: 'ONP010101AAA',
      domicilio: 'Av. Ejemplo 100, Col. Centro, Monterrey, Nuevo León',
      telefono: null,
      correo_contacto: null,
    });

    expect(await promesa).toMatchObject({ telefono: null, correo_contacto: null });
  });

  it('reads the plantillas list, which carries every version and a null filename', async () => {
    const respuesta = api.listarPlantillas();
    const promesa = new Promise((listo) => respuesta.subscribe(listo));

    http.expectOne(`${base}/plantillas`).flush([
      {
        id: '90769897-a814-4f21-865d-17f0e154bfc6',
        clave: 'solicitud_credito',
        nombre: 'Prueba',
        archivo_original: 'prueba.docx',
        version: 2,
        activa: true,
        creado_en: '2026-09-30T08:48:34.985297+00:00',
      },
      {
        id: '2dcc7c99-38ac-420c-ac38-fdd9bf855496',
        clave: 'solicitud_credito',
        nombre: 'x',
        archivo_original: null,
        version: 1,
        activa: false,
        creado_en: '2026-09-30T08:48:19.718473+00:00',
      },
    ]);

    const lista = (await promesa) as { activa: boolean }[];
    expect(lista).toHaveLength(2);
    // Inactive versions come back too; the panel picks the active one.
    expect(lista.filter((p) => p.activa)).toHaveLength(1);
  });

  it('asks for the export as a blob, so bulk PII is never parsed into state', async () => {
    const respuesta = api.exportarExpedientes();
    const promesa = new Promise<Blob>((listo) => respuesta.subscribe(listo));

    const peticion = http.expectOne(`${base}/expedientes/exportar`);
    expect(peticion.request.responseType).toBe('blob');
    expect(peticion.request.withCredentials).toBe(true);

    peticion.flush(new Blob(['{"total":0}'], { type: 'application/json' }));
    expect(await promesa).toBeInstanceOf(Blob);
  });

  it('sends every filter the table puts in the URL', async () => {
    api.listarExpedientes({ q: 'robles', estado: 'revision', limit: 25, offset: 50 }).subscribe();

    const peticion = http.expectOne(
      (r) => r.url === `${base}/expedientes` && r.params.get('q') === 'robles',
    );
    expect(peticion.request.params.get('estado')).toBe('revision');
    expect(peticion.request.params.get('limit')).toBe('25');
    expect(peticion.request.params.get('offset')).toBe('50');
    expect(peticion.request.withCredentials).toBe(true);

    peticion.flush({ items: [], total: 0 });
  });
});
