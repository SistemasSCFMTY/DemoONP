import { Observable } from 'rxjs';

import { ExpedienteDetalle, TipoArchivo, UrlFirmada } from '../../model/interfaces/expediente-detalle';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import {
  FiltrosExpedientes,
  PaginaExpedientes,
} from '../../model/interfaces/expediente-resumen';
import { CredencialesPanel, SesionPanel } from '../../model/interfaces/sesion-panel';

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
  /** `POST /admin/login` — sets the httpOnly session cookie. */
  abstract iniciarSesion(credenciales: CredencialesPanel): Observable<SesionPanel>;

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
}
