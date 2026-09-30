import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EstadoExpediente } from '../../model/interfaces/estado-expediente';
import {
  ExpedienteDetalle,
  TipoArchivo,
  UrlFirmada,
} from '../../model/interfaces/expediente-detalle';
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
import { PanelApi } from './panel-api';

/**
 * The real `PanelApi`: the Worker from CP-B1, over `fetch`.
 *
 * `withCredentials` on every call, because the session is an httpOnly cookie
 * (`02-api-contract.md`, "Authenticated") that JavaScript cannot read or
 * attach by hand.
 *
 * **Nothing in this file logs a response.** These payloads are the most PII in
 * the product — CURP, RFC, address, income, geolocation. A `console.log` left
 * behind here would put a loan applicant's identity documents in a browser
 * console and, on a shared demo machine, on a projector. The error
 * interceptor logs a status code and a request path, never a body (§1, §10).
 */
@Injectable()
export class PanelApiHttp extends PanelApi {
  readonly #http = inject(HttpClient);
  readonly #base = environment.apiBaseUrl;

  override iniciarSesion(credenciales: CredencialesPanel): Observable<RespuestaLogin> {
    return this.#http.post<RespuestaLogin>(`${this.#base}/admin/login`, credenciales, {
      withCredentials: true,
    });
  }

  override sesionActual(): Observable<SesionPanel> {
    return this.#http.get<SesionPanel>(`${this.#base}/admin/me`, { withCredentials: true });
  }

  override cerrarSesion(): Observable<void> {
    return this.#http
      .post<void>(`${this.#base}/admin/logout`, {}, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  override listarExpedientes(filtros: FiltrosExpedientes): Observable<PaginaExpedientes> {
    let params = new HttpParams()
      .set('limit', String(filtros.limit))
      .set('offset', String(filtros.offset));

    if (filtros.q) params = params.set('q', filtros.q);
    if (filtros.estado) params = params.set('estado', filtros.estado);

    return this.#http.get<PaginaExpedientes>(`${this.#base}/expedientes`, {
      params,
      withCredentials: true,
    });
  }

  override obtenerExpediente(id: string): Observable<ExpedienteDetalle> {
    return this.#http.get<ExpedienteDetalle>(
      `${this.#base}/expedientes/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }

  override urlArchivo(id: string, tipo: TipoArchivo): Observable<UrlFirmada> {
    return this.#http.get<UrlFirmada>(
      `${this.#base}/expedientes/${encodeURIComponent(id)}/archivos/${tipo}`,
      { withCredentials: true },
    );
  }

  override cambiarEstado(id: string, estado: EstadoExpediente): Observable<EstadoExpediente> {
    return this.#http
      .patch<{ estado: EstadoExpediente }>(
        `${this.#base}/expedientes/${encodeURIComponent(id)}`,
        { estado },
        { withCredentials: true },
      )
      .pipe(map((r) => r.estado));
  }

  override obtenerProducto(): Observable<Producto> {
    return this.#http.get<Producto>(`${this.#base}/producto`, { withCredentials: true });
  }

  override guardarProducto(producto: Producto): Observable<Producto> {
    return this.#http.put<Producto>(`${this.#base}/producto`, producto, {
      withCredentials: true,
    });
  }

  override obtenerSofom(): Observable<DatosSofom> {
    return this.#http.get<DatosSofom>(`${this.#base}/sofom`, { withCredentials: true });
  }

  override guardarSofom(datos: DatosSofom): Observable<DatosSofom> {
    return this.#http.put<DatosSofom>(`${this.#base}/sofom`, datos, {
      withCredentials: true,
    });
  }

  override listarPlantillas(): Observable<readonly PlantillaResumen[]> {
    return this.#http.get<PlantillaResumen[]>(`${this.#base}/plantillas`, {
      withCredentials: true,
    });
  }

  override obtenerPlantilla(id: string): Observable<Plantilla> {
    return this.#http.get<Plantilla>(`${this.#base}/plantillas/${encodeURIComponent(id)}`, {
      withCredentials: true,
    });
  }

  override crearPlantilla(plantilla: NuevaPlantilla): Observable<Plantilla> {
    return this.#http.post<Plantilla>(`${this.#base}/plantillas`, plantilla, {
      withCredentials: true,
    });
  }

  override desactivarPlantilla(id: string): Observable<void> {
    return this.#http
      .delete<void>(`${this.#base}/plantillas/${encodeURIComponent(id)}`, {
        withCredentials: true,
      })
      .pipe(map(() => undefined));
  }

  /**
   * The export arrives as a `Blob` and is handed straight to a download.
   *
   * `responseType: 'blob'` so the payload is never parsed into JavaScript
   * objects: it is every expediente in the database — CURP, RFC, addresses,
   * incomes — and the less of it that exists as readable state, the smaller
   * the surface for it to end up somewhere it should not. Nothing logs it.
   */
  override exportarExpedientes(): Observable<Blob> {
    return this.#http.get(`${this.#base}/expedientes/exportar`, {
      responseType: 'blob',
      withCredentials: true,
    });
  }
}
