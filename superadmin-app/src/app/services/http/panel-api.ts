import { Observable } from 'rxjs';

import { ExpedienteDetalle, TipoArchivo, UrlFirmada } from '../../model/interfaces/expediente-detalle';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import {
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

/**
 * The panel's whole surface onto the backend.
 *
 * One abstract class, two implementations: `PanelApiHttp` talks to the Worker,
 * `PanelApiSimulada` answers from memory. Which one is provided is decided in
 * `app.config.ts` from `environment.usarApiSimulada`, so swapping the panel
 * onto the real API is a line in an environment file and nothing else. The
 * backend (CP-B4, CP-B7) is being built in parallel with this track and did
 * not exist while the panel was written.
 *
 * An abstract class rather than an interface plus an `InjectionToken`: it is
 * its own DI token, and `inject(PanelApi)` type-checks without a cast.
 *
 * Only NGXS action handlers call these methods (§7). A component dispatches
 * and reads a selector; it never reaches an http service directly.
 */
export abstract class PanelApi {
  /**
   * `POST /admin/login` — sets the httpOnly session cookie.
   *
   * Answers with the name only; the full profile comes from `sesionActual()`.
   */
  abstract iniciarSesion(credenciales: CredencialesPanel): Observable<RespuestaLogin>;

  /** `GET /admin/me` — restores a session from the cookie on a cold load. */
  abstract sesionActual(): Observable<SesionPanel>;

  /** `POST /admin/logout`. */
  abstract cerrarSesion(): Observable<void>;

  /** `GET /expedientes` — the table. */
  abstract listarExpedientes(filtros: FiltrosExpedientes): Observable<PaginaExpedientes>;

  /** `GET /expedientes/:id` — the detail view. Carries no signed URLs. */
  abstract obtenerExpediente(id: string): Observable<ExpedienteDetalle>;

  /**
   * `GET /expedientes/:id/archivos/:tipo` — one short-lived signed URL, five
   * minutes, minted only for a file the caller is about to paint and never
   * written to storage (§12).
   */
  abstract urlArchivo(id: string, tipo: TipoArchivo): Observable<UrlFirmada>;

  /** `PATCH /expedientes/:id` — the estado change from `:5640`. */
  abstract cambiarEstado(id: string, estado: EstadoExpediente): Observable<EstadoExpediente>;

  /** `GET /producto` — the simulator parameters. Public, but read here too. */
  abstract obtenerProducto(): Observable<Producto>;

  /** `PUT /producto` — edits what the prospect's simulator shows. */
  abstract guardarProducto(producto: Producto): Observable<Producto>;

  /** `GET /sofom` — the identity substituted into the solicitud. */
  abstract obtenerSofom(): Observable<DatosSofom>;

  /** `PUT /sofom`. Requires `rol === 'administrador'`; 403 otherwise. */
  abstract guardarSofom(datos: DatosSofom): Observable<DatosSofom>;

  /** `GET /plantillas` — without `contenido_html`. */
  abstract listarPlantillas(): Observable<readonly PlantillaResumen[]>;

  /** `GET /plantillas/:id` — the row, with its converted body. */
  abstract obtenerPlantilla(id: string): Observable<Plantilla>;

  /**
   * `POST /plantillas`. The `.docx` is parsed in the browser (JSZip cannot
   * ride in a Worker, same platform constraint as the OCR) and only the
   * resulting HTML is sent.
   */
  abstract crearPlantilla(plantilla: NuevaPlantilla): Observable<Plantilla>;

  /** `DELETE /plantillas/:id` — a soft deactivate, not a delete. */
  abstract desactivarPlantilla(id: string): Observable<void>;

  /**
   * `GET /expedientes/exportar` — the full expediente set.
   *
   * A `Blob`, never a parsed object: this is bulk PII on its way to a file on
   * the operator's disk and nothing in the app should be able to read it, log
   * it, or hold it in a store.
   */
  abstract exportarExpedientes(): Observable<Blob>;
}
