import { Injectable, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { Observable, map } from 'rxjs';
import { describe, expect, it, beforeEach } from 'vitest';

import { ExpedienteDetalle } from '../../model/interfaces/expediente-detalle';
import { ImpresionDocumento } from '../../services/domain/impresion-documento.service';

import { PanelApi } from '../../services/http/panel-api';
import { PanelApiSimulada } from '../../services/http/panel-api-simulada.service';
import { EXPEDIENTES_SIMULADOS } from '../../services/http/expedientes-simulados';
import { ExpedientesState } from '../../state/expedientes/expedientes.state';
import { PanelState } from '../../state/panel/panel.state';
import { ExpedienteDetalleVista } from './expediente-detalle';

/**
 * A smoke test for the payoff screen.
 *
 * It exists for one reason: this view has the most template in the panel, and
 * a build that type-checks can still throw the first time it renders. The
 * test renders the completed seeded expediente for real — every section, the
 * estado selector, the signed-URL image panes — and asserts the page got as
 * far as painting the folio.
 *
 * Not a substitute for the QA pass (CP-F13's panel equivalent); a tripwire.
 */
describe('ExpedienteDetalleVista', () => {
  const completo = EXPEDIENTES_SIMULADOS[0];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore([PanelState, ExpedientesState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
  });

  it('paints the expediente it was pointed at', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ExpedienteDetalleVista);
    // The component loads its own data from the route input; nothing is
    // pre-seeded, so this exercises the real path.
    fixture.componentRef.setInput('id', completo.id);
    await fixture.whenStable();

    // PanelApiSimulada answers on a timer, as the Worker will.
    await esperarA(() => store.selectSnapshot(ExpedientesState.abierto) !== null);
    await fixture.whenStable();

    const texto: string = fixture.nativeElement.textContent;

    expect(texto).toContain(completo.folio);
    expect(texto).toContain('Páez Esquivel Fernando');
    expect(texto).toContain('PAEF990319HNLZSR09');
    // The source's empty state, on a field this expediente never filled in.
    expect(texto).toContain('No proporcionado');
    // Sections that only render for a complete file.
    expect(texto).toContain('Fotografías de la identificación');
    expect(texto).toContain('Ubicaciones registradas');
    expect(texto).toContain('Al firmar');
    // It got past loading and past the error branch.
    expect(texto).not.toContain('Cargando el expediente…');
    expect(store.selectSnapshot(ExpedientesState.errorDetalle)).toBeNull();
  });

  it('keeps no expediente field value in the route', () => {
    // The detail is addressed by opaque id. Regression guard for §12.
    expect(completo.id).not.toContain(completo.folio);
    expect(completo.id).not.toContain(completo.curp ?? '');
  });

  /**
   * CP-V3. Two assertions that would each have caught a real defect:
   *
   * - the file list naming the videograbación instead of printing a blank
   *   row, which is what an unmapped `tipo` does;
   * - `preload="metadata"` on the player, which is the difference between
   *   opening an expediente and pulling a 25 MB file for it.
   */
  it('names the videograbación and plays it without preloading it', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ExpedienteDetalleVista);
    fixture.componentRef.setInput('id', completo.id);
    await fixture.whenStable();
    await esperarA(() => store.selectSnapshot(ExpedientesState.abierto) !== null);
    await fixture.whenStable();

    // The seeded complete expediente carries one.
    expect(completo.archivos.some((a) => a.tipo === 'video_identificacion')).toBe(true);

    // No row in "Archivos recibidos" is nameless.
    const nombres: string[] = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('li'),
    )
      .filter((li) => li.querySelector('.font-mono'))
      .map((li) => li.querySelector('p')!.textContent!.trim());
    expect(nombres.length).toBe(completo.archivos.length);
    expect(nombres).not.toContain('');
    expect(nombres).toContain('Videograbación de identificación');

    // The player is mounted, and mounted with the right attributes.
    await esperarA(() => fixture.nativeElement.querySelector('video') !== null);
    const video: HTMLVideoElement = fixture.nativeElement.querySelector('video');
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(video.hasAttribute('controls')).toBe(true);
    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('src')).toBeTruthy();
    // §9: the element needs an accessible name of its own — a figcaption is
    // not one.
    expect(video.getAttribute('aria-label')).toBeTruthy();
  });
});

/**
 * The videograbación that was recorded and never arrived.
 *
 * `03-videograbacion.md`: the video is the one upload allowed to fail without
 * costing the submission, so `video_grabado` set with no
 * `video_identificacion` row is a state the Worker can legitimately produce.
 * An analyst must be able to tell it apart from a prospect who never
 * recorded one. The seeded Robles expediente is exactly that shape.
 */
describe('ExpedienteDetalleVista — videograbación declarada sin archivo', () => {
  const sinVideo = EXPEDIENTES_SIMULADOS[1];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore([PanelState, ExpedientesState]),
        { provide: PanelApi, useClass: PanelApiSimulada },
      ],
    });
  });

  it('says so instead of showing an empty player', async () => {
    expect(sinVideo.video_grabado).toBe(true);
    expect(sinVideo.archivos.some((a) => a.tipo === 'video_identificacion')).toBe(false);

    const store = TestBed.inject(Store);
    const fixture = TestBed.createComponent(ExpedienteDetalleVista);
    fixture.componentRef.setInput('id', sinVideo.id);
    await fixture.whenStable();
    await esperarA(() => store.selectSnapshot(ExpedientesState.abierto) !== null);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('video')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'La solicitud registra la videograbación, pero el archivo no llegó al expediente.',
    );
  });
});

