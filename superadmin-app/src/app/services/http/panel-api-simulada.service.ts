import { Injectable } from '@angular/core';
import { Observable, delay, of, switchMap, throwError, timer } from 'rxjs';

import { TIPO_ARCHIVO_VIDEO } from '../../model/constants/expediente/tipos-archivo';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import { ErrorApi } from '../../model/interfaces/error-api';
import {
  ExpedienteDetalle,
  TipoArchivo,
  UrlFirmada,
} from '../../model/interfaces/expediente-detalle';
import {
  ExpedienteResumen,
  FiltrosExpedientes,
  PaginaExpedientes,
} from '../../model/interfaces/expediente-resumen';
import { NuevaPlantilla, Plantilla, PlantillaResumen } from '../../model/interfaces/plantilla';
import { Producto } from '../../model/interfaces/producto';
import { DatosSofom } from '../../model/interfaces/sofom';
import {
  CredencialesPanel,
  RespuestaLogin,
  SesionPanel,
} from '../../model/interfaces/sesion-panel';
import { EXPEDIENTES_SIMULADOS } from './expedientes-simulados';
import { IMAGENES_SIMULADAS } from './imagenes-simuladas';
import { PanelApi } from './panel-api';
import { VIDEO_SIMULADO } from './video-simulado';

/**
 * An in-memory `PanelApi`, for building the panel while CP-B4 and CP-B7 are
 * written on the other track.
 *
 * It is a development stand-in and it says so: it accepts any password, and
 * **that is not a security hole** because there is nothing behind it — the
 * expedientes are three invented people in a TypeScript array. Real
 * authorization is the Worker's, always (§12); the guard in this app is a
 * convenience for the operator, not a boundary, and nothing here changes that.
 *
 * Latency is simulated so loading states, the disabled submit button and the
 * table's empty message are exercised during development rather than
 * discovered on stage.
 */
@Injectable()
export class PanelApiSimulada extends PanelApi {
  /** The estado changes an operator makes in this session, by expediente id. */
  readonly #estados = new Map<string, EstadoExpediente>();

  #sesion: SesionPanel | null = null;

