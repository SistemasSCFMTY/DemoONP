import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngxs/store';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { DatosSofom } from '../model/interfaces/sofom';
import { DescargaArchivo } from '../services/domain/descarga-archivo.service';
import { PanelApi } from '../services/http/panel-api';
import { PanelApiSimulada } from '../services/http/panel-api-simulada.service';
import {
  CargarPlantillas,
  QuitarPlantilla,
  SubirPlantilla,
} from './plantillas/plantillas.actions';
import { PlantillasState } from './plantillas/plantillas.state';
import { CargarSofom, ExportarExpedientes, GuardarSofom } from './sofom/sofom.actions';
import { SofomState } from './sofom/sofom.state';

/**
 * The write paths, exercised against the in-memory `PanelApi`.
 *
 * **Deliberately not against the running Worker.** `wrangler dev` points at
 * the owner's live production Supabase: `PUT /sofom` overwrites the single
 * tenant row whose razón social is printed in every email footer and in the
 * aviso de privacidad, and `POST /plantillas` writes rows nobody can clean up
 * from the panel. These paths are verified here and confirmed against the
 * real backend once, deliberately, by someone with the owner's say-so.
 *
 * This is what `PanelApiSimulada` is for, and why keeping it was right even
 * after the app moved onto the real API.
 */
describe('Escrituras del panel, contra la API simulada', () => {
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStore([SofomState, PlantillasState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
    store = TestBed.inject(Store);
  });

  describe('GuardarSofom', () => {
    const datos: DatosSofom = {
      razon_social: 'ONP FER, S.A. de C.V., SOFOM, E.N.R.',
      rfc: 'ONP010101AAA',
      domicilio: 'Av. Ejemplo 100, Col. Centro, Monterrey, Nuevo León',
      telefono: '81 1234 5678',
      correo_contacto: 'contacto@onpfer.mx',
    };

    it('saves and reflects the row back', async () => {
      await esperarDespacho(store, new GuardarSofom(datos));

      expect(store.selectSnapshot(SofomState.datos)).toEqual(datos);
      expect(store.selectSnapshot(SofomState.guardado)).toBe(true);
      expect(store.selectSnapshot(SofomState.error)).toBeNull();
    });

    it('keeps an emptied optional field as null, not as an empty string', async () => {
      await esperarDespacho(
        store,
        new GuardarSofom({ ...datos, telefono: null, correo_contacto: null }),
      );

      const guardados = store.selectSnapshot(SofomState.datos);
      expect(guardados?.telefono).toBeNull();
      expect(guardados?.correo_contacto).toBeNull();
    });

    it('survives a round trip', async () => {
      await esperarDespacho(store, new GuardarSofom(datos));
      await esperarDespacho(store, new CargarSofom());
      expect(store.selectSnapshot(SofomState.datos)).toEqual(datos);
    });
  });

  describe('ExportarExpedientes', () => {
    it('hands the blob straight to a download and keeps it out of the store', async () => {
      const descarga = TestBed.inject(DescargaArchivo);
      const espia = vi.spyOn(descarga, 'descargar').mockImplementation(() => undefined);

      await esperarDespacho(store, new ExportarExpedientes());

      expect(espia).toHaveBeenCalledOnce();
      const [contenido, nombre] = espia.mock.calls[0];
      expect(contenido).toBeInstanceOf(Blob);
      expect(nombre).toMatch(/^expedientes_\d{4}-\d{2}-\d{2}\.json$/);

      // Bulk PII must not linger anywhere a devtools panel can read it.
      expect(JSON.stringify(store.snapshot())).not.toContain('CURP');
      expect(store.selectSnapshot(SofomState.exportando)).toBe(false);
    });
  });

  describe('SubirPlantilla', () => {
    const plantilla = {
      clave: 'solicitud_credito',
      nombre: 'Formato ONP',
      contenido_html: '<h1>SOLICITUD</h1><p>{{curp}}</p>',
      archivo_original: 'Formato ONP.docx',
    };

    it('stores the converted HTML and makes it the active template', async () => {
      await esperarDespacho(store, new SubirPlantilla(plantilla, []));

      const activa = store.selectSnapshot(PlantillasState.activa);
      expect(activa?.archivo_original).toBe('Formato ONP.docx');
      expect(activa?.activa).toBe(true);
      expect(store.selectSnapshot(PlantillasState.aviso)).toBe(
        'Formato guardado correctamente.',
      );
    });

    it('reports unrecognised claves without refusing the upload', async () => {
      await esperarDespacho(store, new SubirPlantilla(plantilla, ['curpp', 'nombre_invertid']));

      // The source's behaviour (`:5757`): saved, and the operator is told.
      expect(store.selectSnapshot(PlantillasState.activa)).not.toBeNull();
      expect(store.selectSnapshot(PlantillasState.clavesDesconocidas)).toEqual([
        'curpp',
        'nombre_invertid',
      ]);
      expect(store.selectSnapshot(PlantillasState.aviso)).toContain('claves no reconocidas');
    });

    it('supersedes the previous version rather than adding a second active one', async () => {
      await esperarDespacho(store, new SubirPlantilla(plantilla, []));
      await esperarDespacho(
        store,
        new SubirPlantilla({ ...plantilla, nombre: 'Formato v2' }, []),
      );
      await esperarDespacho(store, new CargarPlantillas());

      expect(store.selectSnapshot(PlantillasState.activa)?.nombre).toBe('Formato v2');
    });
  });

  describe('QuitarPlantilla', () => {
    it('deactivates it and falls back to the predeterminado', async () => {
      await esperarDespacho(
        store,
        new SubirPlantilla(
          {
            clave: 'solicitud_credito',
            nombre: 'Formato ONP',
            contenido_html: '<p>x</p>',
            archivo_original: 'Formato ONP.docx',
          },
          [],
        ),
      );

      const id = store.selectSnapshot(PlantillasState.activa)!.id;
      await esperarDespacho(store, new QuitarPlantilla(id));

      expect(store.selectSnapshot(PlantillasState.activa)).toBeNull();
      expect(store.selectSnapshot(PlantillasState.aviso)).toBe(
        'Se volverá a usar el formato predeterminado.',
      );
    });
  });
});

/** Waits for an action's handler to finish, including its http call. */
function esperarDespacho(store: Store, accion: object): Promise<void> {
  return new Promise((listo) => store.dispatch(accion).subscribe(() => listo()));
}