/**
 * Polls until `condicion` holds, so the test waits on the real timers.
 *
 * It waits for the *result*, never for a `cargando` flag: every loading flag
 * in this app starts false, so polling one can pass before the load has even
 * been dispatched. That race made this suite fail about one run in ten.
 */
async function esperarA(condicion: () => boolean, msMaximo = 3000): Promise<void> {
  const limite = Date.now() + msMaximo;
  while (!condicion()) {
    if (Date.now() > limite) throw new Error('La condición no se cumplió a tiempo.');
    await new Promise((listo) => setTimeout(listo, 25));
  }
}


/**
 * A stored document carrying a script, the way the database can already hold
 * one.
 *
 * The source's `llenarPlantilla` (`onp_fer_etapa2_pf.html:3716`) interpolates
 * form values into the solicitud template without escaping, so a prospect who
 * types `<script>` into a surname gets it stored verbatim in
 * `documentos.contenido_html`. `web-app/` escapes at generation now, but rows
 * written by the original single-file app are still there — and this view
 * renders them inside an authenticated staff session that can read every
 * expediente.
 */
const completoId = EXPEDIENTES_SIMULADOS[0].id;

const DOCUMENTO_HOSTIL = `
  <h1>SOLICITUD DE CRÉDITO SIMPLE</h1>
  <p class="j">Texto legítimo que debe sobrevivir.</p>
  <script>globalThis.__xss_ejecutado = true;</script>
  <img src="x" onerror="globalThis.__xss_ejecutado = true">
  <p onclick="globalThis.__xss_ejecutado = true">Con manejador</p>
`;

/** Records what the component hands the print window, without opening one. */
@Injectable()
class ImpresionEspia extends ImpresionDocumento {
  recibido: string | null = null;

  override imprimir(_folio: string, contenidoHtml: string): boolean {
    this.recibido = contenidoHtml;
    return true;
  }
}

@Injectable()
class PanelApiHostil extends PanelApiSimulada {
  override obtenerExpediente(id: string): Observable<ExpedienteDetalle> {
    return super.obtenerExpediente(id).pipe(
      map((e) => ({
        ...e,
        documento: { contenido_html: DOCUMENTO_HOSTIL, firmado_en: null },
      })),
    );
  }
}

describe('ExpedienteDetalleVista — HTML almacenado', () => {
  let espia: ImpresionEspia;

  beforeEach(() => {
    delete (globalThis as Record<string, unknown>)['__xss_ejecutado'];

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore([PanelState, ExpedientesState]),
        { provide: PanelApi, useClass: PanelApiHostil },
        ImpresionEspia,
        { provide: ImpresionDocumento, useExisting: ImpresionEspia },
      ],
    });
    espia = TestBed.inject(ImpresionEspia);
  });

  it('strips a script out of a stored document before rendering it', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ExpedienteDetalleVista);
    fixture.componentRef.setInput('id', completoId);
    await fixture.whenStable();
    await esperarA(() => store.selectSnapshot(ExpedientesState.abierto) !== null);
    await fixture.whenStable();

    // "Ver documento" — the script only reaches the DOM once it is shown.
    const botones: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const ver = botones.find((b) => b.textContent?.includes('Ver documento'));
    expect(ver).toBeTruthy();
    ver!.click();
    await fixture.whenStable();

    const hoja: HTMLElement = fixture.nativeElement.querySelector('.doc-hoja');
    expect(hoja).toBeTruthy();

    // The legitimate content survives sanitisation.
    expect(hoja.textContent).toContain('Texto legítimo que debe sobrevivir.');

    // The payload does not.
    expect(hoja.querySelector('script')).toBeNull();
    expect(hoja.innerHTML).not.toContain('<script');
    expect(hoja.innerHTML).not.toContain('onerror');
    expect(hoja.innerHTML).not.toContain('onclick');
    expect((globalThis as Record<string, unknown>)['__xss_ejecutado']).toBeUndefined();
  });

  it('hands the print window sanitised HTML, never the stored string', async () => {
    const store = TestBed.inject(Store);

    const fixture = TestBed.createComponent(ExpedienteDetalleVista);
    fixture.componentRef.setInput('id', completoId);
    await fixture.whenStable();
    await esperarA(() => store.selectSnapshot(ExpedientesState.abierto) !== null);
    await fixture.whenStable();

    const botones: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    botones.find((b) => b.textContent?.includes('Descargar PDF'))!.click();
    await fixture.whenStable();

    // The print window is about:blank and inherits this origin, so anything
    // written into it runs with the staff session's access.
    expect(espia.recibido).toBeTruthy();
    expect(espia.recibido).not.toContain('<script');
    expect(espia.recibido).not.toContain('onerror');

    // Asserted against what the window will parse, not the raw string: the
    // sanitiser returns accented characters as numeric entities
    // (`&#237;` for í), which the HTML parser decodes on the way in. The
    // printed solicitud keeps its accents — §11 is not negotiable about that.
    const impreso = new DOMParser().parseFromString(espia.recibido!, 'text/html');
    expect(impreso.body.textContent).toContain('Texto legítimo que debe sobrevivir.');
    expect(impreso.querySelector('script')).toBeNull();
    expect(impreso.querySelector('[onerror]')).toBeNull();
    expect(impreso.querySelector('[onclick]')).toBeNull();
  });
});