  /**
   * `PRODUCTO`'s defaults, verbatim from the source (`:2340`), minus the four
   * fields the API contract does not carry.
   */
  #producto: Producto = {
    monto_min: 5000,
    monto_max: 200000,
    plazo_min: 6,
    plazo_max: 72,
    tasa_anual: 36,
    comision_apertura: true,
    comision_pct: 2,
    comision_desde: 10000,
  };

  /**
   * The placeholders from `brand.config.ts`, so the demo shows the shape of
   * the card without inventing a real company's details.
   */
  #sofom: DatosSofom = {
    razon_social: 'ONP FER, S.A. de C.V., SOFOM, E.N.R.',
    rfc: '',
    domicilio: '',
    telefono: '',
    correo_contacto: '',
  };

  /** Uploaded templates, newest first. Empty until one is uploaded. */
  #plantillas: Plantilla[] = [];

  #siguienteVersion = 1;

  override iniciarSesion(credenciales: CredencialesPanel): Observable<RespuestaLogin> {
    const correo = credenciales.correo.trim();

    if (!correo || !credenciales.password) {
      return this.#falla('VALIDACION', 'Escribe tu correo y tu contraseña', 260);
    }

    this.#sesion = { correo, nombre_completo: 'Personal de demostración' };
    // The real endpoint answers with the name only — the mock must not be
    // more generous than the thing it stands in for, or it hides a bug.
    return of({ nombre_completo: this.#sesion.nombre_completo }).pipe(delay(420));
  }

  override sesionActual(): Observable<SesionPanel> {
    return this.#sesion
      ? of(this.#sesion).pipe(delay(120))
      : this.#falla('NO_AUTORIZADO', 'Tu sesión terminó. Vuelve a entrar.', 120);
  }

  override cerrarSesion(): Observable<void> {
    this.#sesion = null;
    return of(undefined).pipe(delay(120));
  }

  override listarExpedientes(filtros: FiltrosExpedientes): Observable<PaginaExpedientes> {
    // The same three-field match `pintarExpedientes` does
    // (`onp_fer_etapa2_pf.html:5426`): nombre, CURP, folio, case-insensitive.
    const q = filtros.q.toLowerCase().trim();

    const coincide = (e: ExpedienteDetalle): boolean => {
      if (filtros.estado && this.#estadoDe(e) !== filtros.estado) return false;
      if (!q) return true;
      return (
        (e.nombre_completo ?? '').toLowerCase().includes(q) ||
        (e.curp ?? '').toLowerCase().includes(q) ||
        e.folio.toLowerCase().includes(q)
      );
    };

    const encontrados = EXPEDIENTES_SIMULADOS.filter(coincide)
      .slice()
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en));

    const items: ExpedienteResumen[] = encontrados
      .slice(filtros.offset, filtros.offset + filtros.limit)
      .map((e) => ({
        id: e.id,
        folio: e.folio,
        nombre_completo: e.nombre_completo,
        curp: e.curp,
        estado: this.#estadoDe(e),
        monto_solicitado: e.monto_solicitado,
        creado_en: e.creado_en,
      }));

    return of({ items, total: encontrados.length }).pipe(delay(320));
  }

  override obtenerExpediente(id: string): Observable<ExpedienteDetalle> {
    const encontrado = EXPEDIENTES_SIMULADOS.find((e) => e.id === id);
    if (!encontrado) {
      return this.#falla('NO_ENCONTRADO', 'El expediente ya no existe.', 200);
    }
    return of({ ...encontrado, estado: this.#estadoDe(encontrado) }).pipe(delay(360));
  }

  override urlArchivo(id: string, tipo: TipoArchivo): Observable<UrlFirmada> {
    const url = this.#archivoDe(id, tipo);
    if (!url) {
      return this.#falla('NO_ENCONTRADO', 'Ese archivo no está en el expediente.', 180);
    }

    // Five minutes, matching the contract, so the expiry logic in the view is
    // exercised against a realistic value.
    return of({
      url,
      expiraEn: new Date(Date.now() + 5 * 60_000).toISOString(),
    }).pipe(delay(240));
  }

  override cambiarEstado(id: string, estado: EstadoExpediente): Observable<EstadoExpediente> {
    if (!EXPEDIENTES_SIMULADOS.some((e) => e.id === id)) {
      return this.#falla('NO_ENCONTRADO', 'El expediente ya no existe.', 200);
    }
    this.#estados.set(id, estado);
    return of(estado).pipe(delay(300));
  }

  override obtenerProducto(): Observable<Producto> {
    return of(this.#producto).pipe(delay(240));
  }

  override guardarProducto(producto: Producto): Observable<Producto> {
    this.#producto = producto;
    return of(producto).pipe(delay(380));
  }

  override obtenerSofom(): Observable<DatosSofom> {
    return of(this.#sofom).pipe(delay(200));
  }

  override guardarSofom(datos: DatosSofom): Observable<DatosSofom> {
    this.#sofom = datos;
    return of(datos).pipe(delay(340));
  }

  override listarPlantillas(): Observable<readonly PlantillaResumen[]> {
    return of(this.#plantillas.map(sinContenido)).pipe(delay(220));
  }

  override obtenerPlantilla(id: string): Observable<Plantilla> {
    const encontrada = this.#plantillas.find((p) => p.id === id);
    return encontrada
      ? of(encontrada).pipe(delay(220))
      : this.#falla('NO_ENCONTRADO', 'Ese formato ya no existe.', 180);
  }

  override crearPlantilla(nueva: NuevaPlantilla): Observable<Plantilla> {
    // A new upload supersedes the active one, the way a soft-versioned table
    // does: the previous row stays, deactivated.
    this.#plantillas = this.#plantillas.map((p) =>
      p.clave === nueva.clave ? { ...p, activa: false } : p,
    );

    const creada: Plantilla = {
      ...nueva,
      id: `plantilla-${this.#siguienteVersion}`,
      version: this.#siguienteVersion++,
      activa: true,
      creado_en: new Date().toISOString(),
    };
    this.#plantillas = [creada, ...this.#plantillas];

    // The Worker answers with the whole row, contenido_html included.
    return of(creada).pipe(delay(420));
  }

  override desactivarPlantilla(id: string): Observable<void> {
    if (!this.#plantillas.some((p) => p.id === id)) {
      return this.#falla('NO_ENCONTRADO', 'Ese formato ya no existe.', 180);
    }
    this.#plantillas = this.#plantillas.map((p) => (p.id === id ? { ...p, activa: false } : p));
    return of(undefined).pipe(delay(300));
  }

  override exportarExpedientes(): Observable<Blob> {
    const cuerpo = JSON.stringify(EXPEDIENTES_SIMULADOS, null, 2);
    return of(new Blob([cuerpo], { type: 'application/json' })).pipe(delay(480));
  }

  #estadoDe(expediente: ExpedienteDetalle): EstadoExpediente {
    return this.#estados.get(expediente.id) ?? expediente.estado;
  }

  /**
   * Only the slots the detail view actually paints have a stand-in: the three
   * images and the videograbación. A document upload is a PDF in the real
   * bucket and the view lists it rather than painting it, so there is nothing
   * to invent.
   *
   * The video is one clip for every expediente that has one, not one per
   * person: it is a placeholder for the bytes, and three copies of the same
   * 10 kB drawing would only be three copies.
   */
  #archivoDe(id: string, tipo: TipoArchivo): string | null {
    const juego = {
      'a7f3c2d1-9e44-4b21-8f07-2c5d3e1a9b60': IMAGENES_SIMULADAS.paez,
      'b2e91f47-3a05-4c8d-91be-7d4a60c3f215': IMAGENES_SIMULADAS.robles,
      'c5d80b36-71fa-4e93-a2c4-8b19f7e0d452': IMAGENES_SIMULADAS.villalobos,
    }[id];

    if (!juego) return null;
    if (tipo === TIPO_ARCHIVO_VIDEO) return this.#tieneArchivo(id, tipo) ? VIDEO_SIMULADO : null;
    if (tipo === 'id_frente' || tipo === 'id_reverso' || tipo === 'firma') return juego[tipo];
    return null;
  }

  /**
   * Whether the expediente really carries that file.
   *
   * The images predate this check and get away without it, but the video does
   * not: the seeded Robles expediente declares `video_grabado` and has no
   * `video_identificacion` row, and a mock that handed back a clip anyway
   * would make the "recorded but the file never arrived" state unreachable —
   * the one state the panel most needs to be able to show (CP-V1's
   * `archivosFallidos`).
   */
  #tieneArchivo(id: string, tipo: TipoArchivo): boolean {
    const expediente = EXPEDIENTES_SIMULADOS.find((e) => e.id === id);
    return expediente?.archivos.some((a) => a.tipo === tipo) ?? false;
  }

  /**
   * The `{ error: { code, message } }` envelope, shaped like the one the error
   * interceptor hands on from a real response, so a caller cannot tell which
   * implementation it is talking to.
   *
   * `timer().pipe(switchMap(…))` rather than `throwError().pipe(delay(…))`:
   * `delay` passes an error straight through, so the latter would fail
   * instantly and the loading state would never be exercised.
   */
  #falla<T>(code: ErrorApi['code'], message: string, ms: number): Observable<T> {
    return timer(ms).pipe(switchMap(() => throwError((): ErrorApi => ({ code, message }))));
  }
}

/** `GET /plantillas` omits the body; the list has no use for a document. */
function sinContenido(plantilla: Plantilla): PlantillaResumen {
  const { contenido_html: _omitido, ...resumen } = plantilla;
  return resumen;
}
